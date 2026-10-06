"""
Views and API ViewSets for the Focus module.
"""
from datetime import timedelta
from django.db import models
from django.db.models import Sum
from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import FocusSession
from .serializers import FocusSessionSerializer


class FocusSessionViewSet(viewsets.ModelViewSet):
    """
    CRUD API for FocusSessions with custom analytics endpoints:
    - GET /api/focus/stats/ -> today_seconds, week_seconds, today_sessions
    - GET /api/focus/today/ -> sessions today & completed pomodoro count
    - GET /api/focus/weekly/ -> 7-day Mon..Sun breakdown array
    """
    queryset = FocusSession.objects.all().order_by("-created_at")
    serializer_class = FocusSessionSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_authenticated:
            qs = qs.filter(models.Q(owner=user) | models.Q(owner__isnull=True))

        # Query parameter filters
        mode = self.request.query_params.get("mode")
        if mode:
            if mode == "short":
                mode = FocusSession.Mode.SHORT_BREAK
            elif mode == "long":
                mode = FocusSession.Mode.LONG_BREAK
            qs = qs.filter(mode=mode)

        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)

        task_id = self.request.query_params.get("task")
        if task_id:
            qs = qs.filter(task_id=task_id)

        date_param = self.request.query_params.get("date")
        if date_param:
            qs = qs.filter(created_at__date=date_param)

        return qs

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(owner=self.request.user)
        else:
            serializer.save()

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        """
        Aggregate productivity statistics:
        - today_seconds: total seconds in completed pomodoro sessions today
        - week_seconds: total seconds in completed pomodoro sessions this week
        - today_sessions: count of completed pomodoro sessions today
        """
        today = timezone.localdate()
        start_of_week = today - timedelta(days=today.weekday())

        base_qs = self.get_queryset().filter(
            mode=FocusSession.Mode.POMODORO,
            status=FocusSession.Status.COMPLETED,
        )

        today_qs = base_qs.filter(created_at__date=today)
        today_sessions = today_qs.count()
        today_seconds = today_qs.aggregate(total=Sum("duration"))["total"] or 0

        week_qs = base_qs.filter(
            created_at__date__gte=start_of_week,
            created_at__date__lte=today,
        )
        week_seconds = week_qs.aggregate(total=Sum("duration"))["total"] or 0

        return Response({
            "today_seconds": today_seconds,
            "week_seconds": week_seconds,
            "today_sessions": today_sessions,
            "today_minutes": round(today_seconds / 60, 1),
            "week_minutes": round(week_seconds / 60, 1),
        })

    @action(detail=False, methods=["get"], url_path="today")
    def today(self, request):
        """
        Returns all sessions logged today along with the count of completed pomodoros.
        """
        today = timezone.localdate()
        today_qs = self.get_queryset().filter(created_at__date=today)
        pomodoro_count = today_qs.filter(
            mode=FocusSession.Mode.POMODORO,
            status=FocusSession.Status.COMPLETED,
        ).count()
        today_seconds = today_qs.filter(
            mode=FocusSession.Mode.POMODORO,
            status=FocusSession.Status.COMPLETED,
        ).aggregate(total=Sum("duration"))["total"] or 0

        serializer = self.get_serializer(today_qs, many=True)
        return Response({
            "count": pomodoro_count,
            "today_seconds": today_seconds,
            "today_minutes": round(today_seconds / 60, 1),
            "sessions": serializer.data,
        })

    @action(detail=False, methods=["get"], url_path="weekly")
    def weekly(self, request):
        """
        Returns 7-day Monday through Sunday breakdown for the current week.
        """
        today = timezone.localdate()
        start_of_week = today - timedelta(days=today.weekday())
        day_labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

        result = []
        for i in range(7):
            current_day = start_of_week + timedelta(days=i)
            day_qs = self.get_queryset().filter(
                created_at__date=current_day,
                mode=FocusSession.Mode.POMODORO,
                status=FocusSession.Status.COMPLETED,
            )
            count = day_qs.count()
            seconds = day_qs.aggregate(total=Sum("duration"))["total"] or 0
            result.append({
                "day": day_labels[i],
                "date": current_day.isoformat(),
                "count": count,
                "seconds": seconds,
                "minutes": round(seconds / 60, 1),
            })

        return Response(result)
