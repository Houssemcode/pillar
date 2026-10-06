"""
Django Admin configuration for the Tasks module.
Provides full database auditing and management for TaskList, Task, Tag, and Subtasks.
"""
from django.contrib import admin
from .models import TaskList, Tag, Task, Subtask


class SubtaskInline(admin.TabularInline):
    model = Subtask
    extra = 1
    fields = ("title", "is_completed", "order")


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "owner",
        "list",
        "priority",
        "due_date",
        "is_completed",
        "in_trash",
        "created_at",
    )
    list_filter = ("is_completed", "priority", "in_trash", "list", "owner", "due_date")
    search_fields = ("title", "description", "owner__username")
    inlines = [SubtaskInline]
    filter_horizontal = ["tags"]
    list_editable = ("is_completed", "priority", "in_trash")
    ordering = ("is_completed", "-created_at")


@admin.register(TaskList)
class TaskListAdmin(admin.ModelAdmin):
    list_display = ("name", "owner", "color", "icon", "default_view", "in_trash", "created_at")
    list_filter = ("default_view", "in_trash", "owner", "created_at")
    search_fields = ("name", "owner__username")
    ordering = ("name",)


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("name", "owner", "color", "created_at")
    list_filter = ("owner", "created_at")
    search_fields = ("name", "owner__username")
    ordering = ("name",)


@admin.register(Subtask)
class SubtaskAdmin(admin.ModelAdmin):
    list_display = ("title", "task", "is_completed", "order", "created_at")
    list_filter = ("is_completed", "created_at")
    search_fields = ("title", "task__title")
    list_editable = ("is_completed", "order")
    ordering = ("task", "order")
