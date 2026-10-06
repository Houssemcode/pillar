"""
Serializers for the Focus (Pomodoro) module.
"""
from datetime import timedelta
from django.utils import timezone
from rest_framework import serializers

from .models import FocusSession


class FocusSessionSerializer(serializers.ModelSerializer):
    """
    Serializer for FocusSession with bidirectional mappings,
    read-only task title lookup, and backward-compatible fields.
    """
    task_title = serializers.CharField(source="task.title", read_only=True, default="")
    duration_minutes = serializers.FloatField(read_only=True)
    is_break = serializers.SerializerMethodField()
    started_at = serializers.DateTimeField(source="start_time", read_only=True)
    completed_at = serializers.DateTimeField(source="end_time", read_only=True)

    class Meta:
        model = FocusSession
        fields = [
            "id",
            "owner",
            "mode",
            "duration",
            "duration_minutes",
            "start_time",
            "end_time",
            "started_at",
            "completed_at",
            "status",
            "task",
            "task_title",
            "label",
            "is_break",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "owner", "created_at", "updated_at"]

    def get_is_break(self, obj):
        return obj.mode != FocusSession.Mode.POMODORO

    def to_internal_value(self, data):
        """
        Defensively normalize payloads from various frontend formats.
        """
        mutable_data = data.copy() if hasattr(data, "copy") else dict(data)

        # Normalize duration (frontend may send duration_minutes or duration)
        if "duration_minutes" in mutable_data and "duration" not in mutable_data:
            try:
                mins = float(mutable_data.get("duration_minutes") or 25)
                mutable_data["duration"] = int(mins * 60)
            except (ValueError, TypeError):
                mutable_data["duration"] = 1500
        elif "duration" not in mutable_data:
            mutable_data["duration"] = 1500

        # Normalize mode aliases ('short' -> 'short_break', 'long' -> 'long_break')
        mode_val = mutable_data.get("mode")
        if mode_val == "short":
            mutable_data["mode"] = FocusSession.Mode.SHORT_BREAK
        elif mode_val == "long":
            mutable_data["mode"] = FocusSession.Mode.LONG_BREAK
        elif mode_val in ("custom", "stopwatch"):
            if not mutable_data.get("label"):
                mutable_data["label"] = "Stopwatch" if mode_val == "stopwatch" else "Custom"
            mutable_data["mode"] = FocusSession.Mode.POMODORO

        # Normalize timestamps
        if "started_at" in mutable_data and "start_time" not in mutable_data:
            mutable_data["start_time"] = mutable_data["started_at"]
        if "completed_at" in mutable_data and "end_time" not in mutable_data:
            mutable_data["end_time"] = mutable_data["completed_at"]

        now = timezone.now()
        if not mutable_data.get("end_time"):
            mutable_data["end_time"] = now.isoformat()
        if not mutable_data.get("start_time"):
            dur_secs = int(mutable_data.get("duration", 1500))
            mutable_data["start_time"] = (now - timedelta(seconds=dur_secs)).isoformat()

        # Sanitize task ID if empty string
        if mutable_data.get("task") == "" or mutable_data.get("task") == 0:
            mutable_data["task"] = None

        return super().to_internal_value(mutable_data)
