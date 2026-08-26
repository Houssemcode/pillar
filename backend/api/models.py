from django.conf import settings
from django.db import models


class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    gender = models.CharField(max_length=16, blank=True, null=True)
    is_excused = models.BooleanField(default=False)


class TaskList(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="task_lists")
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=32, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["owner", "name"], name="unique_task_list_per_owner"),
        ]
        ordering = ["name"]


class TaskTag(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="task_tags")
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=32, blank=True, default="")

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["owner", "name"], name="unique_task_tag_per_owner"),
        ]
        ordering = ["name"]


class Task(models.Model):
    PRIORITIES = (("high", "High"), ("medium", "Medium"), ("low", "Low"))
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tasks")
    text = models.CharField(max_length=500)
    done = models.BooleanField(default=False)
    priority = models.CharField(max_length=10, choices=PRIORITIES, default="medium")
    tag = models.CharField(max_length=100, default="General")
    list_name = models.CharField(max_length=100, default="Personal")
    due_date = models.DateField(blank=True, null=True)
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["done", "-created_at"]


class Habit(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="habits")
    name = models.CharField(max_length=200)
    emoji = models.CharField(max_length=16, default="🎯")
    area = models.CharField(max_length=50, default="Morning")
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["area", "name"]


class HabitCompletion(models.Model):
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name="completions")
    date = models.DateField()

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["habit", "date"], name="unique_habit_completion"),
        ]
        ordering = ["-date"]


class PrayerLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="prayer_logs")
    date = models.DateField()
    prayer_key = models.CharField(max_length=20)
    fard_done = models.BooleanField(default=False)
    sunnah_done = models.PositiveSmallIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "date", "prayer_key"], name="unique_prayer_log"),
        ]


class AdhkarLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="adhkar_logs")
    date = models.DateField()
    item_id = models.CharField(max_length=32)
    kind = models.CharField(max_length=16)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "date", "item_id", "kind"], name="unique_adhkar_log"),
        ]


class Khatmah(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="khatmah")
    current_page = models.PositiveIntegerField(default=0)
    target_pages = models.PositiveIntegerField(default=604)
    updated_at = models.DateTimeField(auto_now=True)


class GoodDeedLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="good_deed_logs")
    date = models.DateField()
    deed_id = models.CharField(max_length=32)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "date", "deed_id"], name="unique_good_deed_log"),
        ]


class FocusSession(models.Model):
    MODES = (("pomodoro", "Pomodoro"), ("short", "Short Break"), ("long", "Long Break"))
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="focus_sessions")
    label = models.CharField(max_length=255, blank=True, default="")
    duration_minutes = models.PositiveIntegerField(default=25)
    mode = models.CharField(max_length=16, choices=MODES, default="pomodoro")
    started_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-completed_at"]