from decimal import ROUND_HALF_UP, Decimal

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Sum
from django.urls import reverse

CENT = Decimal("0.01")


def money(value) -> Decimal:
    """Round a Decimal to cents (commercial rounding)."""
    return Decimal(value).quantize(CENT, rounding=ROUND_HALF_UP)


class Customer(models.Model):
    name = models.CharField("Firma", max_length=120, unique=True)
    contact_person = models.CharField("Ansprechpartner", max_length=120, blank=True)
    email = models.EmailField("E-Mail", blank=True)
    city = models.CharField("Ort", max_length=80, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Kunde"
        verbose_name_plural = "Kunden"

    def __str__(self):
        return self.name

    def get_absolute_url(self):
        return reverse("customer_detail", args=[self.pk])

    def unbilled_entries(self):
        return TimeEntry.objects.filter(
            project__customer=self, billable=True, invoice__isnull=True
        )


class Project(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Aktiv"
        DONE = "done", "Abgeschlossen"

    customer = models.ForeignKey(
        Customer, on_delete=models.PROTECT, related_name="projects", verbose_name="Kunde"
    )
    name = models.CharField("Projektname", max_length=120)
    description = models.TextField("Beschreibung", blank=True)
    hourly_rate = models.DecimalField(
        "Stundensatz (€)", max_digits=7, decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    budget_hours = models.DecimalField(
        "Budget (Stunden)", max_digits=7, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(Decimal("0.25"))],
    )
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["customer__name", "name"]
        constraints = [
            models.UniqueConstraint(fields=["customer", "name"], name="unique_project_per_customer")
        ]
        verbose_name = "Projekt"
        verbose_name_plural = "Projekte"

    def __str__(self):
        return f"{self.customer} – {self.name}"

    def get_absolute_url(self):
        return reverse("project_detail", args=[self.pk])

    @property
    def total_hours(self) -> Decimal:
        return self.entries.aggregate(s=Sum("hours"))["s"] or Decimal("0")

    @property
    def billable_amount(self) -> Decimal:
        hours = self.entries.filter(billable=True).aggregate(s=Sum("hours"))["s"] or Decimal("0")
        return money(hours * self.hourly_rate)

    @property
    def budget_used_percent(self):
        if not self.budget_hours:
            return None
        return int(self.total_hours / self.budget_hours * 100)

    @property
    def over_budget(self) -> bool:
        return self.budget_hours is not None and self.total_hours > self.budget_hours


class Invoice(models.Model):
    customer = models.ForeignKey(
        Customer, on_delete=models.PROTECT, related_name="invoices", verbose_name="Kunde"
    )
    number = models.CharField("Rechnungsnummer", max_length=20, unique=True)
    issue_date = models.DateField("Rechnungsdatum")
    period_start = models.DateField("Leistungszeitraum von")
    period_end = models.DateField("Leistungszeitraum bis")
    vat_rate = models.PositiveSmallIntegerField("USt. (%)")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-issue_date", "-number"]
        verbose_name = "Rechnung"
        verbose_name_plural = "Rechnungen"

    def __str__(self):
        return self.number

    def get_absolute_url(self):
        return reverse("invoice_detail", args=[self.pk])

    def line_items(self):
        """One line per project: hours, rate and net amount."""
        rows = (
            self.entries.values("project__name", "project__hourly_rate")
            .annotate(hours=Sum("hours"))
            .order_by("project__name")
        )
        return [
            {
                "project": r["project__name"],
                "hours": r["hours"],
                "rate": r["project__hourly_rate"],
                "amount": money(r["hours"] * r["project__hourly_rate"]),
            }
            for r in rows
        ]

    @property
    def net_total(self) -> Decimal:
        return money(sum((i["amount"] for i in self.line_items()), Decimal("0")))

    @property
    def vat_amount(self) -> Decimal:
        return money(self.net_total * self.vat_rate / 100)

    @property
    def gross_total(self) -> Decimal:
        return self.net_total + self.vat_amount


class TimeEntry(models.Model):
    project = models.ForeignKey(
        Project, on_delete=models.PROTECT, related_name="entries", verbose_name="Projekt"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="time_entries"
    )
    date = models.DateField("Datum")
    hours = models.DecimalField(
        "Stunden", max_digits=4, decimal_places=2,
        validators=[MinValueValidator(Decimal("0.25")), MaxValueValidator(Decimal("12"))],
    )
    description = models.CharField("Tätigkeit", max_length=255)
    billable = models.BooleanField("Abrechenbar", default=True)
    invoice = models.ForeignKey(
        Invoice, on_delete=models.SET_NULL, null=True, blank=True, related_name="entries"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-created_at"]
        verbose_name = "Zeiteintrag"
        verbose_name_plural = "Zeiteinträge"

    def __str__(self):
        return f"{self.date} {self.user} {self.hours} h – {self.project.name}"

    @property
    def is_locked(self) -> bool:
        """Invoiced entries must not be changed anymore."""
        return self.invoice_id is not None
