import uuid
from django.db import models
from django.db.models import Q
from apps.tenancy.models import TenantModel, TenantManager

class CustomerManager(TenantManager):
    pass

class Customer(TenantModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer_code = models.CharField(max_length=64)
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=32, blank=True, default="")
    email = models.EmailField(blank=True, default="")
    outstanding = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    overdue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    prefs = models.JSONField(default=dict, blank=True)
    communication_preference = models.JSONField(default=dict, blank=True)
    opt_out = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = CustomerManager()

    class Meta:
        db_table = "customers"
        constraints = [
            models.UniqueConstraint(fields=["org", "customer_code"], condition=Q(deleted_at__isnull=True), name="uniq_customer_code_per_org"),
        ]
        indexes = [
            models.Index(fields=["org", "customer_code"]),
            models.Index(fields=["org", "name"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.customer_code})"
