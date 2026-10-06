"""
Django Admin configuration for the Habits module.
Provides secure CMS capabilities for managing Habit Areas, Habits,
and monitoring user completion logs.
"""
from django.contrib import admin
from .models import HabitArea, Habit, HabitLog


@admin.register(HabitArea)
class HabitAreaAdmin(admin.ModelAdmin):
    list_display = ("name", "color", "order", "owner", "created_at")
    list_filter = ("owner", "created_at")
    search_fields = ("name", "owner__username")
    ordering = ("order", "name")


class HabitLogInline(admin.TabularInline):
    model = HabitLog
    extra = 0
    readonly_fields = ("created_at",)
    ordering = ("-date",)


@admin.register(Habit)
class HabitAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "emoji",
        "owner",
        "area",
        "frequency",
        "target_count",
        "target_unit",
        "is_archived",
        "in_trash",
        "created_at",
    )
    list_filter = ("frequency", "is_archived", "in_trash", "area", "created_at")
    search_fields = ("title", "description", "owner__username", "area__name")
    inlines = [HabitLogInline]
    ordering = ("-created_at",)


@admin.register(HabitLog)
class HabitLogAdmin(admin.ModelAdmin):
    list_display = ("habit", "date", "progress_count", "is_completed", "created_at")
    list_filter = ("is_completed", "date", "created_at")
    search_fields = ("habit__title", "habit__owner__username")
    ordering = ("-date", "-id")
