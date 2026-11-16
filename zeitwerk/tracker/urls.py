from django.urls import path

from . import views

urlpatterns = [
    path("", views.dashboard, name="dashboard"),
    path("kunden/", views.CustomerList.as_view(), name="customer_list"),
    path("kunden/neu/", views.CustomerCreate.as_view(), name="customer_create"),
    path("kunden/<int:pk>/", views.CustomerDetail.as_view(), name="customer_detail"),
    path("kunden/<int:pk>/bearbeiten/", views.CustomerUpdate.as_view(), name="customer_update"),
    path("projekte/", views.ProjectList.as_view(), name="project_list"),
    path("projekte/neu/", views.ProjectCreate.as_view(), name="project_create"),
    path("projekte/<int:pk>/", views.ProjectDetail.as_view(), name="project_detail"),
    path("projekte/<int:pk>/bearbeiten/", views.ProjectUpdate.as_view(), name="project_update"),
    path("zeiten/", views.entry_list, name="entry_list"),
    path("zeiten/neu/", views.EntryCreate.as_view(), name="entry_create"),
    path("zeiten/export.csv", views.entry_csv, name="entry_csv"),
    path("zeiten/<int:pk>/bearbeiten/", views.EntryUpdate.as_view(), name="entry_update"),
    path("zeiten/<int:pk>/loeschen/", views.EntryDelete.as_view(), name="entry_delete"),
    path("rechnungen/", views.InvoiceList.as_view(), name="invoice_list"),
    path("rechnungen/neu/", views.invoice_create, name="invoice_create"),
    path("rechnungen/<int:pk>/", views.InvoiceDetail.as_view(), name="invoice_detail"),
    path("api/projects/", views.api_projects, name="api_projects"),
]
