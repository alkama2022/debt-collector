from rest_framework import serializers
from .models import AIConversation, AIMessage, AIAgentAction, PromiseToPay

class AIMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIMessage
        fields = ["id", "conversation", "role", "content", "tokens", "created_at"]
        read_only_fields = ["id", "created_at"]

class AIAgentActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIAgentAction
        fields = ["id", "conversation", "tool", "input", "output", "tokens", "cost_minor", "prompt_version", "created_at"]
        read_only_fields = ["id", "created_at"]

class PromiseToPaySerializer(serializers.ModelSerializer):
    class Meta:
        model = PromiseToPay
        fields = ["id", "org", "conversation", "customer", "invoice", "promise_date", "amount", "status", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

class AIConversationSerializer(serializers.ModelSerializer):
    messages = AIMessageSerializer(many=True, read_only=True)
    class Meta:
        model = AIConversation
        fields = ["id", "org", "customer", "invoice", "state", "channel", "created_at", "updated_at", "messages"]
        read_only_fields = ["id", "org", "created_at", "updated_at"]
