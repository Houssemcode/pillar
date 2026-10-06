"""
Models for the Tasks module.
"""
from django.conf import settings
from django.db import models


DEFAULT_VIEW_CHOICES = [
    ("list", "List"),
    ("kanban", "Kanban"),
    ("timeline", "Timeline"),
]


class TaskList(models.Model):
    """
    User-defined task list category (e.g., 'Work', 'Personal', 'Shopping').
    """
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tasks_lists",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=32, blank=True, default="#10B981")
    accent_color = models.CharField(max_length=32, blank=True, default="#10B981")
    icon = models.CharField(max_length=50, blank=True, default="📋")
    default_view = models.CharField(max_length=20, choices=DEFAULT_VIEW_CHOICES, default="list")
    in_trash = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Task List"
        verbose_name_plural = "Task Lists"

    def __str__(self):
        return f"{self.icon} {self.name}" if self.icon else self.name


class Tag(models.Model):
    """
    Categorization tags applicable across tasks (e.g., '#Urgent', '#Health').
    """
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tasks_tags",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=32, blank=True, default="#10B981")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Tag"
        verbose_name_plural = "Tags"

    def __str__(self):
        return f"#{self.name}"


def list_factory():
    """Default factory for JSONField list attributes."""
    return []


class Task(models.Model):
    """
    Core Task entity with relational list, subtasks, tags, and recurrence support.
    """
    class Priority(models.TextChoices):
        HIGH = "high", "High"
        MEDIUM = "medium", "Medium"
        LOW = "low", "Low"
        NONE = "none", "None"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tasks_tasks",
        null=True,
        blank=True,
    )
    list = models.ForeignKey(
        TaskList,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tasks",
    )
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True, default="")
    due_date = models.DateField(null=True, blank=True, db_index=True)
    time = models.CharField(max_length=10, blank=True, default="")
    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.NONE,
        db_index=True,
    )
    is_completed = models.BooleanField(default=False, db_index=True)
    tags = models.ManyToManyField(Tag, blank=True, related_name="tasks")

    # Additional rich productivity attributes
    in_trash = models.BooleanField(default=False, db_index=True)
    recurrence = models.JSONField(blank=True, null=True)
    attachments = models.JSONField(blank=True, default=list_factory)
    reminder_offset = models.IntegerField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["is_completed", "-created_at"]
        verbose_name = "Task"
        verbose_name_plural = "Tasks"

    def __str__(self):
        status_mark = "✓" if self.is_completed else "○"
        return f"[{status_mark}] {self.title}"

    # Backward-compatibility alias properties for existing UI components
    @property
    def text(self):
        return self.title

    @property
    def done(self):
        return self.is_completed

    @property
    def notes(self):
        return self.description

    @property
    def due_time(self):
        return self.time

    @property
    def list_name(self):
        return self.list.name if self.list else ""


class Subtask(models.Model):
    """
    Sub-item checklist belonging to a parent Task.
    """
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="subtasks",
    )
    title = models.CharField(max_length=255)
    is_completed = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Subtask"
        verbose_name_plural = "Subtasks"

    def __str__(self):
        mark = "✓" if self.is_completed else "○"
        return f"{mark} {self.title}"

    @property
    def text(self):
        return self.title

    @property
    def done(self):
        return self.is_completed
