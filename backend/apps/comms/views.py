from rest_framework import generics, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import CommunicationEvent, CommunicationPreference, ReminderRule
from .serializers import CommunicationEventSerializer, CommunicationPreferenceSerializer, ReminderRuleSerializer

class CommunicationEventList(generics.ListCreateAPIView):
    serializer_class = CommunicationEventSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["channel", "status", "customer", "invoice"]
    ordering = ["-created_at"]

    def get_queryset(self):
        org = getattr(self.request, "org", None)
        if org is None:
            return CommunicationEvent.objects.none()
        return CommunicationEvent.objects.for_org(org)

    def perform_create(self, serializer):
        org = getattr(self.request, "org", None)
        idem = self.request.headers.get("X-Idempotency-Key") or self.request.headers.get("Idempotency-Key")
        serializer.save(org=org, idempotency_key=idem or serializer.validated_data.get("idempotency_key"))

class CommunicationEventDetail(generics.RetrieveAPIView):
    serializer_class = CommunicationEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        org = getattr(self.request, "org", None)
        if org is None:
            return CommunicationEvent.objects.none()
        return CommunicationEvent.objects.for_org(org)

class CommunicationPreferenceList(generics.ListCreateAPIView):
    serializer_class = CommunicationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        org = getattr(self.request, "org", None)
        if org is None:
            return CommunicationPreference.objects.none()
        return CommunicationPreference.objects.filter(org=org)

    def perform_create(self, serializer):
        serializer.save(org=getattr(self.request, "org", None))


class ReminderRuleListCreate(generics.ListCreateAPIView):
    serializer_class = ReminderRuleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        org = getattr(self.request, "org", None)
        if org is None:
            return ReminderRule.objects.none()
        return ReminderRule.objects.for_org(org).order_by("-created_at")

    def perform_create(self, serializer):
        org = getattr(self.request, "org", None)
        serializer.save(org=org)


class ReminderRuleDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReminderRuleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        org = getattr(self.request, "org", None)
        if org is None:
            return ReminderRule.objects.none()
        return ReminderRule.objects.for_org(org)


class ReminderRuleRunView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk=None):
        org = getattr(request, "org", None)
        if org is None and hasattr(request.user, "memberships"):
            m = request.user.memberships.select_related("org").first()
            org = m.org if m else None
        if org is None:
            return Response({"success": False, "message": "Organization required"}, status=401)
        # If pk provided, run single rule; else run all enabled
        rules = ReminderRule.objects.for_org(org).filter(enabled=True)
        if pk:
            try:
                rules = rules.filter(pk=pk)
                if not rules.exists():
                    return Response({"success": False, "message": "Rule not found"}, status=404)
            except Exception:
                return Response({"success": False, "message": "Invalid rule id"}, status=400)
        # Create CommunicationEvents for open invoices matching rule date logic (mock schedule)
        from apps.invoices.models import Invoice
        from datetime import timedelta, date
        today = date.today()
        created = 0
        events = []
        for rule in rules:
            target_date = today - timedelta(days=rule.offset_days) if rule.trigger == "after_due" else today + timedelta(days=abs(rule.offset_days)) if rule.trigger == "before_due" else today
            # For demo: match invoices where due_date == target_date and balance>0, or if no due_date, take all open
            invoices = Invoice.objects.for_org(org).filter(deleted_at__isnull=True, balance__gt=0)
            # Filter by due date when rule is date-specific; if rule is very generic, limit to 20 to avoid spam
            if rule.trigger != "after_due" or rule.offset_days != 0:
                invoices = invoices.filter(due_date=target_date)
                if not invoices.exists() and rule.trigger == "after_due":
                    # fallback: overdue invoices
                    invoices = Invoice.objects.for_org(org).filter(deleted_at__isnull=True, balance__gt=0, status="overdue")[:20]
                    # need to re-evaluate as queryset slice not allowed for count; convert
                    invoices = list(invoices)
                else:
                    invoices = list(invoices[:20])
            else:
                invoices = list(invoices[:20])
            for inv in invoices:
                # Idempotency: skip if event already exists for this invoice+rule today
                existing = CommunicationEvent.objects.filter(org=org, invoice=inv, channel=rule.channel, created_at__date=today).exists()
                if existing:
                    continue
                ev = CommunicationEvent.objects.create(
                    org=org,
                    invoice=inv,
                    customer=inv.customer,
                    channel=rule.channel,
                    template_id=rule.template[:128],
                    status="queued",
                    scheduled_for=timezone.now(),
                )
                events.append(str(ev.id))
                created += 1
        return Response({"success": True, "data": {"created": created, "event_ids": events, "message": f"Scheduled {created} reminders via {rules.count()} rule(s) for {today}"}})
