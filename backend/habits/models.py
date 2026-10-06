"""
Database models for the Habits module.

Provides:
- HabitArea: Life area categorization (e.g. Health, Productivity, Mindfulness)
- Habit: Core habit entity with targets, frequencies, and life area association
- HabitLog: Daily completion tracking with a unique constraint per habit/date
"""
from django.conf import settings
from django.db import models
from .presets import HABIT_PRESETS


class HabitArea(models.Model):
    """
    Life Area or category for grouping habits (e.g. Health, Spiritual, Work).
    Supports user-defined custom areas and global/system defaults.
    """
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="habits_areas",
    )
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=32, default="#10B981")
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "name"]
        verbose_name = "Habit Area"
        verbose_name_plural = "Habit Areas"

    def __str__(self):
        return self.name


class Habit(models.Model):
    """
    Core Habit model tracking daily routines, recurring goals, and targets.
    """
    class Frequency(models.TextChoices):
        DAILY = "daily", "Daily"
        WEEKLY = "weekly", "Weekly"
        WEEKDAYS = "weekdays", "Weekdays"
        WEEKENDS = "weekends", "Weekends"
        SPECIFIC_DAYS = "specific_days", "Specific Days"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="habits_habits",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    emoji = models.CharField(max_length=32, default="⚡")
    color = models.CharField(max_length=32, default="#10B981")
    area = models.ForeignKey(
        HabitArea,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="habits",
    )
    target_count = models.PositiveIntegerField(default=1)
    target_unit = models.CharField(max_length=50, default="times", blank=True)
    frequency = models.CharField(max_length=50, default=Frequency.DAILY)
    frequency_days = models.JSONField(default=list, blank=True)  # [0, 1, 2, ...] day indices
    reminder_time = models.TimeField(null=True, blank=True)
    system_code = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        db_index=True,
        help_text="System identifier for automated sync (e.g. 'morning_adhkar', 'evening_adhkar', 'quran')",
    )
    is_archived = models.BooleanField(default=False)
    in_trash = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Habit"
        verbose_name_plural = "Habits"
        constraints = [
            models.UniqueConstraint(
                fields=["owner", "system_code"],
                name="unique_owner_system_habit",
                condition=models.Q(system_code__isnull=False, owner__isnull=False),
            )
        ]

    def __str__(self):
        return self.title


class HabitLog(models.Model):
    """
    Daily progress and completion record for a specific Habit.
    Guarantees idempotency via a UniqueConstraint on (habit, date).
    """
    habit = models.ForeignKey(
        Habit,
        on_delete=models.CASCADE,
        related_name="logs",
    )
    date = models.DateField()
    progress_count = models.PositiveIntegerField(default=0)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["habit", "date"],
                name="unique_habit_log_per_day",
            )
        ]
        ordering = ["-date"]
        verbose_name = "Habit Log"
        verbose_name_plural = "Habit Logs"

    def __str__(self):
        status = "Completed" if self.is_completed else f"{self.progress_count}/{self.habit.target_count}"
        return f"{self.habit.title} on {self.date}: {status}"
