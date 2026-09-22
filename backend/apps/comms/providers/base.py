"""
base.py — Abstract provider interface for all comms channels.
Every provider (Africa's Talking, Twilio, Email, Mock) implements this.
"""
from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional
import logging

logger = logging.getLogger(__name__)


@dataclass
class ProviderResult:
    """Result returned from a provider send() call."""
    success: bool
    provider_msg_id: str = ""
    error_code: str = ""
    error_message: str = ""
    cost_minor: Optional[int] = None  # cost in kobo/smallest currency unit
    raw: dict = field(default_factory=dict)

    def __repr__(self):
        return f"<ProviderResult success={self.success} msg_id={self.provider_msg_id!r} err={self.error_code!r}>"


class BaseProvider(ABC):
    """Abstract base class for all communication providers."""

    channel: str = ""  # 'whatsapp', 'sms', 'email', 'voice'

    @abstractmethod
    def send(self, event) -> ProviderResult:
        """
        Send a CommunicationEvent.

        Args:
            event: CommunicationEvent model instance with all fields populated.

        Returns:
            ProviderResult indicating success or failure.
        """
        ...

    def test_connection(self) -> bool:
        """Optionally override to test provider connectivity."""
        return True

    def _render_template(self, event) -> str:
        """
        Render the event body using the invoice/customer template variables.
        Falls back to a sensible default message.
        """
        from apps.languages.templates import render_template, TERMINOLOGY
        invoice = event.invoice
        customer = event.customer

        ctx = {
            "customer_name": customer.name if customer else "Customer",
            "business_name": event.org.name if event.org else "Your business",
            "invoice_number": invoice.invoice_number if invoice else "N/A",
            "amount_due": f"{invoice.currency} {float(invoice.balance):,.2f}" if invoice else "0.00",
            "amount_owed": f"{invoice.currency} {float(invoice.balance):,.2f}" if invoice else "0.00",
            "due_date": str(invoice.due_date) if invoice and invoice.due_date else "as agreed",
            "due_date_value": str(invoice.due_date) if invoice and invoice.due_date else "as agreed",
            "outstanding_balance": f"{invoice.currency} {float(invoice.balance):,.2f}" if invoice else "0.00",
            "pay_link": self._get_pay_link(event),
        }

        # Determine language: customer preferred or org default
        lang = "en"
        if customer and getattr(customer, "preferred_language", None):
            pref = customer.preferred_language
            lang = pref.code if hasattr(pref, "code") else str(pref)

        # If a custom template is stored on the event, render its variables
        if event.template_id and "{{" in event.template_id:
            body = event.template_id
            for k, v in ctx.items():
                body = body.replace("{{" + k + "}}", str(v))
            return body

        # Otherwise use the language template system
        intent = "reminder"
        if invoice and invoice.status == "overdue":
            intent = "overdue"
        try:
            return render_template(intent, lang, ctx)
        except Exception:
            return (
                f"Hello {ctx['customer_name']}, this is a reminder from {ctx['business_name']}. "
                f"Invoice {ctx['invoice_number']} for {ctx['amount_due']} is due. "
                f"Pay here: {ctx['pay_link']}"
            )

    def _get_pay_link(self, event) -> str:
        from django.conf import settings
        frontend_url = getattr(settings, "FRONTEND_URL", "https://collectnaija.com")
        if event.invoice:
            return f"{frontend_url}/pay/{event.invoice_id}"
        return frontend_url

    def _get_phone(self, event) -> str:
        """Get E.164 phone number for the customer."""
        customer = event.customer
        if not customer:
            return ""
        phone = getattr(customer, "phone", "") or ""
        # Normalize Nigerian numbers to +234
        phone = phone.strip().replace(" ", "").replace("-", "")
        if phone.startswith("0") and len(phone) == 11:
            phone = "+234" + phone[1:]
        elif phone.startswith("234") and not phone.startswith("+"):
            phone = "+" + phone
        return phone

    def _get_email(self, event) -> str:
        customer = event.customer
        if not customer:
            return ""
        return getattr(customer, "email", "") or ""
