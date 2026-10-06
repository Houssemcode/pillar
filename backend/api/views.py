from datetime import datetime, timedelta
import urllib.parse

from django.contrib.auth import authenticate, get_user_model
from django.db import IntegrityError, models, transaction
from django.utils import timezone
from rest_framework import status, viewsets, permissions, generics
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .serializers import (
    UserProfileSerializer,
    UserSerializer,
    UserRegistrationSerializer,
)

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

User = get_user_model()

# Calculation method identifiers for Aladhan API
PRAYER_METHODS = {
    "MWL":    2,   # Muslim World League
    "ISNA":   2,   # Islamic Society of North America (same as MWL for API)
    "Egypt":  5,   # Egyptian General Authority
    "Makkah": 4,   # Umm Al-Qura, Makkah
    "Karachi":1,   # University of Islamic Sciences, Karachi
    "Tehran": 7,   # Institute of Geophysics, University of Tehran
    "Jafari": 0,   # Shia Ithna-Ashari (Jafari)
}

# Static prayer metadata (times injected dynamically at request time)
PRAYER_META = [
    {"key": "fajr",    "ar": "الفجر",   "en": "Fajr",    "fard": 2, "sunnah": 2},
    {"key": "dhuhr",   "ar": "الظهر",   "en": "Dhuhr",   "fard": 4, "sunnah": 4},
    {"key": "asr",     "ar": "العصر",   "en": "Asr",     "fard": 4, "sunnah": 0},
    {"key": "maghrib", "ar": "المغرب", "en": "Maghrib", "fard": 3, "sunnah": 2},
    {"key": "isha",    "ar": "العشاء",  "en": "Isha",    "fard": 4, "sunnah": 2},
]

# Fallback times (Tunis, Tunisia) used when Aladhan is unavailable or unconfigured
FALLBACK_TIMES = {"fajr": "05:12", "dhuhr": "12:47", "asr": "16:20", "maghrib": "20:04", "isha": "21:38"}


def get_prayer_times(profile, target_date):
    """
    Fetch prayer times from Aladhan.com API for the user's configured location.
    Returns a list of PRAYERS dicts with accurate `time` fields.
    Falls back to FALLBACK_TIMES if no location is set or API is unreachable.
    """
    import urllib.request, json as json_lib

    prefs = profile.preferences or {} if profile else {}
    city = (getattr(profile, "city", "") or prefs.get("prayerCity", "") or "Tunis").strip()
    country = (getattr(profile, "country", "") or prefs.get("prayerCountry", "") or "Tunisia").strip()
    calc_method_key = getattr(profile, "calculation_method", "") or prefs.get("prayerMethod", "MWL")
    method = PRAYER_METHODS.get(calc_method_key, 2)
    asr_method = 0 if prefs.get("asrMethod", "standard") == "hanafi" else 0  # 0=Shafi/Standard

    times = FALLBACK_TIMES.copy()

    if city and country:
        try:
            date_str = target_date.strftime("%d-%m-%Y")
            url = (
                f"https://api.aladhan.com/v1/timingsByCity/{date_str}"
                f"?city={urllib.parse.quote(city)}&country={urllib.parse.quote(country)}"
                f"&method={method}&school={asr_method}"
            )
            with urllib.request.urlopen(url, timeout=4) as resp:
                data = json_lib.loads(resp.read())
            raw = data.get("data", {}).get("timings", {})
            for key in ("fajr", "dhuhr", "asr", "maghrib", "isha"):
                t = raw.get(key.capitalize() if key != "dhuhr" else "Dhuhr",
                            raw.get(key.title(), FALLBACK_TIMES[key]))
                # Strip timezone offset annotations if present (e.g. "12:47 (+01)")
                times[key] = t.split(" ")[0][:5]
        except Exception:
            pass  # graceful fallback to static times

    return [
        {**meta, "time": times.get(meta["key"], FALLBACK_TIMES[meta["key"]])}
        for meta in PRAYER_META
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
        "first_name": user.first_name,
        "last_name": user.last_name,
        "gender": profile.gender,
        "is_excused": profile.is_excused,
        "isExcused": profile.is_excused,
        "bio": profile.bio,
        "headline": profile.headline,
        "avatar": profile.avatar,
        "language": getattr(profile, "language", "en") or "en",
        "theme": getattr(profile, "theme", "dark") or "dark",
        "city": getattr(profile, "city", "Tunis") or "Tunis",
        "country": getattr(profile, "country", "Tunisia") or "Tunisia",
        "calculation_method": getattr(profile, "calculation_method", "MWL") or "MWL",
        "preferences": profile.preferences or {},
        "date_joined": user.date_joined.isoformat() if getattr(user, "date_joined", None) else None,
    }


def task_payload(task):
    due_today = task.due_date == timezone.localdate()
    tag_obj = TaskTag.objects.filter(name__iexact=task.tag, in_trash=False).first() if task.tag else None
    tag_color = tag_obj.color if tag_obj else ""
    return {
        "id": task.id,
        "text": task.text,
        "done": task.done,
        "priority": task.priority,
        "tag": task.tag,
        "tag_color": tag_color,
        "tagColor": tag_color,
        "list": task.list_name,
        "list_name": task.list_name,
        "dueToday": due_today,
        "due_today": due_today,
        "dueDate": task.due_date.isoformat() if task.due_date else None,
        "startDate": task.start_date.isoformat() if getattr(task, 'start_date', None) else None,
        "dueTime": getattr(task, 'due_time', ''),
        "recurrence": getattr(task, 'recurrence', ''),
        "notes": task.notes,
        "subtasks": getattr(task, 'subtasks', []) or [],
        "attachments": getattr(task, 'attachments', []) or [],
        "inTrash": getattr(task, 'in_trash', False),
        "in_trash": getattr(task, 'in_trash', False),
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
    completions = habit.completions.values("date", "completed_amount")
    dates = [c["date"].isoformat() for c in completions]

    return {
        "id": habit.id,
        "name": habit.name,
        "emoji": habit.emoji,
        "color": habit.color,
        "areas": habit.areas,
        "area": habit.areas[0] if habit.areas else habit.area,
        "goal_amount": habit.goal_amount,
        "goal_unit": habit.goal_unit,
        "frequency": habit.frequency,
        "frequency_days": habit.frequency_days,
        "reminder_time": habit.reminder_time.isoformat() if habit.reminder_time else None,
        "is_archived": habit.is_archived,
        "in_trash": habit.in_trash,
        "notes": habit.notes,
        "streak": habit_streak(habit),
        "completedDates": dates,
        "completed_dates": dates,
        "completions": [{"date": c["date"].isoformat(), "amount": c["completed_amount"]} for c in completions]
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

    start_date = value("start_date", value("startDate"))
    if start_date:
        try:
            start_date = datetime.strptime(str(start_date), "%Y-%m-%d").date()
        except ValueError:
            start_date = None
    else:
        start_date = None

    subtasks = value("subtasks", [])
    if not isinstance(subtasks, list):
        subtasks = []

    attachments = value("attachments", [])
    if not isinstance(attachments, list):
        attachments = []

    return {
        "text": str(value("text", "")).strip(),
        "done": bool(value("done", False)),
        "priority": value("priority", "medium"),
        "tag": str(value("tag", "General")).strip() or "General",
        "list_name": str(value("list", value("list_name", "Personal"))).strip() or "Personal",
        "due_date": due_date,
        "start_date": start_date,
        "due_time": str(value("due_time", value("dueTime", ""))),
        "recurrence": value("recurrence", ""),
        "notes": str(value("notes", "")),
        "subtasks": subtasks,
        "attachments": attachments,
        "in_trash": bool(value("in_trash", value("inTrash", False))),
    }


@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    return Response({"status": "ok", "service": "pillar-api"})


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = user_payload(self.user)
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            "user": user_payload(user),
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "message": "User registered successfully.",
        }, status=status.HTTP_201_CREATED)


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
    if len(password) < 6:
        return Response({"password": ["Password must be at least 6 characters."]}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(username__iexact=username).exists():
        return Response({"username": ["A user with that username already exists."]}, status=status.HTTP_400_BAD_REQUEST)
    try:
        with transaction.atomic():
            user = User.objects.create_user(username=username, email=email, password=password)
            Profile.objects.create(user=user)
    except IntegrityError:
        return Response({"username": ["A user with that username already exists."]}, status=status.HTTP_400_BAD_REQUEST)
    refresh = RefreshToken.for_user(user)
    return Response({
        "user": user_payload(user),
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }, status=status.HTTP_201_CREATED)


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
        user_update_fields = []
        if "email" in request.data:
            email_val = str(request.data["email"]).strip()
            if email_val != request.user.email:
                request.user.email = email_val
                user_update_fields.append("email")
        if "first_name" in request.data:
            request.user.first_name = str(request.data["first_name"]).strip()
            user_update_fields.append("first_name")
        if "last_name" in request.data:
            request.user.last_name = str(request.data["last_name"]).strip()
            user_update_fields.append("last_name")
        if "username" in request.data:
            new_username = str(request.data["username"]).strip()
            if new_username and new_username != request.user.username:
                if User.objects.filter(username__iexact=new_username).exclude(id=request.user.id).exists():
                    return Response({"username": ["A user with that username already exists."]}, status=status.HTTP_400_BAD_REQUEST)
                request.user.username = new_username
                user_update_fields.append("username")
        if user_update_fields:
            request.user.save(update_fields=user_update_fields)

        if "gender" in request.data:
            profile.gender = request.data["gender"]
        if "is_excused" in request.data:
            profile.is_excused = bool(request.data["is_excused"])
        if "isExcused" in request.data:
            profile.is_excused = bool(request.data["isExcused"])
        if "bio" in request.data:
            profile.bio = str(request.data["bio"]).strip()
        if "headline" in request.data:
            profile.headline = str(request.data["headline"]).strip()
        if "avatar" in request.data:
            profile.avatar = str(request.data["avatar"]).strip()
        if "language" in request.data:
            profile.language = str(request.data["language"]).strip()
        if "theme" in request.data:
            profile.theme = str(request.data["theme"]).strip()
        if "city" in request.data:
            profile.city = str(request.data["city"]).strip()
        if "country" in request.data:
            profile.country = str(request.data["country"]).strip()
        if "calculation_method" in request.data:
            profile.calculation_method = str(request.data["calculation_method"]).strip()
        if "preferences" in request.data and isinstance(request.data["preferences"], dict):
            current_prefs = profile.preferences if isinstance(profile.preferences, dict) else {}
            current_prefs.update(request.data["preferences"])
            if "prayerCity" in current_prefs:
                profile.city = current_prefs["prayerCity"]
            if "prayerCountry" in current_prefs:
                profile.country = current_prefs["prayerCountry"]
            if "prayerMethod" in current_prefs:
                profile.calculation_method = current_prefs["prayerMethod"]
            if "language" in current_prefs:
                profile.language = current_prefs["language"]
            if "theme" in current_prefs:
                profile.theme = current_prefs["theme"]
            elif "colorTheme" in current_prefs:
                profile.theme = current_prefs["colorTheme"]
            profile.preferences = current_prefs
        profile.save()
    return Response(user_payload(request.user))


@api_view(["POST"])
def change_password(request):
    user = request.user
    current_password = request.data.get("current_password") or request.data.get("currentPassword", "")
    new_password = request.data.get("new_password") or request.data.get("newPassword", "")
    confirm_password = request.data.get("confirm_password") or request.data.get("confirmPassword", "")

    if not current_password or not new_password:
        return Response({"detail": "Current password and new password are required."}, status=status.HTTP_400_BAD_REQUEST)
    if not user.check_password(current_password):
        return Response({"current_password": ["Current password is incorrect."]}, status=status.HTTP_400_BAD_REQUEST)
    if len(new_password) < 8:
        return Response({"new_password": ["Password must be at least 8 characters long."]}, status=status.HTTP_400_BAD_REQUEST)
    if confirm_password and new_password != confirm_password:
        return Response({"confirm_password": ["Passwords do not match."]}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()
    return Response({"detail": "Password updated successfully."})


@api_view(["GET"])
def profile_stats(request):
    user = request.user
    today = timezone.localdate()

    # Tasks stats
    user_tasks = Task.objects.filter(owner=user, in_trash=False)
    tasks_total = user_tasks.count()
    tasks_completed = user_tasks.filter(done=True).count()
    tasks_due_today = user_tasks.filter(due_date=today, done=False).count()

    # Habits stats
    user_habits = Habit.objects.filter(owner=user, in_trash=False, is_archived=False)
    habits_active = user_habits.count()
    habit_completions = HabitCompletion.objects.filter(habit__owner=user).count()
    longest_streak = 0
    for h in user_habits:
        s = habit_streak(h, through=today)
        if s > longest_streak:
            longest_streak = s

    # Focus stats
    user_sessions = FocusSession.objects.filter(user=user, in_trash=False)
    focus_sessions_count = user_sessions.count()
    focus_minutes = user_sessions.aggregate(total=models.Sum("duration_minutes"))["total"] or 0

    # Faith stats
    prayers_logged = PrayerLog.objects.filter(user=user, fard_done=True).count()
    khatmah_obj = Khatmah.objects.filter(user=user).first()
    khatmah_page = khatmah_obj.current_page if khatmah_obj else 0

    return Response({
        "tasks": {
            "total": tasks_total,
            "completed": tasks_completed,
            "active": tasks_total - tasks_completed,
            "due_today": tasks_due_today,
            "rate": round((tasks_completed / tasks_total * 100) if tasks_total > 0 else 0),
        },
        "habits": {
            "active": habits_active,
            "total_completions": habit_completions,
            "longest_streak": longest_streak,
        },
        "focus": {
            "sessions_count": focus_sessions_count,
            "total_minutes": focus_minutes,
            "total_hours": round(focus_minutes / 60, 1),
        },
        "faith": {
            "prayers_logged": prayers_logged,
            "khatmah_page": khatmah_page,
            "khatmah_target": 604,
            "khatmah_percent": round((khatmah_page / 604 * 100), 1) if khatmah_page else 0,
        }
    })


@api_view(["GET"])
def export_data(request):
    user = request.user
    profile = profile_for(user)

    data = {
        "user": {
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "date_joined": user.date_joined.isoformat() if getattr(user, "date_joined", None) else None,
            "profile": {
                "gender": profile.gender,
                "bio": profile.bio,
                "headline": profile.headline,
                "avatar": profile.avatar,
                "preferences": profile.preferences,
            }
        },
        "tasks": [task_payload(t) for t in Task.objects.filter(owner=user)],
        "task_lists": list(TaskList.objects.filter(owner=user).values("name", "color", "default_view")),
        "task_tags": list(TaskTag.objects.filter(owner=user).values("name", "color")),
        "habits": [habit_payload(h) for h in Habit.objects.filter(owner=user)],
        "calendar_events": list(CalendarEvent.objects.filter(owner=user).values(
            "id", "title", "description", "location", "all_day", "start_date", "end_date",
            "start_time", "end_time", "color", "category", "is_recurring", "recurrence"
        )),
        "focus_sessions": list(FocusSession.objects.filter(user=user).values(
            "id", "label", "duration_minutes", "mode", "started_at", "completed_at"
        )),
        "faith": {
            "prayer_logs": list(PrayerLog.objects.filter(user=user).values("date", "prayer_key", "fard_done", "sunnah_done")),
            "adhkar_logs": list(AdhkarLog.objects.filter(user=user).values("date", "item_id", "kind")),
            "khatmah": list(Khatmah.objects.filter(user=user).values("current_page", "target_pages", "updated_at")),
            "good_deeds": list(GoodDeedLog.objects.filter(user=user).values("date", "deed_id")),
        },
        "exported_at": timezone.now().isoformat(),
    }
    return Response(data)


@api_view(["POST"])
def delete_account(request):
    user = request.user
    confirm_text = request.data.get("confirm", "")
    password = request.data.get("password", "")

    if confirm_text != f"delete-{user.username}":
        return Response({"detail": f"Please type 'delete-{user.username}' to confirm."}, status=status.HTTP_400_BAD_REQUEST)
    if not user.check_password(password):
        return Response({"password": ["Incorrect password."]}, status=status.HTTP_400_BAD_REQUEST)

    user.delete()
    return Response({"detail": "Account deleted successfully."})



@api_view(["GET", "POST"])
def tasks(request):
    if request.method == "GET":
        queryset = Task.objects.filter(owner=request.user)
        trash_param = request.query_params.get("trash")
        if trash_param == "true":
            queryset = queryset.filter(in_trash=True)
        elif trash_param != "all":
            queryset = queryset.filter(in_trash=False)

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
    if values["priority"] not in {"high", "medium", "low", "none"}:
        values["priority"] = "medium"
    task = Task.objects.create(owner=request.user, **values)
    return Response(task_payload(task), status=status.HTTP_201_CREATED)


@api_view(["PATCH", "DELETE"])
def task_detail(request, task_id):
    try:
        task = Task.objects.get(id=task_id, owner=request.user)
    except Task.DoesNotExist:
        return Response({"detail": "Task not found."}, status=status.HTTP_404_NOT_FOUND)
    if request.method == "DELETE":
        permanent = request.query_params.get("permanent") == "true"
        if task.in_trash or permanent:
            task.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            task.in_trash = True
            task.save()
            return Response(task_payload(task), status=status.HTTP_200_OK)
    values = parse_task_data(request.data, task_payload(task))
    if not values["text"]:
        return Response({"text": ["Task text is required."]}, status=status.HTTP_400_BAD_REQUEST)
    
    was_done = task.done
    is_done = values["done"]
    
    for field, value in values.items():
        setattr(task, field, value)
    task.save()
    
    # Auto-generate next recurrence if marked done
    if not was_done and is_done and isinstance(task.recurrence, dict) and task.recurrence.get("freq"):
        # We use a dummy event to utilize expand_recurring
        class DummyEvent:
            def __init__(self, start_date, recurrence):
                self.start_date = start_date
                self.recurrence = recurrence
        
        base_date = task.due_date or timezone.localdate()
        dummy = DummyEvent(base_date, task.recurrence)
        
        # Look for the next occurrence within a reasonable future window (e.g., 5 years)
        end_window = base_date + timedelta(days=365*5)
        generator = expand_recurring(dummy, base_date + timedelta(days=1), end_window)
        
        try:
            next_date = next(generator)
            
            # Create the new task
            Task.objects.create(
                owner=task.owner,
                text=task.text,
                done=False,
                priority=task.priority,
                tag=task.tag,
                list_name=task.list_name,
                due_date=next_date,
                due_time=task.due_time,
                notes=task.notes,
                subtasks=[{**st, "done": False} for st in task.subtasks],
                attachments=task.attachments,
                recurrence=task.recurrence
            )
            # Remove recurrence from the completed instance to detach them visually if needed,
            # or keep it. Often it's kept to show it was part of a series. We'll keep it.
        except StopIteration:
            pass

    return Response(task_payload(task))


def named_items(request, model, payload_key):
    if request.method == "GET":
        items = model.objects.filter(owner=request.user, in_trash=False)
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
    if request.method == "GET":
        items = TaskList.objects.filter(owner=request.user, in_trash=False)
        return Response([
            {
                "id": item.id,
                "name": item.name,
                "color": getattr(item, "accent_color", "") or item.color or "#10B981",
                "accent_color": getattr(item, "accent_color", "") or item.color or "#10B981",
                "accentColor": getattr(item, "accent_color", "") or item.color or "#10B981",
                "default_view": item.default_view,
                "defaultView": item.default_view,
            }
            for item in items
        ])
    name = str(request.data.get("name", "")).strip()
    if not name:
        return Response({"name": ["Name is required."]}, status=status.HTTP_400_BAD_REQUEST)
    default_view = str(request.data.get("default_view", request.data.get("defaultView", "list"))).strip()
    if default_view not in ("list", "kanban", "timeline"):
        default_view = "list"
    accent_color = str(request.data.get("accent_color", request.data.get("accentColor", request.data.get("color", "#10B981")))).strip() or "#10B981"
    item, created = TaskList.objects.get_or_create(
        owner=request.user,
        name=name,
        defaults={
            "color": accent_color,
            "accent_color": accent_color,
            "default_view": default_view,
        },
    )
    if not created:
        item.color = accent_color
        item.accent_color = accent_color
        item.default_view = default_view
        item.save()

    return Response({
        "id": item.id,
        "name": item.name,
        "color": accent_color,
        "accent_color": accent_color,
        "accentColor": accent_color,
        "default_view": item.default_view,
        "defaultView": item.default_view,
    }, status=status.HTTP_201_CREATED)


@api_view(["GET", "POST"])
def task_tags(request):
    return named_items(request, TaskTag, "tags")


@api_view(["DELETE"])
def task_list_detail(request, identifier):
    try:
        if str(identifier).isdigit():
            item = TaskList.objects.get(id=int(identifier), owner=request.user)
        else:
            item = TaskList.objects.get(name=identifier, owner=request.user)
        if request.query_params.get("permanent") == "true" or item.in_trash:
            item.delete()
            Task.objects.filter(owner=request.user, list_name=identifier).update(list_name="")
        else:
            item.in_trash = True
            item.save()
    except TaskList.DoesNotExist:
        pass
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["DELETE"])
def task_tag_detail(request, identifier):
    try:
        if str(identifier).isdigit():
            item = TaskTag.objects.get(id=int(identifier), owner=request.user)
        else:
            item = TaskTag.objects.get(name=identifier, owner=request.user)
        if request.query_params.get("permanent") == "true" or item.in_trash:
            item.delete()
            Task.objects.filter(owner=request.user, tag=identifier).update(tag="")
        else:
            item.in_trash = True
            item.save()
    except TaskTag.DoesNotExist:
        pass
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET", "POST"])
def habits(request):
    if request.method == "GET":
        from django.db.models import Q
        queryset = Habit.objects.filter(owner=request.user, in_trash=False)
        if request.query_params.get("area"):
            area = request.query_params["area"]
            queryset = queryset.filter(Q(areas__contains=area) | Q(area=area))
        return Response([habit_payload(habit) for habit in queryset])
    name = str(request.data.get("name", "")).strip()
    if not name:
        return Response({"name": ["Habit name is required."]}, status=status.HTTP_400_BAD_REQUEST)
        
    reminder_str = request.data.get("reminder_time")
    reminder_time = None
    if reminder_str:
        try:
            reminder_time = datetime.strptime(str(reminder_str), "%H:%M").time()
        except ValueError:
            pass

    areas = request.data.get("areas", [])
    if not areas:
        areas = [str(request.data.get("area", "Morning"))]

    habit = Habit.objects.create(
        owner=request.user,
        name=name,
        emoji=str(request.data.get("emoji", "🎯")),
        color=str(request.data.get("color", "#F59E0B")),
        area=areas[0] if areas else "Morning",
        areas=areas,
        goal_amount=float(request.data.get("goal_amount", 1.0)),
        goal_unit=str(request.data.get("goal_unit", "times")),
        frequency=str(request.data.get("frequency", "daily")),
        frequency_days=request.data.get("frequency_days", []),
        reminder_time=reminder_time,
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
        
    for field in ("name", "emoji", "color", "goal_unit", "frequency", "notes"):
        if field in request.data:
            setattr(habit, field, str(request.data[field]))
            
    if "areas" in request.data:
        habit.areas = request.data["areas"]
        if habit.areas:
            habit.area = habit.areas[0]
    elif "area" in request.data:
        habit.area = str(request.data["area"])
        habit.areas = [habit.area]
            
    if "goal_amount" in request.data:
        habit.goal_amount = float(request.data["goal_amount"])
    if "frequency_days" in request.data:
        habit.frequency_days = request.data["frequency_days"]
    if "is_archived" in request.data:
        habit.is_archived = bool(request.data["is_archived"])
    if "in_trash" in request.data:
        habit.in_trash = bool(request.data["in_trash"])
    if "reminder_time" in request.data:
        reminder_str = request.data["reminder_time"]
        if reminder_str:
            try:
                habit.reminder_time = datetime.strptime(str(reminder_str), "%H:%M").time()
            except ValueError:
                pass
        else:
            habit.reminder_time = None
            
    habit.save()
    return Response(habit_payload(habit))


@api_view(["POST"])
def habit_toggle(request, habit_id):
    try:
        habit = Habit.objects.get(id=habit_id, owner=request.user)
    except Habit.DoesNotExist:
        return Response({"detail": "Habit not found."}, status=status.HTTP_404_NOT_FOUND)
    
    date = current_date(request)
    
    if "amount" in request.data:
        amount = float(request.data["amount"])
        if amount <= 0:
            HabitCompletion.objects.filter(habit=habit, date=date).delete()
        else:
            completion, _ = HabitCompletion.objects.update_or_create(
                habit=habit, date=date, defaults={"completed_amount": amount}
            )
    else:
        completion, created = HabitCompletion.objects.get_or_create(habit=habit, date=date)
        if not created:
            completion.delete()
        else:
            # When toggling on, default to the full goal amount
            completion.completed_amount = habit.goal_amount
            completion.save()
            
    return Response(habit_payload(habit))


@api_view(["GET"])
def habit_heatmap(request):
    try:
        days = max(1, min(int(request.query_params.get("days", 35)), 365))
    except ValueError:
        days = 35
    end = timezone.localdate()
    start = end - timedelta(days=days - 1)
    habit_list = list(Habit.objects.filter(owner=request.user, in_trash=False))
    output = []
    for offset in range(days):
        date = start + timedelta(days=offset)
        done = sum(habit.completions.filter(date=date).exists() for habit in habit_list)
        output.append({"date": date.isoformat(), "done": done, "pct": done / len(habit_list) if habit_list else 0})
    return Response(output)


@api_view(["GET"])
@permission_classes([AllowAny])
def prayers(request):
    date = current_date(request)
    profile = profile_for(request.user) if request.user.is_authenticated else None
    prayer_list = get_prayer_times(profile, date)
    if request.user.is_authenticated:
        logs = {log.prayer_key: log for log in PrayerLog.objects.filter(user=request.user, date=date)}
        return Response([
            {**prayer, "fardDone": bool(logs.get(prayer["key"]) and logs[prayer["key"]].fard_done),
             "sunnahDone": logs.get(prayer["key"]).sunnah_done if logs.get(prayer["key"]) else 0}
            for prayer in prayer_list
        ])
    return Response([
        {**prayer, "fardDone": False, "sunnahDone": 0}
        for prayer in prayer_list
    ])


@api_view(["PATCH"])
def prayer_toggle(request, prayer_key):
    date = current_date(request)
    profile = profile_for(request.user)
    prayer_list = get_prayer_times(profile, date)
    valid_keys = {p["key"] for p in prayer_list}
    if prayer_key not in valid_keys:
        return Response({"detail": "Prayer not found."}, status=status.HTTP_404_NOT_FOUND)
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
            is_done = False
        else:
            is_done = True
        try:
            from faith.views import sync_adhkar_to_habit_util
            sync_adhkar_to_habit_util(request.user, kind, str(date))
        except Exception:
            pass
        return Response({"id": item_id, "type": kind, "done": is_done})
    done = set(AdhkarLog.objects.filter(user=request.user, date=date, kind=kind).values_list("item_id", flat=True))
    return Response([{**item, "done": item["id"] in done} for item in ADHKAR[kind]])


@api_view(["GET", "PATCH"])
@permission_classes([AllowAny])
def khatmah(request):
    if not request.user.is_authenticated:
        return Response({
            "current_page": 0,
            "currentPage": 0,
            "target_pages": 604,
            "targetPages": 604,
        })
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
    queryset = FocusSession.objects.filter(user=request.user, in_trash=False)
    return Response([session_payload(session) for session in queryset[:100]])


@api_view(["GET"])
def sessions_today(request):
    today = timezone.localdate()
    queryset = [
        session for session in FocusSession.objects.filter(user=request.user, in_trash=False)
        if timezone.localtime(session.completed_at).date() == today
    ]
    pomodoros = [session for session in queryset if session.mode == "pomodoro"]
    return Response({"count": len(pomodoros), "sessions": [session_payload(session) for session in queryset]})


@api_view(["GET"])
def sessions_weekly(request):
    today = timezone.localdate()
    monday = today - timedelta(days=today.weekday())
    sessions_by_day = {monday + timedelta(days=i): 0 for i in range(7)}
    for session in FocusSession.objects.filter(user=request.user, in_trash=False, mode="pomodoro"):
        day = timezone.localtime(session.completed_at).date()
        if day in sessions_by_day:
            sessions_by_day[day] += 1
    return Response([
        {"date": (monday + timedelta(days=i)).isoformat(), "count": sessions_by_day[monday + timedelta(days=i)]}
        for i in range(7)
    ])


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  CALENDAR
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import calendar as _calendar
from datetime import date as _date


# ── Payload helper ────────────────────────────────────────────
def event_payload(event, occurrence_date=None):
    """Serialize a CalendarEvent.  occurrence_date overrides start_date for
    virtual recurrence occurrences."""
    d = occurrence_date or event.start_date
    return {
        "id":           event.id,
        "title":        event.title,
        "description":  event.description,
        "location":     event.location,
        "allDay":       event.all_day,
        "all_day":      event.all_day,
        "startDate":    d.isoformat(),
        "start_date":   d.isoformat(),
        "endDate":      event.end_date.isoformat() if event.end_date else None,
        "end_date":     event.end_date.isoformat() if event.end_date else None,
        "startTime":    event.start_time.strftime("%H:%M") if event.start_time else None,
        "start_time":   event.start_time.strftime("%H:%M") if event.start_time else None,
        "endTime":      event.end_time.strftime("%H:%M") if event.end_time else None,
        "end_time":     event.end_time.strftime("%H:%M") if event.end_time else None,
        "color":        event.color,
        "category":     event.category,
        "isRecurring":  event.is_recurring,
        "is_recurring": event.is_recurring,
        "recurrence":   event.recurrence,
        "createdAt":    event.created_at.isoformat(),
        "updatedAt":    event.updated_at.isoformat(),
    }


# ── Recurrence expansion ──────────────────────────────────────
def expand_recurring(event, range_start, range_end):
    """Yield virtual occurrence dates for a recurring event within [range_start, range_end]."""
    rule = event.recurrence or {}
    freq = rule.get("freq", "daily")
    interval = max(1, int(rule.get("interval", 1)))
    ends = rule.get("ends", "never")
    end_date_str = rule.get("end_date")
    count_limit = int(rule.get("count", 365))

    rule_end = range_end
    if ends == "on_date" and end_date_str:
        try:
            rule_end = min(rule_end, datetime.strptime(end_date_str, "%Y-%m-%d").date())
        except ValueError:
            pass
    elif ends == "after_n":
        pass  # handled by count_limit below

    cursor = event.start_date
    occurrences_seen = 0

    # weekly: optional days-of-week filter (0=Mon … 6=Sun)
    days_of_week = set(rule.get("days_of_week", []))

    while cursor <= rule_end:
        if cursor > range_end:
            break
        if ends == "after_n" and occurrences_seen >= count_limit:
            break

        in_range = cursor >= range_start

        # For weekly recurrences with day-of-week filter:
        if freq == "weekly" and days_of_week:
            week_start = cursor
            for offset in range(7):
                day = week_start + timedelta(days=offset)
                if day.weekday() in days_of_week and range_start <= day <= range_end:
                    yield day
                    occurrences_seen += 1
                    if ends == "after_n" and occurrences_seen >= count_limit:
                        break
        elif in_range:
            yield cursor
            occurrences_seen += 1

        # Advance cursor
        if freq == "daily":
            cursor += timedelta(days=interval)
        elif freq == "weekly":
            cursor += timedelta(weeks=interval)
        elif freq == "monthly":
            month = cursor.month + interval
            year = cursor.year + (month - 1) // 12
            month = (month - 1) % 12 + 1
            day = min(cursor.day, _calendar.monthrange(year, month)[1])
            cursor = _date(year, month, day)
        elif freq == "yearly":
            try:
                cursor = _date(cursor.year + interval, cursor.month, cursor.day)
            except ValueError:
                cursor = _date(cursor.year + interval, cursor.month, 28)
        else:
            break  # unknown freq


# ── Helpers: parse incoming event data ───────────────────────
def parse_event_data(data, existing=None):
    existing = existing or {}
    val = lambda k, fb=None: data.get(k, existing.get(k, fb))

    # Prefer camelCase, fall back to snake_case
    all_day = val("allDay", val("all_day", False))
    start_date_raw = val("startDate", val("start_date"))
    end_date_raw   = val("endDate",   val("end_date"))
    start_time_raw = val("startTime", val("start_time"))
    end_time_raw   = val("endTime",   val("end_time"))
    recurrence     = val("recurrence")
    is_recurring   = bool(val("isRecurring", val("is_recurring", False)))

    def parse_date(s):
        if not s:
            return None
        try:
            return datetime.strptime(str(s)[:10], "%Y-%m-%d").date()
        except ValueError:
            return None

    def parse_time(s):
        if not s:
            return None
        for fmt in ("%H:%M:%S", "%H:%M"):
            try:
                return datetime.strptime(str(s), fmt).time()
            except ValueError:
                continue
        return None

    start_date = parse_date(start_date_raw)
    if not start_date:
        start_date = timezone.localdate()

    return {
        "title":       str(val("title", "Untitled")).strip() or "Untitled",
        "description": str(val("description", "")),
        "location":    str(val("location", "")),
        "all_day":     bool(all_day),
        "start_date":  start_date,
        "end_date":    parse_date(end_date_raw),
        "start_time":  None if all_day else parse_time(start_time_raw),
        "end_time":    None if all_day else parse_time(end_time_raw),
        "color":       str(val("color", "#6366F1")),
        "category":    str(val("category", "personal")),
        "is_recurring": is_recurring,
        "recurrence":  recurrence if is_recurring else None,
    }


# ── Views ─────────────────────────────────────────────────────

@api_view(["GET", "POST"])
def calendar_events(request):
    """
    GET  /api/calendar/events/           → list all events for the user
                                            (optional: ?start=YYYY-MM-DD&end=YYYY-MM-DD
                                             to filter to a date range and expand recurrences)
    POST /api/calendar/events/           → create a new event
    """
    if request.method == "GET":
        qs = CalendarEvent.objects.filter(owner=request.user, in_trash=False)

        start_raw = request.query_params.get("start")
        end_raw   = request.query_params.get("end")

        if start_raw and end_raw:
            try:
                range_start = datetime.strptime(start_raw, "%Y-%m-%d").date()
                range_end   = datetime.strptime(end_raw,   "%Y-%m-%d").date()
            except ValueError:
                return Response({"detail": "Invalid date format. Use YYYY-MM-DD."}, status=400)

            # Include events whose start_date falls within range,
            # OR whose recurrence might produce occurrences within range.
            qs = qs.filter(
                models.Q(start_date__lte=range_end) &
                (
                    models.Q(end_date__gte=range_start) |
                    models.Q(end_date__isnull=True, start_date__gte=range_start) |
                    models.Q(is_recurring=True)
                )
            )

            results = []
            for event in qs:
                if event.is_recurring:
                    for occ in expand_recurring(event, range_start, range_end):
                        results.append(event_payload(event, occ))
                elif range_start <= event.start_date <= range_end:
                    results.append(event_payload(event))
            # Sort by date
            results.sort(key=lambda e: (e["startDate"], e["startTime"] or ""))
            return Response(results)

        # No range filter — return all events (non-expanded)
        return Response([event_payload(e) for e in qs])

    # POST: create
    parsed = parse_event_data(request.data)
    if not parsed["title"]:
        return Response({"title": ["Title is required."]}, status=status.HTTP_400_BAD_REQUEST)

    event = CalendarEvent.objects.create(owner=request.user, **parsed)
    return Response(event_payload(event), status=status.HTTP_201_CREATED)


@api_view(["GET", "PATCH", "DELETE"])
def calendar_event_detail(request, event_id):
    """
    GET    /api/calendar/events/:id/  → retrieve single event
    PATCH  /api/calendar/events/:id/  → partial update
    DELETE /api/calendar/events/:id/  → delete
    """
    try:
        event = CalendarEvent.objects.get(pk=event_id, owner=request.user)
    except CalendarEvent.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(event_payload(event))

    if request.method == "PATCH":
        parsed = parse_event_data(
            request.data,
            existing={
                "title": event.title, "description": event.description,
                "location": event.location, "all_day": event.all_day,
                "start_date": event.start_date.isoformat(),
                "end_date":   event.end_date.isoformat() if event.end_date else None,
                "start_time": event.start_time.strftime("%H:%M") if event.start_time else None,
                "end_time":   event.end_time.strftime("%H:%M") if event.end_time else None,
                "color": event.color, "category": event.category,
                "is_recurring": event.is_recurring, "recurrence": event.recurrence,
            },
        )
        for field, value in parsed.items():
            setattr(event, field, value)
        event.save()
        return Response(event_payload(event))

    # DELETE
    if request.query_params.get("permanent") == "true" or event.in_trash:
        event.delete()
    else:
        event.in_trash = True
        event.save()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
def calendar_month(request):
    """
    GET /api/calendar/events/month/?year=YYYY&month=M
    Returns all events (with recurrence expanded) for the given calendar month.
    """
    try:
        year  = int(request.query_params.get("year",  timezone.localdate().year))
        month = int(request.query_params.get("month", timezone.localdate().month))
        assert 1 <= month <= 12
    except (ValueError, AssertionError):
        return Response({"detail": "Invalid year/month."}, status=400)

    first_day = _date(year, month, 1)
    last_day  = _date(year, month, _calendar.monthrange(year, month)[1])

    qs = CalendarEvent.objects.filter(owner=request.user, in_trash=False,
        start_date__lte=last_day,
    ).filter(
        models.Q(end_date__gte=first_day) |
        models.Q(end_date__isnull=True, start_date__gte=first_day) |
        models.Q(is_recurring=True)
    )

    results = []
    for event in qs:
        if event.is_recurring:
            for occ in expand_recurring(event, first_day, last_day):
                results.append(event_payload(event, occ))
        elif first_day <= event.start_date <= last_day:
            results.append(event_payload(event))

    results.sort(key=lambda e: (e["startDate"], e["startTime"] or ""))
    return Response(results)


@api_view(["GET"])
def calendar_agenda(request):
    """
    GET /api/calendar/events/agenda/?start=YYYY-MM-DD&days=N  (default 14 days)
    Returns events in chronological order starting from `start`, useful for agenda view.
    """
    start_raw = request.query_params.get("start")
    try:
        range_start = datetime.strptime(start_raw, "%Y-%m-%d").date() if start_raw else timezone.localdate()
    except ValueError:
        range_start = timezone.localdate()

    days = max(1, min(int(request.query_params.get("days", 14)), 365))
    range_end = range_start + timedelta(days=days - 1)

    qs = CalendarEvent.objects.filter(owner=request.user, in_trash=False,
        start_date__lte=range_end,
    ).filter(
        models.Q(end_date__gte=range_start) |
        models.Q(end_date__isnull=True, start_date__gte=range_start) |
        models.Q(is_recurring=True)
    )

    results = []
    for event in qs:
        if event.is_recurring:
            for occ in expand_recurring(event, range_start, range_end):
                results.append(event_payload(event, occ))
        elif range_start <= event.start_date <= range_end:
            results.append(event_payload(event))

    results.sort(key=lambda e: (e["startDate"], e["startTime"] or ""))
    return Response(results)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  TODAY DASHBOARD
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@api_view(["GET"])
def today_dashboard(request):
    """
    GET /api/today/
    Returns a normalized daily dashboard response aggregating tasks, habits, faith, focus, and calendar events.
    """
    date_str = request.query_params.get("date")
    if date_str:
        try:
            date_val = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            date_val = timezone.localdate()
    else:
        date_val = timezone.localdate()

    # 1. Tasks — include tasks scheduled for today (exclude trashed)
    tasks = Task.objects.filter(owner=request.user, in_trash=False, due_date=date_val)
    tasks_data = [task_payload(t) for t in tasks]
    tasks_done = sum(1 for t in tasks if t.done)

    # 2. Habits — exclude archived and trashed habits from Today dashboard
    all_habits = Habit.objects.filter(owner=request.user, in_trash=False, is_archived=False)
    habits_data = [habit_payload(h) for h in all_habits]
    habits_done = 0
    date_str = date_val.isoformat()
    for h in habits_data:
        if date_str in h["completedDates"]:
            habits_done += 1

    # 3. Faith (Prayers & Deeds)
    profile = profile_for(request.user)
    prayer_times = get_prayer_times(profile, date_val)
    prayers = []
    prayer_logs = {log.prayer_key: log for log in PrayerLog.objects.filter(user=request.user, date=date_val)}
    for p in prayer_times:
        log = prayer_logs.get(p["key"])
        prayers.append({
            "key": p["key"],
            "ar": p["ar"],
            "en": p["en"],
            "time": p["time"],
            "fardDone": log.fard_done if log else False,
            "sunnahDone": log.sunnah_done if log else 0,
            "fardTotal": p["fard"],
            "sunnahTotal": p["sunnah"],
        })
    prayers_done = sum(1 for p in prayers if p["fardDone"])
    good_deeds_done = list(GoodDeedLog.objects.filter(user=request.user, date=date_val).values_list("deed_id", flat=True))

    # 4. Focus Sessions
    focus_sessions = FocusSession.objects.filter(user=request.user, in_trash=False, 
        completed_at__date=date_val
    )
    focus_data = [{
        "id": s.id,
        "label": s.label,
        "duration": s.duration_minutes,
        "mode": s.mode,
        "completedAt": s.completed_at.isoformat()
    } for s in focus_sessions]

    # 5. Calendar Events
    qs = CalendarEvent.objects.filter(owner=request.user, in_trash=False,
        start_date__lte=date_val,
    ).filter(
        models.Q(end_date__gte=date_val) |
        models.Q(end_date__isnull=True, start_date__gte=date_val) |
        models.Q(is_recurring=True)
    )

    calendar_data = []
    for event in qs:
        if event.is_recurring:
            for occ in expand_recurring(event, date_val, date_val):
                calendar_data.append(event_payload(event, occ))
        else:
            calendar_data.append(event_payload(event))
    
    calendar_data.sort(key=lambda e: (e["startDate"], e["startTime"] or ""))

    return Response({
        "date": date_str,
        "tasks": {
            "items": tasks_data,
            "done": tasks_done,
            "total": len(tasks_data)
        },
        "habits": {
            "items": habits_data,
            "done": habits_done,
            "total": len(habits_data)
        },
        "faith": {
            "prayers": prayers,
            "prayersDone": prayers_done,
            "prayersTotal": len(prayer_times),
            "goodDeeds": good_deeds_done
        },
        "focus": {
            "sessions": focus_data,
            "totalMinutes": sum(s.duration_minutes for s in focus_sessions)
        },
        "calendar": {
            "events": calendar_data
        }
    })


@api_view(["GET", "DELETE"])
def trash_list(request):
    if request.method == "DELETE":
        Task.objects.filter(owner=request.user, in_trash=True).delete()
        TaskList.objects.filter(owner=request.user, in_trash=True).delete()
        TaskTag.objects.filter(owner=request.user, in_trash=True).delete()
        Habit.objects.filter(owner=request.user, in_trash=True).delete()
        FocusSession.objects.filter(user=request.user, in_trash=True).delete()
        CalendarEvent.objects.filter(owner=request.user, in_trash=True).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    results = []
    
    for task in Task.objects.filter(owner=request.user, in_trash=True):
        results.append({ "id": task.id, "type": "task", "name": task.text, "data": task_payload(task) })
        
    for list_item in TaskList.objects.filter(owner=request.user, in_trash=True):
        results.append({ "id": list_item.id, "type": "task_list", "name": list_item.name })
        
    for tag in TaskTag.objects.filter(owner=request.user, in_trash=True):
        results.append({ "id": tag.id, "type": "task_tag", "name": tag.name })
        
    for habit in Habit.objects.filter(owner=request.user, in_trash=True):
        results.append({ "id": habit.id, "type": "habit", "name": habit.name, "data": habit_payload(habit) })
        
    for event in CalendarEvent.objects.filter(owner=request.user, in_trash=True):
        results.append({ "id": event.id, "type": "event", "name": event.title, "data": event_payload(event) })
        
    for session in FocusSession.objects.filter(user=request.user, in_trash=True):
        results.append({ "id": session.id, "type": "session", "name": session.label or "Focus Session" })
        
    return Response(results)

@api_view(["PATCH", "DELETE"])
def trash_detail(request, item_type, item_id):
    model_map = {
        "task": (Task, "owner"),
        "task_list": (TaskList, "owner"),
        "task_tag": (TaskTag, "owner"),
        "habit": (Habit, "owner"),
        "event": (CalendarEvent, "owner"),
        "session": (FocusSession, "user")
    }
    
    if item_type not in model_map:
        return Response(status=status.HTTP_400_BAD_REQUEST)
        
    Model, user_field = model_map[item_type]
    kwargs = { "id": item_id, user_field: request.user }
    
    try:
        item = Model.objects.get(**kwargs)
    except Model.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
        
    if request.method == "DELETE":
        item.delete()
        if item_type == "task_list":
            Task.objects.filter(owner=request.user, list_name=item.name).update(list_name="")
        elif item_type == "task_tag":
            Task.objects.filter(owner=request.user, tag=item.name).update(tag="")
        return Response(status=status.HTTP_204_NO_CONTENT)
        
    if request.method == "PATCH":
        item.in_trash = False
        item.save()
        return Response(status=status.HTTP_200_OK)


# ═════════════════════════════════════════════════════════════════════════════
# User Profile & Settings ViewSet
# ═════════════════════════════════════════════════════════════════════════════
class UserProfileViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_object(self):
        profile, _ = Profile.objects.get_or_create(user=self.request.user)
        return profile

    @action(detail=False, methods=["get", "patch"], url_path="me")
    def me(self, request):
        profile = self.get_object()
        if request.method == "PATCH":
            serializer = self.get_serializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        serializer = self.get_serializer(profile)
        return Response(serializer.data)


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def user_profile_me(request):
    profile, _ = Profile.objects.get_or_create(user=request.user)
    if request.method == "PATCH":
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    serializer = UserProfileSerializer(profile)
    return Response(serializer.data)