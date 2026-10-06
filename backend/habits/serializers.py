"""
Serializers for the Habits module.

Provides:
- HabitAreaSerializer: Life area categorization serializer
- HabitLogSerializer: Daily completion/progress log serializer
- HabitSerializer: Comprehensive habit serializer including today's log,
  dynamic streaks, completed dates, and bidirectional UI aliases.
"""
from datetime import timedelta
from django.utils import timezone
from rest_framework import serializers

from .models import HabitArea, Habit, HabitLog


class HabitAreaSerializer(serializers.ModelSerializer):
    """
    Serializer for HabitArea model.
    """
    class Meta:
        model = HabitArea
        fields = ["id", "name", "color", "order", "created_at"]
        read_only_fields = ["id", "created_at"]


class HabitLogSerializer(serializers.ModelSerializer):
    """
    Serializer for daily HabitLog entries.
    Provides compatibility for amount <-> progress_count and done <-> is_completed.
    """
    amount = serializers.IntegerField(source="progress_count", required=False)
    done = serializers.BooleanField(source="is_completed", required=False)

    class Meta:
        model = HabitLog
        fields = [
            "id",
            "habit",
            "date",
            "progress_count",
            "is_completed",
            "amount",
            "done",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def to_internal_value(self, data):
        data_dict = dict(data)
        if "amount" in data_dict and "progress_count" not in data_dict:
            try:
                data_dict["progress_count"] = int(data_dict["amount"])
            except (ValueError, TypeError):
                pass
        if "done" in data_dict and "is_completed" not in data_dict:
            data_dict["is_completed"] = bool(data_dict["done"])
        return super().to_internal_value(data_dict)


class HabitSerializer(serializers.ModelSerializer):
    """
    Comprehensive Habit serializer supporting:
    - Embedded today's log directly within the payload (saves frontend roundtrips)
    - Dynamic streak calculation
    - Completed dates array (for heatmap and matrix views)
    - Bidirectional compatibility with frontend fields:
        title <-> name
        description <-> notes
        target_count <-> goal_amount
        target_unit <-> goal_unit
        area <-> areas
    """
    area_details = HabitAreaSerializer(source="area", read_only=True)
    area = serializers.PrimaryKeyRelatedField(
        queryset=HabitArea.objects.all(),
        required=False,
        allow_null=True,
    )
    area_name = serializers.CharField(source="area.name", read_only=True, default="")
    areas = serializers.SerializerMethodField(read_only=True)

    # Today's status fields (saves frontend queries)
    today_log = serializers.SerializerMethodField(read_only=True)
    is_completed_today = serializers.SerializerMethodField(read_only=True)
    progress_today = serializers.SerializerMethodField(read_only=True)

    # History & metrics
    completed_dates = serializers.SerializerMethodField(read_only=True)
    streak = serializers.SerializerMethodField(read_only=True)

    # Frontend alias mappings
    name = serializers.CharField(source="title", required=False)
    notes = serializers.CharField(source="description", required=False, allow_blank=True)
    goal_amount = serializers.IntegerField(source="target_count", required=False)
    goal_unit = serializers.CharField(source="target_unit", required=False, allow_blank=True)

    class Meta:
        model = Habit
        fields = [
            "id",
            "title",
            "description",
            "emoji",
            "color",
            "area",
            "area_details",
            "area_name",
            "areas",
            "target_count",
            "target_unit",
            "frequency",
            "frequency_days",
            "reminder_time",
            "system_code",
            "is_archived",
            "in_trash",
            "created_at",
            "updated_at",
            # Embedded daily telemetry
            "today_log",
            "is_completed_today",
            "progress_today",
            "completed_dates",
            "streak",
            # Legacy frontend compatibility aliases
            "name",
            "notes",
            "goal_amount",
            "goal_unit",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        extra_kwargs = {
            "title": {"required": False},
        }

    def get_areas(self, obj):
        """Returns array of area names for frontend multi-area pill display."""
        return [obj.area.name] if obj.area else []

    def _get_today_log_obj(self, obj):
        """Helper to retrieve today's HabitLog from prefetched logs or query."""
        today = timezone.localdate()
        if hasattr(obj, "_prefetched_objects_cache") and "logs" in obj._prefetched_objects_cache:
            for log in obj.logs.all():
                if log.date == today:
                    return log
            return None
        return obj.logs.filter(date=today).first()

    def get_today_log(self, obj):
        log = self._get_today_log_obj(obj)
        if log:
            return HabitLogSerializer(log).data
        return None

    def get_is_completed_today(self, obj):
        log = self._get_today_log_obj(obj)
        return bool(log.is_completed) if log else False

    def get_progress_today(self, obj):
        log = self._get_today_log_obj(obj)
        return log.progress_count if log else 0

    def get_completed_dates(self, obj):
        """Returns array of ISO date strings for all completed days."""
        if hasattr(obj, "_prefetched_objects_cache") and "logs" in obj._prefetched_objects_cache:
            return [
                log.date.isoformat() if hasattr(log.date, "isoformat") else str(log.date)
                for log in obj.logs.all()
                if log.is_completed
            ]
        return [
            d.isoformat() if hasattr(d, "isoformat") else str(d)
            for d in obj.logs.filter(is_completed=True)
            .values_list("date", flat=True)
            .order_by("date")
        ]

    def get_streak(self, obj):
        """
        Calculate current unbroken consecutive day streak.
        Accounts for whether today is already completed or pending.
        """
        today = timezone.localdate()
        completed_set = set()

        if hasattr(obj, "_prefetched_objects_cache") and "logs" in obj._prefetched_objects_cache:
            completed_set = {log.date for log in obj.logs.all() if log.is_completed}
        else:
            completed_set = set(
                obj.logs.filter(is_completed=True).values_list("date", flat=True)
            )

        if not completed_set:
            return 0

        # Start checking from today or yesterday
        current_check = today
        if current_check not in completed_set:
            current_check = today - timedelta(days=1)
            if current_check not in completed_set:
                return 0

        streak_count = 0
        while current_check in completed_set:
            streak_count += 1
            current_check -= timedelta(days=1)

        return streak_count

    def to_internal_value(self, data):
        """
        Defensively sanitize frontend payloads before standard ModelSerializer validation.
        """
        data_dict = dict(data)

        # 1. Aliases normalization
        if "name" in data_dict and "title" not in data_dict:
            data_dict["title"] = str(data_dict["name"]).strip()
        if "notes" in data_dict and "description" not in data_dict:
            data_dict["description"] = str(data_dict["notes"])
        if "goal_amount" in data_dict and "target_count" not in data_dict:
            try:
                data_dict["target_count"] = int(data_dict["goal_amount"])
            except (ValueError, TypeError):
                pass
        if "goal_unit" in data_dict and "target_unit" not in data_dict:
            data_dict["target_unit"] = str(data_dict["goal_unit"]).strip()

        # 2. Area resolution (handles integer PK, string area name, or areas array)
        raw_area = data_dict.get("area")
        if raw_area == "" or raw_area is False:
            data_dict["area"] = None
        elif isinstance(raw_area, str):
            clean_area_str = raw_area.strip()
            if clean_area_str.isdigit():
                data_dict["area"] = int(clean_area_str)
            elif clean_area_str:
                request = self.context.get("request")
                user = request.user if request and request.user.is_authenticated else None
                area_obj, _ = HabitArea.objects.get_or_create(
                    name=clean_area_str,
                    defaults={"owner": user}
                )
                data_dict["area"] = area_obj.id
            else:
                data_dict["area"] = None
        elif raw_area is None and data_dict.get("areas"):
            raw_areas = data_dict.get("areas")
            if isinstance(raw_areas, list) and len(raw_areas) > 0 and raw_areas[0]:
                first_area_name = str(raw_areas[0]).strip()
                request = self.context.get("request")
                user = request.user if request and request.user.is_authenticated else None
                area_obj, _ = HabitArea.objects.get_or_create(
                    name=first_area_name,
                    defaults={"owner": user}
                )
                data_dict["area"] = area_obj.id

        # 3. Frequency normalization
        if "frequency" in data_dict and data_dict["frequency"]:
            data_dict["frequency"] = str(data_dict["frequency"]).lower().strip()

        # 4. Target count sanitization
        if "target_count" in data_dict:
            try:
                data_dict["target_count"] = max(1, int(data_dict["target_count"]))
            except (ValueError, TypeError):
                data_dict["target_count"] = 1

        return super().to_internal_value(data_dict)
