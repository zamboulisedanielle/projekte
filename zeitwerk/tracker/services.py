"""Business logic that does not belong into a single view."""
from datetime import date

from django.conf import settings
from django.db import transaction

from .models import Customer, Invoice


class NothingToInvoice(Exception):
    """Raised when there are no unbilled billable entries in the period."""


def next_invoice_number(issue_date: date) -> str:
    """Return the next number of the form RE-2026-0001 (sequence restarts every year)."""
    prefix = f"{settings.INVOICE_PREFIX}-{issue_date.year}-"
    last = (
        Invoice.objects.filter(number__startswith=prefix).order_by("-number").first()
    )
    seq = int(last.number.rsplit("-", 1)[1]) + 1 if last else 1
    return f"{prefix}{seq:04d}"


@transaction.atomic
def create_invoice(customer: Customer, period_start: date, period_end: date, user,
                   issue_date: date | None = None) -> Invoice:
    """Bundle all unbilled, billable time entries of a customer in a period into one invoice.

    The entries are linked to the invoice, so they can never be billed twice.
    """
    issue_date = issue_date or date.today()
    entries = customer.unbilled_entries().select_for_update().filter(
        date__gte=period_start, date__lte=period_end
    )
    if not entries.exists():
        raise NothingToInvoice("Keine offenen, abrechenbaren Stunden im gewählten Zeitraum.")

    invoice = Invoice.objects.create(
        customer=customer,
        number=next_invoice_number(issue_date),
        issue_date=issue_date,
        period_start=period_start,
        period_end=period_end,
        vat_rate=settings.VAT_RATE,
        created_by=user,
    )
    entries.update(invoice=invoice)
    return invoice
