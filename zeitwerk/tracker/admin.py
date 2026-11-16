from django.contrib import admin

from .models import Customer, Invoice, Project, TimeEntry


class ProjectInline(admin.TabularInline):
    model = Project
    extra = 0
    fields = ["name", "hourly_rate", "budget_hours", "status"]


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ["name", "contact_person", "city"]
    search_fields = ["name", "contact_person"]
    inlines = [ProjectInline]


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ["name", "customer", "hourly_rate", "budget_hours", "status"]
    list_filter = ["status", "customer"]
    search_fields = ["name"]


@admin.register(TimeEntry)
class TimeEntryAdmin(admin.ModelAdmin):
    list_display = ["date", "user", "project", "hours", "billable", "invoice"]
    list_filter = ["billable", "project__customer", "user"]
    date_hierarchy = "date"
    search_fields = ["description"]


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ["number", "customer", "issue_date", "period_start", "period_end"]
    readonly_fields = ["number", "created_by", "created_at"]
