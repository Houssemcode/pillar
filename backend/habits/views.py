"""
Views and ViewSets for the Habits module.

Provides:
- HabitAreaViewSet: Management for habit categorization areas
- HabitViewSet: Full CRUD for habits with:
  - Custom 'log' action: POST /api/habits/{id}/log/ (update_or_create for daily progress)
  - Custom 'toggle' action: POST /api/habits/{id}/toggle/ (quick toggle completion)
  - Custom 'heatmap' action: GET /api/habits/heatmap/ (completion aggregation over time)
"""
from datetime import datetime, timedelta
from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import HabitArea, Habit, HabitLog
from .serializers import HabitAreaSerializer, HabitSerializer, HabitLogSerializer
from .presets import HABIT_PRESETS, initialize_core_habits_for_user


class HabitAreaViewSet(viewsets.ModelViewSet):
    """
    ModelViewSet for Habit Area management.
    Filters by the current user while including system/global default areas (owner is null).
    """
    queryset = HabitArea.objects.all()
    serializer_class = HabitAreaSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user and user.is_authenticated:
            queryset = queryset.filter(Q(owner=user) | Q(owner__isnull=True))
        return queryset

    def perform_create(self, serializer):
        if self.request.user and self.request.user.is_authenticated:
            serializer.save(owner=self.request.user)
        else:
            serializer.save()


def sync_habit_to_faith(habit, log_date, is_completed, user=None):
    """
    Bidirectionally syncs Habit completion status to Faith Adhkar items.
    If habit.system_code is 'morning_adhkar' or 'evening_adhkar':
    - When marked DONE: creates AdhkarLog entries for all items in that category.
    - When UNCHECKED: deletes AdhkarLog entries for that category.
    """
    if not habit.system_code or habit.system_code not in ["morning_adhkar", "evening_adhkar"]:
        return

    sync_user = habit.owner or (user if user and user.is_authenticated else None)
    if not sync_user:
        return

    category = "morning" if habit.system_code == "morning_adhkar" else "evening"

    try:
        from faith.models import Adhkar
        from api.models import AdhkarLog
        from django.db.models import Q

        if is_completed:
            adhkar_items = Adhkar.objects.filter(
                Q(category__iexact=category) | Q(category_en__iexact=category)
            )
            if adhkar_items.exists():
                for item in adhkar_items:
                    AdhkarLog.objects.get_or_create(
                        user=sync_user,
                        date=log_date,
                        item_id=str(item.id),
                        kind=category,
                    )
            else:
                from api.views import ADHKAR
                for item in ADHKAR.get(category, []):
                    AdhkarLog.objects.get_or_create(
                        user=sync_user,
                        date=log_date,
                        item_id=str(item["id"]),
                        kind=category,
                    )
        else:
            AdhkarLog.objects.filter(
                user=sync_user,
                date=log_date,
                kind=category,
            ).delete()
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning("Failed to sync habit to faith: %s", e)


class HabitViewSet(viewsets.ModelViewSet):
    """
    ModelViewSet for Habit management.

    Endpoints:
    - GET    /api/habits/              (List habits with today's log and streak)
    - POST   /api/habits/              (Create habit)
    - GET    /api/habits/{id}/         (Retrieve habit detail)
    - PATCH  /api/habits/{id}/         (Update habit)
    - DELETE /api/habits/{id}/         (Soft delete to trash or permanent delete)
    - POST   /api/habits/{id}/log/     (Log daily progress using update_or_create)
    - POST   /api/habits/{id}/toggle/  (Quick toggle completion for a date)
    - GET    /api/habits/heatmap/      (Heatmap telemetry across the last N days)
    """
    queryset = Habit.objects.select_related("area").prefetch_related("logs")
    serializer_class = HabitSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = (
            Habit.objects
            .select_related("area")
            .prefetch_related("logs")
        )
        user = self.request.user
        if user and user.is_authenticated:
            queryset = queryset.filter(Q(owner=user) | Q(owner__isnull=True))

        params = self.request.query_params

        # 1. Filter by trash status
        trash_param = params.get("trash")
        if trash_param == "true":
            queryset = queryset.filter(in_trash=True)
        elif trash_param != "all":
            queryset = queryset.filter(in_trash=False)

        # 2. Filter by archived status
        archived_param = params.get("archived")
        if archived_param == "true":
            queryset = queryset.filter(is_archived=True)
        elif archived_param != "all":
            queryset = queryset.filter(is_archived=False)

        # 3. Filter by area
        area_param = params.get("area") or params.get("area_id")
        if area_param:
            area_str = str(area_param).strip()
            if area_str.isdigit():
                queryset = queryset.filter(area_id=int(area_str))
            else:
                queryset = queryset.filter(area__name__iexact=area_str)

        # 4. Filter by frequency
        frequency_param = params.get("frequency")
        if frequency_param:
            queryset = queryset.filter(frequency__iexact=frequency_param.strip())

        return queryset

    def perform_create(self, serializer):
        if self.request.user and self.request.user.is_authenticated:
            serializer.save(owner=self.request.user)
        else:
            serializer.save()

    def destroy(self, request, *args, **kwargs):
        """Soft-deletes habit into trash or permanently removes it."""
        habit = self.get_object()
        permanent = request.query_params.get("permanent") == "true"
        if habit.in_trash or permanent:
            habit.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        habit.in_trash = True
        habit.save(update_fields=["in_trash", "updated_at"])
        return Response(self.get_serializer(habit).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="log")
    def log(self, request, pk=None):
        """
        Record or update a HabitLog entry for a specific date using update_or_create.
        Accepts:
        - date: ISO date string (YYYY-MM-DD), defaults to today
        - progress_count: integer progress (or 'amount')
        - is_completed: boolean (or 'done')
        """
        habit = self.get_object()

        # Parse date
        raw_date = request.data.get("date")
        if raw_date:
            try:
                log_date = datetime.strptime(str(raw_date).strip(), "%Y-%m-%d").date()
            except ValueError:
                log_date = timezone.localdate()
        else:
            log_date = timezone.localdate()

        # Parse progress count
        raw_progress = request.data.get("progress_count", request.data.get("amount", None))
        raw_completed = request.data.get("is_completed", request.data.get("done", None))

        defaults = {}
        if raw_progress is not None:
            try:
                progress_val = max(0, int(raw_progress))
                defaults["progress_count"] = progress_val
                if raw_completed is None:
                    defaults["is_completed"] = progress_val >= habit.target_count
            except (ValueError, TypeError):
                defaults["progress_count"] = habit.target_count

        if raw_completed is not None:
            is_comp = bool(raw_completed)
            defaults["is_completed"] = is_comp
            if "progress_count" not in defaults:
                defaults["progress_count"] = habit.target_count if is_comp else 0

        # Guarantee at least some default if empty payload
        if not defaults:
            defaults["progress_count"] = habit.target_count
            defaults["is_completed"] = True

        log_obj, created = HabitLog.objects.update_or_create(
            habit=habit,
            date=log_date,
            defaults=defaults,
        )

        # Bidirectional sync: Habit -> Faith
        sync_habit_to_faith(habit, log_date, log_obj.is_completed, user=request.user)

        if hasattr(habit, "_prefetched_objects_cache"):
            habit._prefetched_objects_cache.clear()

        habit_serializer = self.get_serializer(habit)
        log_serializer = HabitLogSerializer(log_obj)

        return Response({
            "status": "success",
            "log": log_serializer.data,
            "habit": habit_serializer.data,
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="toggle")
    def toggle(self, request, pk=None):
        """
        Quick toggle completion status for a date.
        If already completed, sets progress to 0 and incomplete.
        If incomplete or missing, sets progress to target_count and completed.
        """
        habit = self.get_object()

        raw_date = request.data.get("date") or request.query_params.get("date")
        if raw_date:
            try:
                log_date = datetime.strptime(str(raw_date).strip(), "%Y-%m-%d").date()
            except ValueError:
                log_date = timezone.localdate()
        else:
            log_date = timezone.localdate()

        existing_log = HabitLog.objects.filter(habit=habit, date=log_date).first()

        if existing_log and existing_log.is_completed:
            existing_log.is_completed = False
            existing_log.progress_count = 0
            existing_log.save(update_fields=["is_completed", "progress_count", "updated_at"])
            log_obj = existing_log
        else:
            target = max(1, habit.target_count or 1)
            log_obj, _ = HabitLog.objects.update_or_create(
                habit=habit,
                date=log_date,
                defaults={
                    "progress_count": target,
                    "is_completed": True,
                },
            )

        # Bidirectional sync: Habit -> Faith
        sync_habit_to_faith(habit, log_date, log_obj.is_completed, user=request.user)

        if hasattr(habit, "_prefetched_objects_cache"):
            habit._prefetched_objects_cache.clear()

        habit_serializer = self.get_serializer(habit)
        return Response(habit_serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="heatmap")
    def heatmap(self, request):
        """
        Returns aggregate completion count per date for the last N days.
        GET /api/habits/heatmap/?days=35
        """
        try:
            days = max(1, min(int(request.query_params.get("days", 35)), 365))
        except (ValueError, TypeError):
            days = 35

        end_date = timezone.localdate()
        start_date = end_date - timedelta(days=days - 1)

        habits_qs = self.get_queryset().filter(is_archived=False)
        total_habits_count = habits_qs.count()

        # Map completed dates
        completed_logs = (
            HabitLog.objects.filter(
                habit__in=habits_qs,
                date__gte=start_date,
                date__lte=end_date,
                is_completed=True,
            )
            .values("date")
        )

        counts_by_date = {}
        for item in completed_logs:
            d_str = item["date"].isoformat()
            counts_by_date[d_str] = counts_by_date.get(d_str, 0) + 1

        output = []
        for offset in range(days):
            current_date = start_date + timedelta(days=offset)
            d_str = current_date.isoformat()
            done = counts_by_date.get(d_str, 0)
            pct = round(done / total_habits_count, 2) if total_habits_count > 0 else 0.0
            output.append({
                "date": d_str,
                "done": done,
                "pct": pct,
            })

        return Response(output)

    @action(detail=False, methods=["get"], url_path="presets")
    def presets(self, request):
        """Returns the catalog of curated habit presets."""
        return Response(HABIT_PRESETS)

    @action(detail=False, methods=["post"], url_path="initialize")
    def initialize(self, request):
        """
        Creates the 3 core default faith habits ('quran', 'morning_adhkar', 'evening_adhkar')
        for the current user if they do not already exist.
        """
        user = request.user if request.user and request.user.is_authenticated else None
        created = initialize_core_habits_for_user(user=user)
        user_habits = self.get_queryset()
        serializer = self.get_serializer(user_habits, many=True)
        return Response({
            "status": "success",
            "created_count": len(created),
            "habits": serializer.data,
        }, status=status.HTTP_200_OK if len(created) == 0 else status.HTTP_201_CREATED)
