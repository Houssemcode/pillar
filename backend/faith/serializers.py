"""
Serializers for the Faith module API.

Provides DRF ModelSerializers for:
- Adhkar & Du'as
- Prophetic Hadiths
- Good Deeds catalog
"""
from rest_framework import serializers
from .models import Adhkar, Hadith, GoodDeed


class AdhkarSerializer(serializers.ModelSerializer):
    """
    Serializer for Adhkar and Du'a catalog items.
    Exposes Arabic text, translations, transliterations, and repetition counts.
    """
    category_display = serializers.CharField(
        source="get_category_display",
        read_only=True,
    )

    class Meta:
        model = Adhkar
        fields = [
            "id",
            "category",
            "category_en",
            "category_display",
            "arabic_text",
            "translation",
            "transliteration",
            "target_count",
            "source",
            "order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class HadithSerializer(serializers.ModelSerializer):
    """
    Serializer for prophetic Hadith library items.
    Exposes narration text, English translation, narrator, source compilation,
    category, and authenticity grade.
    """
    grade_display = serializers.CharField(
        source="get_grade_display",
        read_only=True,
    )

    class Meta:
        model = Hadith
        fields = [
            "id",
            "text",
            "translation",
            "narrator",
            "source",
            "category",
            "grade",
            "grade_display",
            "order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class GoodDeedSerializer(serializers.ModelSerializer):
    """
    Serializer for the daily Good Deeds checklist catalog.
    Exposes Arabic & English titles, emoji icons, descriptions, and excuse-mode hints.
    """
    class Meta:
        model = GoodDeed
        fields = [
            "id",
            "title",
            "title_en",
            "description",
            "emoji",
            "is_recommended_excuse",
            "order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
