"""Create realistic demo data:  python manage.py seed_demo"""
import random
from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from tracker.models import Customer, Invoice, Project, TimeEntry
from tracker.services import create_invoice

CUSTOMERS = [
    ("Bäckerei Hoffmann GmbH", "Anna Hoffmann", "Olpe", [
        ("Online-Shop Relaunch", 85, 120, "Neuer Shop mit Click & Collect."),
        ("Wartung 2026", 70, None, "Laufende Wartung und kleine Änderungen."),
    ]),
    ("Autohaus Becker KG", "Thomas Becker", "Gummersbach", [
        ("Werkstatt-Terminbuchung", 90, 80, "Django-Webapp zur Online-Terminvergabe."),
    ]),
    ("Stadtwerke Siegen", "Dr. Petra Klein", "Siegen", [
        ("Störungsmelder App", 95, 200, "Bürger melden Störungen per App, Backend in Django."),
        ("Datenexport Schnittstelle", 95, 40, "CSV/JSON-Schnittstelle für das Reporting."),
    ]),
    ("Fitnessstudio PowerFit", "Kevin Schulz", "Köln", [
        ("Mitgliederportal", 80, 60, "Kursbuchung und Vertragsübersicht."),
    ]),
]

TASKS = [
    "Anforderungen mit Kunde abgestimmt", "Datenmodell entworfen", "Django-Models und Migrationen",
    "Formularvalidierung umgesetzt", "Unit-Tests geschrieben", "Bugfix im Login",
    "Code-Review und Refactoring", "Template-Layout überarbeitet", "API-Endpunkt erweitert",
    "Deployment vorbereitet", "Daily / Abstimmung im Team", "Dokumentation aktualisiert",
]


class Command(BaseCommand):
    help = "Legt Demo-Benutzer, Kunden, Projekte, Zeiten und Rechnungen an."

    @transaction.atomic
    def handle(self, *args, **options):
        random.seed(42)
        User = get_user_model()
        TimeEntry.objects.all().delete()
        Invoice.objects.all().delete()
        Project.objects.all().delete()
        Customer.objects.all().delete()

        users = []
        for username, first, staff in [("demo", "Lise", True), ("max", "Max", False), ("sara", "Sara", False)]:
            user, _ = User.objects.get_or_create(username=username, defaults={"first_name": first})
            user.first_name, user.is_staff, user.is_superuser = first, staff, staff
            user.set_password("demo1234")
            user.save()
            users.append(user)

        projects = []
        for name, contact, city, plist in CUSTOMERS:
            customer = Customer.objects.create(
                name=name, contact_person=contact, city=city,
                email=f"kontakt@{name.split()[0].lower()}.example",
            )
            for pname, rate, budget, desc in plist:
                projects.append(Project.objects.create(
                    customer=customer, name=pname, description=desc,
                    hourly_rate=Decimal(rate), budget_hours=Decimal(budget) if budget else None,
                ))
        Project.objects.filter(name="Datenexport Schnittstelle").update(status=Project.Status.DONE)

        today = date.today()
        for offset in range(70, -1, -1):
            day = today - timedelta(days=offset)
            if day.weekday() >= 5:
                continue
            for user in users:
                for project in random.sample(projects, k=random.randint(1, 2)):
                    TimeEntry.objects.create(
                        project=project, user=user, date=day,
                        hours=Decimal(random.choice([1, 1.5, 2, 2.5, 3, 3.5, 4])),
                        description=random.choice(TASKS),
                        billable=random.random() > 0.12,
                    )

        # Invoice the first of the two past months for two customers
        first_this_month = today.replace(day=1)
        end_prev = first_this_month - timedelta(days=1)
        start_prev = end_prev.replace(day=1)
        for customer in Customer.objects.filter(city__in=["Olpe", "Siegen"]):
            period_start = (start_prev - timedelta(days=1)).replace(day=1)  # two full months
            create_invoice(customer, period_start, end_prev, users[0])

        self.stdout.write(self.style.SUCCESS(
            f"Demo-Daten erstellt: {Customer.objects.count()} Kunden, {Project.objects.count()} Projekte, "
            f"{TimeEntry.objects.count()} Zeiteinträge, {Invoice.objects.count()} Rechnungen. "
            "Login: demo / demo1234"
        ))
