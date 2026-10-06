"""
Views for the Faith module API.

Provides DRF ReadOnlyModelViewSets and ListAPIViews for:
- Adhkar & Supplications (with category filtering)
- Prophetic Hadiths (with category, grade, search filtering, and Hadith of the Day action)
- Good Deeds catalog (with excuse-mode filtering)
"""
from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Adhkar, Hadith, GoodDeed
from .serializers import AdhkarSerializer, HadithSerializer, GoodDeedSerializer


# ═════════════════════════════════════════════════════════════════════════════
# VIEWSETS (Recommended: Provides List & Detail + Custom Actions)
# ═════════════════════════════════════════════════════════════════════════════

def sync_adhkar_to_habit_util(user, kind, date_str):
    """
    Calculates overall completion percentage for morning or evening adhkar on date_str.
    If 100% of items are done, sets corresponding HabitLog (system_code: morning_adhkar/evening_adhkar) to done.
    If drops below 100%, sets HabitLog to incomplete and scales progress count accordingly.
    """
    if not user or not user.is_authenticated:
        return

    kind_str = str(kind).strip().lower()
    system_code = None
    category_name = None
    if kind_str in ["morning", "morning_adhkar"]:
        system_code = "morning_adhkar"
        category_name = "morning"
    elif kind_str in ["evening", "evening_adhkar"]:
        system_code = "evening_adhkar"
        category_name = "evening"

    if not system_code:
        return

    try:
        from datetime import datetime
        from django.db.models import Q
        from .models import Adhkar
        from api.models import AdhkarLog
        from habits.models import Habit, HabitLog

        total_items = Adhkar.objects.filter(
            Q(category__iexact=category_name) | Q(category_en__iexact=category_name)
        ).count()
        if total_items == 0:
            from api.views import ADHKAR
            total_items = len(ADHKAR.get(category_name, []))

        completed_count = AdhkarLog.objects.filter(
            user=user, date=date_str, kind__iexact=category_name
        ).count()

        is_all_done = (total_items > 0) and (completed_count >= total_items)
        ratio = (completed_count / total_items) if total_items > 0 else 0.0

        # Prioritize habits owned by the current user
        habits_to_sync = Habit.objects.filter(
            owner=user,
            system_code=system_code,
            in_trash=False,
        )
        if not habits_to_sync.exists():
            habits_to_sync = Habit.objects.filter(
                owner__isnull=True,
                system_code=system_code,
                in_trash=False,
            )

        if not habits_to_sync.exists():
            preset_titles = {
                "morning_adhkar": ["Morning Adhkar", "أذكار الصباح"],
                "evening_adhkar": ["Evening Adhkar", "أذكار المساء"],
            }
            habits_to_sync = Habit.objects.filter(
                owner=user,
                title__in=preset_titles.get(system_code, []),
                in_trash=False,
            )
            if not habits_to_sync.exists():
                habits_to_sync = Habit.objects.filter(
                    owner__isnull=True,
                    title__in=preset_titles.get(system_code, []),
                    in_trash=False,
                )
            for h in habits_to_sync:
                if not h.system_code:
                    h.system_code = system_code
                    h.save(update_fields=["system_code"])

        log_date = datetime.strptime(str(date_str).strip(), "%Y-%m-%d").date()

        for habit in habits_to_sync:
            target = max(1, habit.target_count or 1)
            if is_all_done or ratio >= 1.0:
                HabitLog.objects.update_or_create(
                    habit=habit,
                    date=log_date,
                    defaults={
                        "progress_count": target,
                        "is_completed": True,
                    },
                )
            else:
                proportional_progress = int(round(ratio * target))
                existing_log = HabitLog.objects.filter(habit=habit, date=log_date).first()
                if existing_log:
                    existing_log.is_completed = False
                    existing_log.progress_count = proportional_progress
                    existing_log.save(update_fields=["is_completed", "progress_count", "updated_at"])
                elif proportional_progress > 0:
                    HabitLog.objects.create(
                        habit=habit,
                        date=log_date,
                        progress_count=proportional_progress,
                        is_completed=False,
                    )
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning("Failed to sync faith to habit: %s", e)


class AdhkarViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only API ViewSet for Adhkar and Du'as.
    Supports filtering by category/type (e.g., ?category=morning, ?category=evening).

    Endpoints:
    - GET /faith/adhkar/
    - GET /faith/adhkar/{id}/
    - GET /faith/adhkar/?category=morning
    - GET /faith/adhkar/?category=sleep
    """
    queryset = Adhkar.objects.all()
    serializer_class = AdhkarSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_permissions(self):
        if self.action == "create":
            return [permissions.AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get("category") or self.request.query_params.get("type")
        if category:
            cat_str = category.strip()
            queryset = queryset.filter(Q(category__iexact=cat_str) | Q(category_en__iexact=cat_str))
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        data = list(serializer.data)
        if request.user and request.user.is_authenticated:
            from api.models import AdhkarLog
            date_str = request.query_params.get("date") or timezone.now().strftime("%Y-%m-%d")
            done_ids = set(
                AdhkarLog.objects.filter(user=request.user, date=date_str)
                .values_list("item_id", flat=True)
            )
            for item in data:
                item["done"] = str(item["id"]) in done_ids
        else:
            for item in data:
                item["done"] = False
        return Response(data)

    def create(self, request, *args, **kwargs):
        """Toggle completion for an Adhkar item."""
        item_id = str(request.data.get("item_id", request.data.get("id", "")))
        kind = request.data.get("type", "morning")
        date_str = request.data.get("date") or timezone.now().strftime("%Y-%m-%d")
        if request.user and request.user.is_authenticated:
            from api.models import AdhkarLog
            log, created = AdhkarLog.objects.get_or_create(user=request.user, date=date_str, item_id=item_id, kind=kind)
            if not created:
                log.delete()
                is_done = False
            else:
                is_done = True

            # Bidirectional sync: Faith -> Habit
            sync_adhkar_to_habit_util(request.user, kind, date_str)

            return Response({"id": item_id, "type": kind, "done": is_done})
        return Response({"id": item_id, "type": kind, "done": True})



class HadithViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only API ViewSet for the Hadith library.
    Supports filtering by category, grade, and full-text keyword search.

    Endpoints:
    - GET /faith/hadiths/
    - GET /faith/hadiths/{id}/
    - GET /faith/hadiths/?category=اخلاق
    - GET /faith/hadiths/?grade=sahih
    - GET /faith/hadiths/?search=نية
    - GET /faith/hadiths/today/         (Curated Hadith of the Day)
    - GET /faith/hadiths/categories/    (Distinct category tags)
    """
    queryset = Hadith.objects.all()
    serializer_class = HadithSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get("category")
        grade = self.request.query_params.get("grade")
        search = self.request.query_params.get("search")

        if category and category.strip() not in ("الكل", "All"):
            queryset = queryset.filter(category__iexact=category.strip())

        if grade:
            queryset = queryset.filter(grade__iexact=grade.strip())

        if search:
            search_query = search.strip()
            queryset = queryset.filter(
                Q(text__icontains=search_query)
                | Q(translation__icontains=search_query)
                | Q(narrator__icontains=search_query)
                | Q(source__icontains=search_query)
            )

        return queryset

    @action(detail=False, methods=["get"], url_path="today")
    def today(self, request):
        """
        Returns the curated Hadith of the Day based on day-of-year rotation.
        Guarantees deterministic daily rotation across users and platforms.
        """
        hadiths = list(self.get_queryset())
        if not hadiths:
            # Fallback to unfiltered hadiths if filtered set is empty
            hadiths = list(Hadith.objects.all())

        if not hadiths:
            return Response(
                {"detail": "No hadiths found in library."},
                status=status.HTTP_404_NOT_FOUND,
            )

        day_of_year = timezone.now().timetuple().tm_yday
        today_hadith = hadiths[day_of_year % len(hadiths)]
        serializer = self.get_serializer(today_hadith)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="categories")
    def categories(self, request):
        """
        Returns all unique Hadith categories present in the database.
        """
        categories = set(
            Hadith.objects.exclude(category="")
            .order_by()
            .values_list("category", flat=True)
            .distinct()
        )
        cleaned = sorted([c.strip() for c in categories if c and c.strip() not in ("الكل", "All")])
        return Response(["الكل"] + cleaned)


class GoodDeedViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only API ViewSet for the daily Good Deeds catalog.

    Endpoints:
    - GET /faith/deeds/
    - GET /faith/deeds/{id}/
    - GET /faith/deeds/?excused=true (Filters deeds recommended during excuse mode)
    """
    queryset = GoodDeed.objects.all()
    serializer_class = GoodDeedSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_permissions(self):
        if self.action == "create":
            return [permissions.AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        queryset = super().get_queryset()
        excused = self.request.query_params.get("excused")
        if excused is not None and excused.lower() in ("true", "1", "yes"):
            queryset = queryset.filter(is_recommended_excuse=True)
        return queryset

    def create(self, request, *args, **kwargs):
        """Toggle completion for a Good Deed item."""
        deed_id = str(request.data.get("deed_id", request.data.get("id", "")))
        date_str = request.data.get("date")
        if request.user and request.user.is_authenticated:
            from api.models import GoodDeedLog
            log, created = GoodDeedLog.objects.get_or_create(user=request.user, date=date_str, deed_id=deed_id)
            if not created:
                log.delete()
            return Response({"id": deed_id, "done": created})
        return Response({"id": deed_id, "done": True})



# ═════════════════════════════════════════════════════════════════════════════
# GENERIC LIST API VIEWS (Alternative implementation pattern)
# ═════════════════════════════════════════════════════════════════════════════

class AdhkarListView(generics.ListAPIView):
    """Generic ListAPIView for Adhkar items."""
    queryset = Adhkar.objects.all()
    serializer_class = AdhkarSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get("category") or self.request.query_params.get("type")
        if category:
            cat_str = category.strip()
            queryset = queryset.filter(Q(category__iexact=cat_str) | Q(category_en__iexact=cat_str))
        return queryset


class HadithListView(generics.ListAPIView):
    """Generic ListAPIView for Hadiths."""
    queryset = Hadith.objects.all()
    serializer_class = HadithSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get("category")
        if category and category.strip() not in ("الكل", "All"):
            queryset = queryset.filter(category__iexact=category.strip())
        return queryset


class GoodDeedListView(generics.ListAPIView):
    """Generic ListAPIView for Good Deeds."""
    queryset = GoodDeed.objects.all()
    serializer_class = GoodDeedSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
