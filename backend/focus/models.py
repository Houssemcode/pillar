"""
Models for the Focus (Pomodoro) module.
"""
from django.conf import settings
from django.db import models


class FocusSession(models.Model):
    """
    Represents a focused work or break interval (e.g. Pomodoro, Short Break, Long Break).
    Tracks duration in seconds, linked task (cross-module), mode, status, and telemetry.
    """
    class Mode(models.TextChoices):
        POMODORO = "pomodoro", "Pomodoro"
        SHORT_BREAK = "short_break", "Short Break"
        LONG_BREAK = "long_break", "Long Break"

    class Status(models.TextChoices):
        COMPLETED = "completed", "Completed"
        INTERRUPTED = "interrupted", "Interrupted"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="user_focus_sessions",
    )
    mode = models.CharField(
        max_length=20,
        choices=Mode.choices,
        default=Mode.POMODORO,
        db_index=True,
    )
    duration = models.IntegerField(
        default=1500,
        help_text="Duration completed in seconds",
    )
    start_time = models.DateTimeField(null=True, blank=True, db_index=True)
    end_time = models.DateTimeField(null=True, blank=True, db_index=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.COMPLETED,
        db_index=True,
    )
    task = models.ForeignKey(
        "tasks.Task",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="focus_sessions",
    )
    label = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="Custom session label or title if not linked to a specific task",
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Focus Session"
        verbose_name_plural = "Focus Sessions"

    def __str__(self):
        desc = self.label or (self.task.title if self.task else "Focus Session")
        return f"[{self.mode}] {desc} ({self.duration}s, {self.status})"

    @property
    def duration_minutes(self):
        return round(self.duration / 60, 1)
