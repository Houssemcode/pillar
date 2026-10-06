from django.contrib import admin

from .models import (
    AdhkarLog,
    CalendarEvent,
    FocusSession,
    GoodDeedLog,
    Habit,
    HabitCompletion,
    Khatmah,
    PrayerLog,
    Profile,
    Task,
    TaskList,
    TaskTag,
)

for model in (
    Profile,
    Task,
    TaskList,
    TaskTag,
    Habit,
    HabitCompletion,
    AdhkarLog,
    GoodDeedLog,
    FocusSession,
    CalendarEvent,
):
    admin.site.register(model)