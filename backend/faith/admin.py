"""
Django Admin configuration for the Faith module.
Provides secure CMS capabilities for managing Adhkar, Hadiths, Good Deeds,
and reviewing user spiritual logs (Prayer Logs, Khatmah progress).
"""
from django.contrib import admin
from .models import Adhkar, Hadith, GoodDeed, PrayerLog, KhatmahLog


@admin.register(Adhkar)
class AdhkarAdmin(admin.ModelAdmin):
    list_display = ("category", "category_en", "arabic_snippet", "target_count", "source", "order", "updated_at")
    list_filter = ("category",)
    search_fields = ("arabic_text", "translation", "transliteration", "source", "category_en")
    ordering = ("category", "order", "id")
    list_editable = ("category_en", "target_count", "order")

    @admin.display(description="Arabic Text")
    def arabic_snippet(self, obj):
        if not obj.arabic_text:
            return ""
        return obj.arabic_text[:60] + "…" if len(obj.arabic_text) > 60 else obj.arabic_text


@admin.register(Hadith)
class HadithAdmin(admin.ModelAdmin):
    list_display = ("category", "source", "narrator", "grade", "arabic_snippet", "order", "updated_at")
    list_filter = ("category", "grade")
    search_fields = ("text", "translation", "narrator", "source", "category")
    ordering = ("category", "order", "id")
    list_editable = ("order",)

    @admin.display(description="Hadith Text")
    def arabic_snippet(self, obj):
        if not obj.text:
            return ""
        return obj.text[:60] + "…" if len(obj.text) > 60 else obj.text


@admin.register(GoodDeed)
class GoodDeedAdmin(admin.ModelAdmin):
    list_display = ("emoji", "title_en", "title", "is_recommended_excuse", "order", "created_at")
    list_filter = ("is_recommended_excuse",)
    search_fields = ("title", "title_en", "description")
    ordering = ("order", "id")
    list_editable = ("is_recommended_excuse", "order")


@admin.register(PrayerLog)
class PrayerLogAdmin(admin.ModelAdmin):
    list_display = ("user", "date", "prayer_key", "fard_done", "sunnah_done")
    list_filter = ("prayer_key", "fard_done", "date")
    search_fields = ("user__username", "prayer_key")
    ordering = ("-date", "user")


@admin.register(KhatmahLog)
class KhatmahLogAdmin(admin.ModelAdmin):
    list_display = ("user", "current_page", "target_pages", "progress_percentage", "updated_at")
    search_fields = ("user__username",)
    ordering = ("-updated_at",)

    @admin.display(description="Progress")
    def progress_percentage(self, obj):
        target = max(1, obj.target_pages)
        pct = round((obj.current_page / target) * 100, 1)
        return f"{pct}% ({obj.current_page}/{target})"
