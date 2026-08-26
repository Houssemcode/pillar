from django.contrib import admin

from .models import (
    AdhkarLog,
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
    PrayerLog,
    AdhkarLog,
    Khatmah,
    GoodDeedLog,
    FocusSession,
):
    admin.site.register(model)