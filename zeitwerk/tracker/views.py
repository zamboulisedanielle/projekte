import csv
from datetime import date, timedelta
from decimal import Decimal

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.core.exceptions import PermissionDenied
from django.db.models import Count, DecimalField, F, Q, Sum
from django.db.models.functions import Coalesce
from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect, render
from django.urls import reverse_lazy
from django.views.generic import CreateView, DeleteView, DetailView, ListView, UpdateView

from .forms import CustomerForm, EntryFilterForm, InvoiceForm, ProjectForm, TimeEntryForm
from .models import Customer, Invoice, Project, TimeEntry, money
from .services import NothingToInvoice, create_invoice

ZERO = Decimal("0")


# ---------------------------------------------------------------- dashboard
@login_required
def dashboard(request):
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    month_start = today.replace(day=1)

    my_entries = TimeEntry.objects.filter(user=request.user)
    hours_week = my_entries.filter(date__gte=week_start).aggregate(s=Sum("hours"))["s"] or ZERO
    hours_month = my_entries.filter(date__gte=month_start).aggregate(s=Sum("hours"))["s"] or ZERO

    unbilled = TimeEntry.objects.filter(billable=True, invoice__isnull=True).aggregate(
        s=Coalesce(Sum(F("hours") * F("project__hourly_rate"), output_field=DecimalField()), ZERO)
    )["s"]

    projects = (
        Project.objects.filter(status=Project.Status.ACTIVE)
        .select_related("customer")
        .annotate(hours=Coalesce(Sum("entries__hours"), ZERO))
        .order_by("-hours")
    )
    max_hours = max([p.hours for p in projects] + [Decimal("1")])
    project_rows = [
        {
            "project": p,
            "hours": p.hours,
            "bar": int(p.hours / max_hours * 100),
            "budget_pct": int(p.hours / p.budget_hours * 100) if p.budget_hours else None,
        }
        for p in projects
    ]

    # hours per day of the current week (for a small bar chart)
    week_days = []
    for i in range(7):
        d = week_start + timedelta(days=i)
        h = my_entries.filter(date=d).aggregate(s=Sum("hours"))["s"] or ZERO
        week_days.append({"day": d, "hours": h, "bar": int(min(h / 10, 1) * 100)})

    return render(request, "tracker/dashboard.html", {
        "hours_week": hours_week,
        "hours_month": hours_month,
        "unbilled": money(unbilled),
        "project_rows": project_rows,
        "week_days": week_days,
        "recent": my_entries.select_related("project__customer")[:6],
        "invoice_count": Invoice.objects.count(),
    })


# ---------------------------------------------------------------- customers
class CustomerList(LoginRequiredMixin, ListView):
    model = Customer
    template_name = "tracker/customer_list.html"

    def get_queryset(self):
        return Customer.objects.annotate(
            project_count=Count("projects", distinct=True)
        )


class CustomerDetail(LoginRequiredMixin, DetailView):
    model = Customer
    template_name = "tracker/customer_detail.html"


class CustomerCreate(LoginRequiredMixin, CreateView):
    model = Customer
    form_class = CustomerForm
    template_name = "tracker/form.html"
    extra_context = {"title": "Neuer Kunde"}


class CustomerUpdate(LoginRequiredMixin, UpdateView):
    model = Customer
    form_class = CustomerForm
    template_name = "tracker/form.html"
    extra_context = {"title": "Kunde bearbeiten"}


# ---------------------------------------------------------------- projects
class ProjectList(LoginRequiredMixin, ListView):
    model = Project
    template_name = "tracker/project_list.html"

    def get_queryset(self):
        qs = Project.objects.select_related("customer")
        status = self.request.GET.get("status", "active")
        if status in Project.Status.values:
            qs = qs.filter(status=status)
        return qs

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx["status"] = self.request.GET.get("status", "active")
        return ctx


class ProjectDetail(LoginRequiredMixin, DetailView):
    model = Project
    template_name = "tracker/project_detail.html"

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx["entries"] = self.object.entries.select_related("user", "invoice")[:50]
        ctx["by_user"] = (
            self.object.entries.values("user__username")
            .annotate(hours=Sum("hours")).order_by("-hours")
        )
        return ctx


class ProjectCreate(LoginRequiredMixin, CreateView):
    model = Project
    form_class = ProjectForm
    template_name = "tracker/form.html"
    extra_context = {"title": "Neues Projekt"}

    def get_initial(self):
        return {"customer": self.request.GET.get("customer")}


class ProjectUpdate(LoginRequiredMixin, UpdateView):
    model = Project
    form_class = ProjectForm
    template_name = "tracker/form.html"
    extra_context = {"title": "Projekt bearbeiten"}


# ---------------------------------------------------------------- time entries
def filtered_entries(request):
    """Shared filter logic for the list view and the CSV export."""
    form = EntryFilterForm(request.GET or None)
    qs = TimeEntry.objects.select_related("project__customer", "user", "invoice")
    if form.is_valid():
        if form.cleaned_data["project"]:
            qs = qs.filter(project=form.cleaned_data["project"])
        if form.cleaned_data["mine"]:
            qs = qs.filter(user=request.user)
        month = form.cleaned_data["month"]
        if month:
            try:
                year, mon = (int(x) for x in month.split("-"))
                qs = qs.filter(date__year=year, date__month=mon)
            except ValueError:
                pass
    return form, qs


@login_required
def entry_list(request):
    form, qs = filtered_entries(request)
    total = qs.aggregate(s=Sum("hours"))["s"] or ZERO
    return render(request, "tracker/entry_list.html", {
        "form": form, "entries": qs[:200], "total": total,
        "query": request.GET.urlencode(),
    })


@login_required
def entry_csv(request):
    _, qs = filtered_entries(request)
    response = HttpResponse(content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = 'attachment; filename="zeiteintraege.csv"'
    response.write("﻿")  # BOM so Excel opens umlauts correctly
    writer = csv.writer(response, delimiter=";")
    writer.writerow(["Datum", "Mitarbeiter", "Kunde", "Projekt", "Stunden", "Tätigkeit",
                     "Abrechenbar", "Rechnung"])
    for e in qs:
        writer.writerow([
            e.date.strftime("%d.%m.%Y"), e.user.username, e.project.customer.name,
            e.project.name, str(e.hours).replace(".", ","), e.description,
            "ja" if e.billable else "nein", e.invoice.number if e.invoice else "",
        ])
    return response


class OwnEntryMixin(LoginRequiredMixin):
    """Users may only change their own entries, and only while not invoiced."""

    def get_object(self, queryset=None):
        entry = super().get_object(queryset)
        if entry.user != self.request.user and not self.request.user.is_staff:
            raise PermissionDenied("Das ist nicht dein Eintrag.")
        if entry.is_locked:
            raise PermissionDenied("Bereits abgerechnete Einträge können nicht geändert werden.")
        return entry


class EntryCreate(LoginRequiredMixin, CreateView):
    model = TimeEntry
    form_class = TimeEntryForm
    template_name = "tracker/form.html"
    extra_context = {"title": "Zeit erfassen"}
    success_url = reverse_lazy("entry_list")

    def get_initial(self):
        return {"date": date.today(), "project": self.request.GET.get("project")}

    def form_valid(self, form):
        form.instance.user = self.request.user
        messages.success(self.request, f"{form.instance.hours} h gespeichert.")
        return super().form_valid(form)


class EntryUpdate(OwnEntryMixin, UpdateView):
    model = TimeEntry
    form_class = TimeEntryForm
    template_name = "tracker/form.html"
    extra_context = {"title": "Zeiteintrag bearbeiten"}
    success_url = reverse_lazy("entry_list")


class EntryDelete(OwnEntryMixin, DeleteView):
    model = TimeEntry
    template_name = "tracker/confirm_delete.html"
    success_url = reverse_lazy("entry_list")


# ---------------------------------------------------------------- invoices
class InvoiceList(LoginRequiredMixin, ListView):
    model = Invoice
    template_name = "tracker/invoice_list.html"

    def get_queryset(self):
        return Invoice.objects.select_related("customer")


class InvoiceDetail(LoginRequiredMixin, DetailView):
    model = Invoice
    template_name = "tracker/invoice_detail.html"


@login_required
def invoice_create(request):
    today = date.today()
    first_of_month = today.replace(day=1)
    last_month_end = first_of_month - timedelta(days=1)
    form = InvoiceForm(request.POST or None, initial={
        "customer": request.GET.get("customer"),
        "period_start": last_month_end.replace(day=1),
        "period_end": last_month_end,
    })
    if request.method == "POST" and form.is_valid():
        try:
            invoice = create_invoice(
                form.cleaned_data["customer"],
                form.cleaned_data["period_start"],
                form.cleaned_data["period_end"],
                request.user,
            )
        except NothingToInvoice as exc:
            form.add_error(None, str(exc))
        else:
            messages.success(request, f"Rechnung {invoice.number} wurde erstellt.")
            return redirect(invoice)
    return render(request, "tracker/form.html", {"form": form, "title": "Rechnung erstellen"})


# ---------------------------------------------------------------- JSON API
@login_required
def api_projects(request):
    """Small read-only JSON endpoint, e.g. for a mobile app or a reporting tool."""
    projects = Project.objects.select_related("customer").annotate(
        hours=Coalesce(Sum("entries__hours"), ZERO),
        unbilled_hours=Coalesce(
            Sum("entries__hours", filter=Q(entries__billable=True, entries__invoice__isnull=True)),
            ZERO,
        ),
    )
    data = [
        {
            "id": p.id,
            "customer": p.customer.name,
            "name": p.name,
            "status": p.status,
            "hourly_rate": str(p.hourly_rate),
            "budget_hours": str(p.budget_hours) if p.budget_hours else None,
            "hours": str(money(p.hours)),
            "unbilled_amount": str(money(p.unbilled_hours * p.hourly_rate)),
        }
        for p in projects
    ]
    return JsonResponse({"count": len(data), "results": data})
