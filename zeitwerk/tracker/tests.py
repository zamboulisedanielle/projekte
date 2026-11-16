from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from .models import Customer, Project, TimeEntry
from .services import NothingToInvoice, create_invoice, next_invoice_number


class BaseData(TestCase):
    def setUp(self):
        User = get_user_model()
        self.alice = User.objects.create_user("alice", password="pw-12345!")
        self.bob = User.objects.create_user("bob", password="pw-12345!")
        self.customer = Customer.objects.create(name="Kunde A", city="Siegen")
        self.project = Project.objects.create(
            customer=self.customer, name="Webshop", hourly_rate=Decimal("80.00"),
            budget_hours=Decimal("10"),
        )
        self.day = date(2026, 10, 15)

    def entry(self, hours, user=None, billable=True, day=None, project=None):
        return TimeEntry.objects.create(
            project=project or self.project, user=user or self.alice, date=day or self.day,
            hours=Decimal(hours), description="Arbeit", billable=billable,
        )


class ProjectModelTests(BaseData):
    def test_totals_and_budget(self):
        self.entry("4")
        self.entry("2.5", billable=False)
        self.assertEqual(self.project.total_hours, Decimal("6.5"))
        self.assertEqual(self.project.billable_amount, Decimal("320.00"))  # only 4 h billable
        self.assertEqual(self.project.budget_used_percent, 65)
        self.assertFalse(self.project.over_budget)
        self.entry("4")
        self.assertTrue(self.project.over_budget)


class InvoiceServiceTests(BaseData):
    def test_invoice_sums_vat_and_locks_entries(self):
        self.entry("3")
        self.entry("1.25", user=self.bob)
        self.entry("2", billable=False)  # internal, must not be billed
        invoice = create_invoice(self.customer, date(2026, 10, 1), date(2026, 10, 31),
                                 self.alice, issue_date=date(2026, 11, 2))
        self.assertEqual(invoice.number, "RE-2026-0001")
        self.assertEqual(invoice.net_total, Decimal("340.00"))   # 4.25 h * 80 €
        self.assertEqual(invoice.vat_amount, Decimal("64.60"))   # 19 %
        self.assertEqual(invoice.gross_total, Decimal("404.60"))
        self.assertEqual(invoice.entries.count(), 2)

    def test_entries_cannot_be_billed_twice(self):
        self.entry("3")
        create_invoice(self.customer, date(2026, 10, 1), date(2026, 10, 31), self.alice)
        with self.assertRaises(NothingToInvoice):
            create_invoice(self.customer, date(2026, 10, 1), date(2026, 10, 31), self.alice)

    def test_only_entries_inside_period(self):
        self.entry("3")
        self.entry("5", day=date(2026, 9, 30))
        invoice = create_invoice(self.customer, date(2026, 10, 1), date(2026, 10, 31), self.alice)
        self.assertEqual(invoice.net_total, Decimal("240.00"))

    def test_invoice_numbers_count_up_per_year(self):
        self.entry("1")
        create_invoice(self.customer, self.day, self.day, self.alice, issue_date=date(2026, 11, 1))
        self.assertEqual(next_invoice_number(date(2026, 12, 1)), "RE-2026-0002")
        self.assertEqual(next_invoice_number(date(2027, 1, 2)), "RE-2027-0001")


class ViewTests(BaseData):
    def setUp(self):
        super().setUp()
        self.client.login(username="alice", password="pw-12345!")

    def test_login_required(self):
        self.client.logout()
        for name in ["dashboard", "entry_list", "project_list", "api_projects"]:
            response = self.client.get(reverse(name))
            self.assertEqual(response.status_code, 302, name)

    def test_pages_render(self):
        self.entry("2")
        for url in [reverse("dashboard"), reverse("entry_list"), reverse("project_list"),
                    reverse("customer_list"), self.project.get_absolute_url(),
                    self.customer.get_absolute_url(), reverse("invoice_list")]:
            self.assertEqual(self.client.get(url).status_code, 200, url)

    def test_create_entry_sets_current_user(self):
        response = self.client.post(reverse("entry_create"), {
            "project": self.project.pk, "date": self.day.isoformat(), "hours": "1.5",
            "description": "Meeting", "billable": "on",
        })
        self.assertRedirects(response, reverse("entry_list"))
        self.assertEqual(TimeEntry.objects.get().user, self.alice)

    def test_validation_rejects_future_and_odd_hours(self):
        response = self.client.post(reverse("entry_create"), {
            "project": self.project.pk, "date": (date.today() + timedelta(days=1)).isoformat(),
            "hours": "1.1", "description": "x",
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn("date", response.context["form"].errors)
        self.assertIn("hours", response.context["form"].errors)
        self.assertFalse(TimeEntry.objects.exists())

    def test_cannot_book_on_finished_project(self):
        self.project.status = Project.Status.DONE
        self.project.save()
        response = self.client.post(reverse("entry_create"), {
            "project": self.project.pk, "date": self.day.isoformat(), "hours": "1", "description": "x",
        })
        self.assertIn("project", response.context["form"].errors)

    def test_cannot_edit_other_users_entry(self):
        foreign = self.entry("2", user=self.bob)
        response = self.client.get(reverse("entry_update", args=[foreign.pk]))
        self.assertEqual(response.status_code, 403)

    def test_cannot_edit_invoiced_entry(self):
        own = self.entry("2")
        create_invoice(self.customer, self.day, self.day, self.alice)
        response = self.client.post(reverse("entry_delete", args=[own.pk]))
        self.assertEqual(response.status_code, 403)
        self.assertTrue(TimeEntry.objects.filter(pk=own.pk).exists())

    def test_invoice_view_creates_invoice(self):
        self.entry("2")
        response = self.client.post(reverse("invoice_create"), {
            "customer": self.customer.pk, "period_start": "2026-10-01", "period_end": "2026-10-31",
        })
        invoice = self.customer.invoices.get()
        self.assertRedirects(response, invoice.get_absolute_url())
        self.assertContains(self.client.get(invoice.get_absolute_url()), "190,40")  # 160 € + 19 %

    def test_csv_export(self):
        self.entry("1.5")
        response = self.client.get(reverse("entry_csv"))
        self.assertEqual(response["Content-Type"], "text/csv; charset=utf-8")
        content = response.content.decode("utf-8-sig")
        self.assertIn("Datum;Mitarbeiter;Kunde;Projekt", content)
        self.assertIn("15.10.2026;alice;Kunde A;Webshop;1,50", content)

    def test_entry_filter_by_month(self):
        self.entry("1")
        self.entry("2", day=date(2026, 9, 3))
        response = self.client.get(reverse("entry_list"), {"month": "2026-09"})
        self.assertEqual(response.context["total"], Decimal("2"))

    def test_api_projects(self):
        self.entry("2")
        self.entry("1", billable=False)
        data = self.client.get(reverse("api_projects")).json()
        self.assertEqual(data["count"], 1)
        self.assertEqual(data["results"][0]["hours"], "3.00")
        self.assertEqual(data["results"][0]["unbilled_amount"], "160.00")
