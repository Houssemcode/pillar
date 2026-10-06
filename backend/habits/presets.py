"""
Habit Presets and Core Faith Defaults.

Defines standardized habit templates and onboarding defaults:
- Core Faith Habits (Quran, Morning Adhkar, Evening Adhkar)
- Beneficial Productivity & Health Presets (Hydration, Movement, Planning, Deep Work)
"""
from typing import List, Dict, Any

HABIT_PRESETS: List[Dict[str, Any]] = [
    {
        "key": "quran",
        "system_code": "quran",
        "title": "Quran Reading (Khatmah)",
        "title_ar": "قراءة القرآن (الختمة)",
        "emoji": "📖",
        "color": "#10B981",
        "area": "Faith",
        "area_ar": "الإيمان",
        "target_count": 2,
        "target_unit": "pages",
        "frequency": "daily",
        "description": "Daily Quran reading towards completing a Khatmah.",
        "description_ar": "قراءة يومية من المصحف الشريف للختمة.",
        "is_core": True,
    },
    {
        "key": "morning_adhkar",
        "system_code": "morning_adhkar",
        "title": "Morning Adhkar",
        "title_ar": "أذكار الصباح",
        "emoji": "🌅",
        "color": "#F59E0B",
        "area": "Faith",
        "area_ar": "الإيمان",
        "target_count": 1,
        "target_unit": "times",
        "frequency": "daily",
        "description": "Recited after Fajr prayer until sunrise.",
        "description_ar": "تُقال بعد صلاة الفجر حتى شروق الشمس.",
        "is_core": True,
    },
    {
        "key": "evening_adhkar",
        "system_code": "evening_adhkar",
        "title": "Evening Adhkar",
        "title_ar": "أذكار المساء",
        "emoji": "🌆",
        "color": "#6366F1",
        "area": "Faith",
        "area_ar": "الإيمان",
        "target_count": 1,
        "target_unit": "times",
        "frequency": "daily",
        "description": "Recited after Asr prayer until Maghrib.",
        "description_ar": "تُقال بعد صلاة العصر حتى المغرب.",
        "is_core": True,
    },
    {
        "key": "hydration",
        "system_code": None,
        "title": "Hydration",
        "title_ar": "شرب الماء",
        "emoji": "💧",
        "color": "#0EA5E9",
        "area": "Health & Fitness",
        "area_ar": "الصحة واللياقة",
        "target_count": 8,
        "target_unit": "glasses",
        "frequency": "daily",
        "description": "Drink at least 2 liters of water daily.",
        "description_ar": "شرب ما لا يقل عن 2 لتر من الماء يومياً.",
        "is_core": False,
    },
    {
        "key": "movement",
        "system_code": None,
        "title": "Daily Movement",
        "title_ar": "النشاط البدني اليومي",
        "emoji": "🏃",
        "color": "#10B981",
        "area": "Health & Fitness",
        "area_ar": "الصحة واللياقة",
        "target_count": 30,
        "target_unit": "mins",
        "frequency": "daily",
        "description": "Walking, jogging, or light exercise.",
        "description_ar": "المشي أو الجري أو تمارين خفيفة.",
        "is_core": False,
    },
    {
        "key": "planning",
        "system_code": None,
        "title": "Plan the Day",
        "title_ar": "تخطيط اليوم",
        "emoji": "📝",
        "color": "#F97316",
        "area": "Productivity",
        "area_ar": "الإنتاجية",
        "target_count": 1,
        "target_unit": "times",
        "frequency": "daily",
        "description": "Review priorities and outline your daily schedule.",
        "description_ar": "مراجعة الأولويات وتحديد جدول أعمال اليوم.",
        "is_core": False,
    },
    {
        "key": "deep_work",
        "system_code": None,
        "title": "Deep Work Session",
        "title_ar": "جلسة تركيز عميق",
        "emoji": "🎯",
        "color": "#3B82F6",
        "area": "Productivity",
        "area_ar": "الإنتاجية",
        "target_count": 90,
        "target_unit": "mins",
        "frequency": "daily",
        "description": "Uninterrupted focus session on your highest priority task.",
        "description_ar": "جلسة تركيز بدون مقاطعة على أهم مهام اليوم.",
        "is_core": False,
    },
]


def initialize_core_habits_for_user(user=None):
    """
    Creates the 3 core default faith habits ('quran', 'morning_adhkar', 'evening_adhkar')
    for a user if they do not already exist, and ensures system_code is attached.
    """
    from .models import Habit, HabitArea
    from django.db.models import Q

    # Get or create Faith area
    if user and user.is_authenticated:
        faith_area = HabitArea.objects.filter(owner=user, name__iexact="Faith").first()
        if not faith_area:
            faith_area = HabitArea.objects.filter(owner__isnull=True, name__iexact="Faith").first()
        if not faith_area:
            faith_area = HabitArea.objects.create(owner=user, name="Faith", color="#10B981", order=0)
    else:
        faith_area = HabitArea.objects.filter(name__iexact="Faith").first()
        if not faith_area:
            faith_area = HabitArea.objects.create(name="Faith", color="#10B981", order=0)

    core_presets = [p for p in HABIT_PRESETS if p.get("is_core")]
    created_habits = []

    for preset in core_presets:
        query = Habit.objects.filter(in_trash=False)
        if user and user.is_authenticated:
            query = query.filter(owner=user)
        else:
            query = query.filter(owner__isnull=True)

        # Check existing by system_code or title variants
        existing_habit = query.filter(
            Q(system_code=preset["system_code"]) |
            Q(title__in=[preset["title"], preset["title_ar"]])
        ).first()

        if existing_habit:
            # Ensure system_code is populated
            if not existing_habit.system_code:
                existing_habit.system_code = preset["system_code"]
                existing_habit.save(update_fields=["system_code"])
        else:
            habit = Habit.objects.create(
                owner=user if (user and user.is_authenticated) else None,
                system_code=preset["system_code"],
                title=preset["title"],
                description=preset["description"],
                emoji=preset["emoji"],
                color=preset["color"],
                area=faith_area,
                target_count=preset["target_count"],
                target_unit=preset["target_unit"],
                frequency=preset["frequency"],
            )
            created_habits.append(habit)

    return created_habits
