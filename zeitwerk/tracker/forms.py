from datetime import date

from django import forms

from .models import Customer, Project, TimeEntry


class DateInput(forms.DateInput):
    """HTML5 date picker; browsers expect ISO format (YYYY-MM-DD)."""
    input_type = "date"

    def __init__(self, attrs=None):
        super().__init__(attrs=attrs, format="%Y-%m-%d")


class CustomerForm(forms.ModelForm):
    class Meta:
        model = Customer
        fields = ["name", "contact_person", "email", "city"]


class ProjectForm(forms.ModelForm):
    class Meta:
        model = Project
        fields = ["customer", "name", "description", "hourly_rate", "budget_hours", "status"]
        widgets = {"description": forms.Textarea(attrs={"rows": 3})}


class TimeEntryForm(forms.ModelForm):
    class Meta:
        model = TimeEntry
        fields = ["project", "date", "hours", "description", "billable"]
        widgets = {
            "date": DateInput(),
            "hours": forms.NumberInput(attrs={"step": "0.25", "min": "0.25", "max": "12"}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Only active projects can receive new hours.
        self.fields["project"].queryset = Project.objects.filter(
            status=Project.Status.ACTIVE
        ).select_related("customer")

    def clean_date(self):
        value = self.cleaned_data["date"]
        if value > date.today():
            raise forms.ValidationError("Zeiten können nicht in der Zukunft erfasst werden.")
        return value

    def clean_hours(self):
        value = self.cleaned_data["hours"]
        if (value * 4) % 1 != 0:
            raise forms.ValidationError("Bitte in Viertelstunden erfassen (z. B. 1,25 oder 2,5).")
        return value


class InvoiceForm(forms.Form):
    customer = forms.ModelChoiceField(queryset=Customer.objects.all(), label="Kunde")
    period_start = forms.DateField(label="Zeitraum von", widget=DateInput())
    period_end = forms.DateField(label="Zeitraum bis", widget=DateInput())

    def clean(self):
        data = super().clean()
        start, end = data.get("period_start"), data.get("period_end")
        if start and end and start > end:
            raise forms.ValidationError("Das Startdatum muss vor dem Enddatum liegen.")
        return data


class EntryFilterForm(forms.Form):
    project = forms.ModelChoiceField(
        queryset=Project.objects.select_related("customer"), required=False, label="Projekt"
    )
    month = forms.CharField(
        required=False, label="Monat",
        widget=forms.TextInput(attrs={"type": "month"}),
    )
    mine = forms.BooleanField(required=False, label="Nur meine")
