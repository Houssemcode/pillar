"""
Models for the Faith module.

Provides catalog entities for Islamic spiritual practices:
- Adhkar & Supplications (Morning, Evening, Du'as)
- Prophetic Hadiths Library
- Daily Good Deeds Checklist
"""
from django.db import models


class AdhkarCategory(models.TextChoices):
    MORNING = "morning", "Morning (أذكار الصباح)"
    EVENING = "evening", "Evening (أذكار المساء)"
    SLEEP = "sleep", "Sleep & Waking (النوم والاستيقاظ)"
    FOOD = "food", "Food & Drink (الطعام والشراب)"
    TRAVEL = "travel", "Travel (السفر)"
    DISTRESS = "distress", "Distress & Relief (الكرب والهم)"
    MOSQUE = "mosque", "Mosque (المسجد)"
    PARENTS = "parents", "Parents & Family (الوالدين)"
    FORGIVENESS = "forgiveness", "Forgiveness & Repentance (الاستغفار)"
    GENERAL = "general", "General Du'a (أدعية عامة)"


class HadithGrade(models.TextChoices):
    SAHIH = "sahih", "Sahih (صحيح)"
    HASAN = "hasan", "Hasan (حسن)"
    HASAN_SAHIH = "hasan_sahih", "Hasan Sahih (حسن صحيح)"
    MUTTAFAQUN_ALAYH = "muttafaqun_alayh", "Muttafaqun 'Alayh (متفق عليه)"


class Adhkar(models.Model):
    """
    Adhkar and Du'a catalog items.
    Represents standardized invocations, morning/evening remembrances,
    and situational supplications with translations, transliterations,
    and target repetition counts.
    """
    category = models.CharField(
        max_length=32,
        choices=AdhkarCategory.choices,
        default=AdhkarCategory.MORNING,
        db_index=True,
        help_text="Category of Dhikr or Du'a",
    )
    category_en = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="English name of the category",
    )
    arabic_text = models.TextField(
        help_text="Arabic text of the Dhikr with diacritics / tashkeel"
    )
    translation = models.TextField(
        blank=True,
        default="",
        help_text="English meaning and translation",
    )
    transliteration = models.TextField(
        blank=True,
        default="",
        help_text="Phonetic transliteration in Latin script",
    )
    target_count = models.PositiveIntegerField(
        default=1,
        help_text="Recommended repetition count (e.g. 1, 3, 33, 100)",
    )
    source = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="Hadith or Quran reference (e.g. Sahih al-Bukhari, Abu Dawood)",
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text="Ascending display order within the category",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Adhkar"
        verbose_name_plural = "Adhkar"
        ordering = ["category", "order", "id"]

    def __str__(self):
        snippet = (
            self.arabic_text[:35] + "..."
            if len(self.arabic_text) > 35
            else self.arabic_text
        )
        return f"[{self.get_category_display()}] ×{self.target_count} - {snippet}"


class Hadith(models.Model):
    """
    Prophetic narrations (Hadith) library.
    Stores verified sayings and actions of Prophet Muhammad (ﷺ)
    categorized by topic with authenticity grading and companion narrators.
    """
    text = models.TextField(
        help_text="Arabic text of the Hadith"
    )
    translation = models.TextField(
        blank=True,
        default="",
        help_text="English translation of the narration",
    )
    narrator = models.CharField(
        max_length=150,
        blank=True,
        default="",
        help_text="Companion narrator (e.g. Umar ibn al-Khattab, Abu Hurairah)",
    )
    source = models.CharField(
        max_length=255,
        help_text="Source compilation (e.g. Sahih al-Bukhari, Sahih Muslim, Al-Tirmidhi)",
    )
    category = models.CharField(
        max_length=64,
        db_index=True,
        help_text="Thematic topic (e.g. Iman, Akhlaq, Ilm, Ibadah, Sadaqah, Rahmah)",
    )
    grade = models.CharField(
        max_length=32,
        choices=HadithGrade.choices,
        default=HadithGrade.SAHIH,
        help_text="Authenticity classification",
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text="Display priority / ordering index",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Hadith"
        verbose_name_plural = "Hadiths"
        ordering = ["category", "order", "id"]

    def __str__(self):
        narrator_str = f" ({self.narrator})" if self.narrator else ""
        snippet = self.text[:40] + "..." if len(self.text) > 40 else self.text
        return f"[{self.category}] {self.source}{narrator_str}: {snippet}"


class GoodDeed(models.Model):
    """
    Catalog of daily good deeds and charitable actions.
    Provides structured virtues for daily habit tracking in the Faith module
    (e.g., Fasting, Sadaqah, Quran recitation, visiting the sick).
    """
    title = models.CharField(
        max_length=100,
        help_text="Arabic title of the good deed (e.g. صيام, صدقة, قراءة القرآن)",
    )
    title_en = models.CharField(
        max_length=100,
        help_text="English title of the good deed (e.g. Fasting, Sadaqah, Read Quran)",
    )
    description = models.TextField(
        blank=True,
        default="",
        help_text="Virtue, Hadith reference, or practical guideline for this deed",
    )
    emoji = models.CharField(
        max_length=16,
        blank=True,
        default="🤲",
        help_text="Emoji icon representing the deed",
    )
    is_recommended_excuse = models.BooleanField(
        default=False,
        help_text="Recommended alternative deed during excuse / menstruation mode",
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text="Sort order on the daily checklist",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Good Deed"
        verbose_name_plural = "Good Deeds"
        ordering = ["order", "id"]

    def __str__(self):
        return f"{self.emoji} {self.title_en} ({self.title})"


from api.models import PrayerLog as ApiPrayerLog, Khatmah as ApiKhatmah


class PrayerLog(ApiPrayerLog):
    class Meta:
        proxy = True
        verbose_name = "Prayer Log"
        verbose_name_plural = "Prayer Logs"


class KhatmahLog(ApiKhatmah):
    class Meta:
        proxy = True
        verbose_name = "Khatmah Log"
        verbose_name_plural = "Khatmah Logs"

