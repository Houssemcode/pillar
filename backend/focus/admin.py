"""
Django Admin configuration for the Focus (Pomodoro) module.
Provides full telemetry auditing and tracking of focus sessions.
"""
from django.contrib import admin
from .models import FocusSession


@admin.register(FocusSession)
class FocusSessionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "owner",
        "mode",
        "label",
        "task",
        "duration",
        "duration_minutes",
        "status",
        "start_time",
        "end_time",
        "created_at",
    )
    list_filter = ("mode", "status", "created_at", "owner")
    search_fields = ("label", "task__title", "owner__username")
    ordering = ("-created_at",)
