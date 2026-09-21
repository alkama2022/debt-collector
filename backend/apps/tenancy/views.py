from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from .models import Organization, Membership
from .serializers import OrganizationSerializer

class OrganizationListCreateView(generics.ListCreateAPIView):
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Organization.objects.filter(memberships__user=self.request.user, deleted_at__isnull=True).distinct()

    def perform_create(self, serializer):
        org = serializer.save()
        Membership.objects.create(org=org, user=self.request.user, role=Membership.Role.OWNER)

class OrganizationDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Organization.objects.filter(memberships__user=self.request.user)

class SwitchOrgView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            membership = Membership.objects.get(org_id=pk, user=request.user)
        except Membership.DoesNotExist:
            return Response({"success": False, "message": "Organization not found", "errors": {}, "code": "NOT_FOUND"}, status=404)
        return Response({"success": True, "data": {"org_id": str(pk), "role": membership.role}})

class HealthView(APIView):
    permission_classes = []
    authentication_classes = []

    def get(self, request):
        return Response({"success": True, "data": {"status": "ok", "service": "collectnaija-api", "version": "1.0.0"}})
