from datetime import datetime, timedelta

from django.contrib.auth import authenticate, get_user_model
from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

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

User = get_user_model()

PRAYERS = [
    {"key": "fajr", "ar": "الفجر", "en": "Fajr", "time": "05:12", "fard": 2, "sunnah": 2},
    {"key": "dhuhr", "ar": "الظهر", "en": "Dhuhr", "time": "12:47", "fard": 4, "sunnah": 4},
    {"key": "asr", "ar": "العصر", "en": "Asr", "time": "16:20", "fard": 4, "sunnah": 0},
    {"key": "maghrib", "ar": "المغرب", "en": "Maghrib", "time": "20:04", "fard": 3, "sunnah": 2},
    {"key": "isha", "ar": "العشاء", "en": "Isha", "time": "21:38", "fard": 4, "sunnah": 2},
]

ADHKAR = {
    "morning": [
        {"id": "m1", "text": "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ", "count": 1},
        {"id": "m2", "text": "سُبْحَانَ اللهِ وَبِحَمْدِهِ", "count": 100},
        {"id": "m3", "text": "أَعُوذُ بِاللهِ مِنَ الشَّيْطَانِ الرَّجِيمِ", "count": 3},
        {"id": "m4", "text": "بِسْمِ اللهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ", "count": 3},
    ],
    "evening": [
        {"id": "e1", "text": "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ", "count": 1},
        {"id": "e2", "text": "سُبْحَانَ اللهِ وَبِحَمْدِهِ", "count": 100},
        {"id": "e3", "text": "اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا", "count": 1},
    ],
}

GOOD_DEEDS = [
    {"id": "fast", "ar": "صيام", "en": "Fasting", "emoji": "🌙"},
    {"id": "sadaqa", "ar": "صدقة", "en": "Sadaqah", "emoji": "💰"},
    {"id": "quran", "ar": "قراءة القرآن", "en": "Read Quran", "emoji": "📖"},
    {"id": "qiyam", "ar": "قيام الليل", "en": "Night Prayer", "emoji": "🌟"},
    {"id": "sick", "ar": "عيادة مريض", "en": "Visit Sick", "emoji": "🤲"},
    {"id": "help", "ar": "مساعدة غيره", "en": "Help Others", "emoji": "🫂"},
    {"id": "duaa", "ar": "دعاء", "en": "Make Duaa", "emoji": "🙏"},
    {"id": "silah", "ar": "صلة الرحم", "en": "Family Ties", "emoji": "❤️"},
]


def current_date(request, key="date"):
    value = request.query_params.get(key) or request.data.get(key)
    if not value:
        return timezone.localdate()
    try:
        return datetime.strptime(str(value), "%Y-%m-%d").date()
    except ValueError:
        return timezone.localdate()


def profile_for(user):
    profile, _ = Profile.objects.get_or_create(user=user)
    return profile


def user_payload(user):
    profile = profile_for(user)
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "gender": profile.gender,
        "is_excused": profile.is_excused,
        "isExcused": profile.is_excused,
    }


def task_payload(task):
    due_today = task.due_date == timezone.localdate()
    return {
        "id": task.id,
        "text": task.text,
        "done": task.done,
        "priority": task.priority,
        "tag": task.tag,
        "list": task.list_name,
        "list_name": task.list_name,
        "dueToday": due_today,
        "due_today": due_today,
        "dueDate": task.due_date.isoformat() if task.due_date else None,
        "notes": task.notes,
        "createdAt": task.created_at,
        "updatedAt": task.updated_at,
    }


def habit_streak(habit, through=None):
    through = through or timezone.localdate()
    completed = set(habit.completions.values_list("date", flat=True))
    streak = 0
    cursor = through
    while cursor in completed:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def habit_payload(habit):
    dates = [d.isoformat() for d in habit.completions.values_list("date", flat=True)]
    return {
        "id": habit.id,
        "name": habit.name,
        "emoji": habit.emoji,
        "area": habit.area,
        "notes": habit.notes,
        "streak": habit_streak(habit),
        "completedDates": dates,
        "completed_dates": dates,
    }


def parse_task_data(data, existing=None):
    existing = existing or {}
    value = lambda key, fallback=None: data.get(key, existing.get(key, fallback))
    due_date = value("due_date", value("dueDate"))
    due_today = value("dueToday", value("due_today", False))
    if due_today is True or str(due_today).lower() == "true":
        due_date = timezone.localdate()
    elif due_date:
        try:
            due_date = datetime.strptime(str(due_date), "%Y-%m-%d").date()
        except ValueError:
            due_date = None
    else:
        due_date = None
    return {
        "text": str(value("text", "")).strip(),
        "done": bool(value("done", False)),
        "priority": value("priority", "medium"),
        "tag": str(value("tag", "General")).strip() or "General",
        "list_name": str(value("list", value("list_name", "Personal"))).strip() or "Personal",
        "due_date": due_date,
        "notes": str(value("notes", "")),
    }


@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    return Response({"status": "ok", "service": "pillar-api"})


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    username = str(request.data.get("username", "")).strip()
    email = str(request.data.get("email", "")).strip()
    password = request.data.get("password", "")
    password2 = request.data.get("password2", password)
    if not username or not password:
        return Response({"detail": "Username and password are required."}, status=status.HTTP_400_BAD_REQUEST)
    if password != password2:
        return Response({"password": ["Passwords do not match."]}, status=status.HTTP_400_BAD_REQUEST)
    if len(password) < 8:
        return Response({"password": ["Password must be at least 8 characters."]}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(username__iexact=username).exists():
        return Response({"username": ["A user with that username already exists."]}, status=status.HTTP_400_BAD_REQUEST)
    try:
        with transaction.atomic():
            user = User.objects.create_user(username=username, email=email, password=password)
            Profile.objects.create(user=user)
    except IntegrityError:
        return Response({"username": ["A user with that username already exists."]}, status=status.HTTP_400_BAD_REQUEST)
    return Response(user_payload(user), status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get("username", "")
    password = request.data.get("password", "")
    user = authenticate(request, username=username, password=password)
    if not user:
        return Response({"detail": "Invalid username or password."}, status=status.HTTP_401_UNAUTHORIZED)
    refresh = RefreshToken.for_user(user)
    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": user_payload(user),
    })


@api_view(["GET", "PATCH"])
def me(request):
    profile = profile_for(request.user)
    if request.method == "PATCH":
        if "email" in request.data:
            request.user.email = str(request.data["email"]).strip()
            request.user.save(update_fields=["email"])
        if "gender" in request.data and not profile.gender:
            profile.gender = request.data["gender"]
        if "is_excused" in request.data:
            profile.is_excused = bool(request.data["is_excused"])
        if "isExcused" in request.data:
            profile.is_excused = bool(request.data["isExcused"])
        profile.save()
    return Response(user_payload(request.user))


@api_view(["GET", "POST"])
def tasks(request):
    if request.method == "GET":
        queryset = Task.objects.filter(owner=request.user)
        if request.query_params.get("done") in ("true", "false"):
            queryset = queryset.filter(done=request.query_params["done"] == "true")
        if request.query_params.get("list"):
            queryset = queryset.filter(list_name=request.query_params["list"])
        if request.query_params.get("tag"):
            queryset = queryset.filter(tag=request.query_params["tag"])
        if request.query_params.get("due_today") == "true":
            queryset = queryset.filter(due_date=timezone.localdate())
        return Response([task_payload(task) for task in queryset])
    values = parse_task_data(request.data)
    if not values["text"]:
        return Response({"text": ["Task text is required."]}, status=status.HTTP_400_BAD_REQUEST)
    if values["priority"] not in {"high", "medium", "low"}:
        return Response({"priority": ["Priority must be high, medium, or low."]}, status=status.HTTP_400_BAD_REQUEST)
    task = Task.objects.create(owner=request.user, **values)
    return Response(task_payload(task), status=status.HTTP_201_CREATED)


@api_view(["PATCH", "DELETE"])
def task_detail(request, task_id):
    try:
        task = Task.objects.get(id=task_id, owner=request.user)
    except Task.DoesNotExist:
        return Response({"detail": "Task not found."}, status=status.HTTP_404_NOT_FOUND)
    if request.method == "DELETE":
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    values = parse_task_data(request.data, task_payload(task))
    if not values["text"]:
        return Response({"text": ["Task text is required."]}, status=status.HTTP_400_BAD_REQUEST)
    for field, value in values.items():
        setattr(task, field, value)
    task.save()
    return Response(task_payload(task))


def named_items(request, model, payload_key):
    if request.method == "GET":
        items = model.objects.filter(owner=request.user)
        return Response([
            {"id": item.id, "name": item.name, "color": item.color}
            for item in items
        ])
    name = str(request.data.get("name", "")).strip()
    if not name:
        return Response({"name": ["Name is required."]}, status=status.HTTP_400_BAD_REQUEST)
    item, _ = model.objects.get_or_create(
        owner=request.user,
        name=name,
        defaults={"color": str(request.data.get("color", ""))},
    )
    return Response({"id": item.id, "name": item.name, "color": item.color}, status=status.HTTP_201_CREATED)


@api_view(["GET", "POST"])
def task_lists(request):
    return named_items(request, TaskList, "lists")


@api_view(["GET", "POST"])
def task_tags(request):
    return named_items(request, TaskTag, "tags")


@api_view(["GET", "POST"])
def habits(request):
    if request.method == "GET":
        queryset = Habit.objects.filter(owner=request.user)
        if request.query_params.get("area"):
            queryset = queryset.filter(area=request.query_params["area"])
        return Response([habit_payload(habit) for habit in queryset])
    name = str(request.data.get("name", "")).strip()
    if not name:
        return Response({"name": ["Habit name is required."]}, status=status.HTTP_400_BAD_REQUEST)
    habit = Habit.objects.create(
        owner=request.user,
        name=name,
        emoji=str(request.data.get("emoji", "🎯")),
        area=str(request.data.get("area", "Morning")),
        notes=str(request.data.get("notes", "")),
    )
    return Response(habit_payload(habit), status=status.HTTP_201_CREATED)


@api_view(["PATCH", "DELETE"])
def habit_detail(request, habit_id):
    try:
        habit = Habit.objects.get(id=habit_id, owner=request.user)
    except Habit.DoesNotExist:
        return Response({"detail": "Habit not found."}, status=status.HTTP_404_NOT_FOUND)
    if request.method == "DELETE":
        habit.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    for field in ("name", "emoji", "area", "notes"):
        if field in request.data:
            setattr(habit, field, str(request.data[field]))
    habit.save()
    return Response(habit_payload(habit))


@api_view(["POST"])
def habit_toggle(request, habit_id):
    try:
        habit = Habit.objects.get(id=habit_id, owner=request.user)
    except Habit.DoesNotExist:
        return Response({"detail": "Habit not found."}, status=status.HTTP_404_NOT_FOUND)
    date = current_date(request)
    completion, created = HabitCompletion.objects.get_or_create(habit=habit, date=date)
    if not created:
        completion.delete()
    return Response(habit_payload(habit))


@api_view(["GET"])
def habit_heatmap(request):
    try:
        days = max(1, min(int(request.query_params.get("days", 35)), 365))
    except ValueError:
        days = 35
    end = timezone.localdate()
    start = end - timedelta(days=days - 1)
    habit_list = list(Habit.objects.filter(owner=request.user))
    output = []
    for offset in range(days):
        date = start + timedelta(days=offset)
        done = sum(habit.completions.filter(date=date).exists() for habit in habit_list)
        output.append({"date": date.isoformat(), "done": done, "pct": done / len(habit_list) if habit_list else 0})
    return Response(output)


@api_view(["GET"])
def prayers(request):
    date = current_date(request)
    logs = {log.prayer_key: log for log in PrayerLog.objects.filter(user=request.user, date=date)}
    return Response([
        {**prayer, "fardDone": bool(logs.get(prayer["key"]) and logs[prayer["key"]].fard_done),
         "sunnahDone": logs.get(prayer["key"]).sunnah_done if logs.get(prayer["key"]) else 0}
        for prayer in PRAYERS
    ])


@api_view(["PATCH"])
def prayer_toggle(request, prayer_key):
    if prayer_key not in {prayer["key"] for prayer in PRAYERS}:
        return Response({"detail": "Prayer not found."}, status=status.HTTP_404_NOT_FOUND)
    date = current_date(request)
    log, _ = PrayerLog.objects.get_or_create(user=request.user, date=date, prayer_key=prayer_key)
    log.fard_done = not log.fard_done
    log.save(update_fields=["fard_done"])
    return Response({"key": prayer_key, "fardDone": log.fard_done, "sunnahDone": log.sunnah_done})


@api_view(["GET", "POST"])
def adhkar(request):
    date = current_date(request)
    kind = request.query_params.get("type") or request.data.get("type") or "morning"
    if kind not in ADHKAR:
        return Response({"detail": "Adhkar type must be morning or evening."}, status=status.HTTP_400_BAD_REQUEST)
    if request.method == "POST":
        item_id = str(request.data.get("item_id", request.data.get("id", "")))
        log, created = AdhkarLog.objects.get_or_create(user=request.user, date=date, item_id=item_id, kind=kind)
        if not created:
            log.delete()
        return Response({"id": item_id, "type": kind, "done": created})
    done = set(AdhkarLog.objects.filter(user=request.user, date=date, kind=kind).values_list("item_id", flat=True))
    return Response([{**item, "done": item["id"] in done} for item in ADHKAR[kind]])


@api_view(["GET", "PATCH"])
def khatmah(request):
    tracker, _ = Khatmah.objects.get_or_create(user=request.user)
    if request.method == "PATCH":
        page = request.data.get("current_page", request.data.get("currentPage"))
        target = request.data.get("target_pages", request.data.get("targetPages"))
        if page is not None:
            tracker.current_page = max(0, min(int(page), tracker.target_pages))
        if target is not None:
            tracker.target_pages = max(1, int(target))
        tracker.save()
    return Response({
        "current_page": tracker.current_page,
        "currentPage": tracker.current_page,
        "target_pages": tracker.target_pages,
        "targetPages": tracker.target_pages,
    })


@api_view(["GET", "POST"])
def deeds(request):
    date = current_date(request)
    if request.method == "POST":
        deed_id = str(request.data.get("deed_id", request.data.get("id", "")))
        if deed_id not in {deed["id"] for deed in GOOD_DEEDS}:
            return Response({"detail": "Deed not found."}, status=status.HTTP_404_NOT_FOUND)
        log, created = GoodDeedLog.objects.get_or_create(user=request.user, date=date, deed_id=deed_id)
        if not created:
            log.delete()
        return Response({"id": deed_id, "done": created})
    done = set(GoodDeedLog.objects.filter(user=request.user, date=date).values_list("deed_id", flat=True))
    return Response([{**deed, "done": deed["id"] in done} for deed in GOOD_DEEDS])


def session_payload(session):
    return {
        "id": session.id,
        "label": session.label,
        "duration_minutes": session.duration_minutes,
        "mode": session.mode,
        "started_at": session.started_at,
        "completed_at": session.completed_at,
    }


@api_view(["GET", "POST"])
def sessions(request):
    if request.method == "POST":
        mode = request.data.get("mode", "pomodoro")
        if mode not in {"pomodoro", "short", "long"}:
            return Response({"mode": ["Invalid session mode."]}, status=status.HTTP_400_BAD_REQUEST)
        started_at = request.data.get("started_at")
        parsed_started = None
        if started_at:
            try:
                parsed_started = datetime.fromisoformat(str(started_at).replace("Z", "+00:00"))
                if timezone.is_naive(parsed_started):
                    parsed_started = timezone.make_aware(parsed_started)
            except ValueError:
                parsed_started = None
        session = FocusSession.objects.create(
            user=request.user,
            label=str(request.data.get("label", "Focus Session")),
            duration_minutes=max(1, int(request.data.get("duration_minutes", 25))),
            mode=mode,
            started_at=parsed_started,
        )
        return Response(session_payload(session), status=status.HTTP_201_CREATED)
    queryset = FocusSession.objects.filter(user=request.user)
    return Response([session_payload(session) for session in queryset[:100]])


@api_view(["GET"])
def sessions_today(request):
    today = timezone.localdate()
    queryset = [
        session for session in FocusSession.objects.filter(user=request.user)
        if timezone.localtime(session.completed_at).date() == today
    ]
    pomodoros = [session for session in queryset if session.mode == "pomodoro"]
    return Response({"count": len(pomodoros), "sessions": [session_payload(session) for session in queryset]})


@api_view(["GET"])
def sessions_weekly(request):
    today = timezone.localdate()
    monday = today - timedelta(days=today.weekday())
    sessions_by_day = {monday + timedelta(days=i): 0 for i in range(7)}
    for session in FocusSession.objects.filter(user=request.user, mode="pomodoro"):
        day = timezone.localtime(session.completed_at).date()
        if day in sessions_by_day:
            sessions_by_day[day] += 1
    return Response([
        {"date": (monday + timedelta(days=i)).isoformat(), "count": sessions_by_day[monday + timedelta(days=i)]}
        for i in range(7)
    ])