"""
Django management command to seed Hadith data from the fawazahmed0/hadith-api.

Fetches real prophetic narrations (Arabic + English) from multiple collections
via the jsDelivr CDN GitHub mirror (no authentication required) and saves them
into the local `Hadith` model, avoiding duplicates with update_or_create.

API Base: https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/
Edition naming convention: {lang}-{collection}.json
  e.g.  ara-nawawi.json  (Arabic Nawawi 40)
        eng-nawawi.json  (English Nawawi 40)
        ara-bukhari.json (Arabic Bukhari)
        eng-bukhari.json (English Bukhari)

JSON structure returned by each edition file:
  {
    "metadata": { ... },
    "hadiths": [
      {
        "hadithnumber": 1,
        "arabicnumber": 1,
        "text": "...",       <-- the hadith text in that language
        "grades": [{"name": "Al-Albani", "grade": "Sahih"}, ...],
        "reference": { "book": N, "hadith": N }
      },
      ...
    ]
  }

Usage:
    python manage.py seed_hadiths
    python manage.py seed_hadiths --collection nawawi
    python manage.py seed_hadiths --collection bukhari --max-hadiths 200
    python manage.py seed_hadiths --dry-run
"""
import time
from typing import Optional, List
import requests
from django.core.management.base import BaseCommand, CommandError
from faith.models import Hadith

# ─────────────────────────────────────────────────────────────────────────────
# API CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────

CDN_BASE = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions"

# Supported collections and their model-level metadata
# Format: slug -> { ar_edition, en_edition, category, source_label, grade }
COLLECTIONS = {
    "nawawi": {
        "ar_edition": "ara-nawawi",
        "en_edition": "eng-nawawi",
        "category": "تقوى",
        "source_label": "الأربعون النووية",
        "grade": "sahih",
        "max_default": None,  # small collection, fetch all
    },
    "bukhari": {
        "ar_edition": "ara-bukhari",
        "en_edition": "eng-bukhari",
        "category": "إيمان",
        "source_label": "صحيح البخاري",
        "grade": "sahih",
        "max_default": 200,   # huge collection, default to first 200
    },
    "muslim": {
        "ar_edition": "ara-muslim",
        "en_edition": "eng-muslim",
        "category": "إيمان",
        "source_label": "صحيح مسلم",
        "grade": "sahih",
        "max_default": 200,
    },
    "abudawud": {
        "ar_edition": "ara-abudawud",
        "en_edition": "eng-abudawud",
        "category": "عبادة",
        "source_label": "سنن أبي داود",
        "grade": "hasan",
        "max_default": 150,
    },
    "tirmidhi": {
        "ar_edition": "ara-tirmidhi",
        "en_edition": "eng-tirmidhi",
        "category": "أخلاق",
        "source_label": "جامع الترمذي",
        "grade": "hasan_sahih",
        "max_default": 150,
    },
    "ibnmajah": {
        "ar_edition": "ara-ibnmajah",
        "en_edition": "eng-ibnmajah",
        "category": "عبادة",
        "source_label": "سنن ابن ماجة",
        "grade": "hasan",
        "max_default": 100,
    },
}

# Map English chapter keywords to Arabic thematic categories
CHAPTER_CATEGORY_MAP = {
    "intention": "إيمان",
    "faith": "إيمان",
    "belief": "إيمان",
    "iman": "إيمان",
    "prayer": "عبادة",
    "salah": "عبادة",
    "fasting": "عبادة",
    "sawm": "عبادة",
    "zakat": "عبادة",
    "hajj": "عبادة",
    "pilgrimage": "عبادة",
    "purification": "عبادة",
    "ablution": "عبادة",
    "knowledge": "علم",
    "ilm": "علم",
    "charity": "صدقة",
    "sadaqah": "صدقة",
    "spending": "صدقة",
    "kindness": "أخلاق",
    "manners": "أخلاق",
    "character": "أخلاق",
    "etiquette": "أخلاق",
    "mercy": "رحمة",
    "compassion": "رحمة",
    "piety": "تقوى",
    "taqwa": "تقوى",
    "patience": "صبر",
    "gratitude": "شكر",
    "family": "أسرة",
    "marriage": "أسرة",
    "trade": "معاملات",
    "business": "معاملات",
    "quran": "قرآن",
    "recitation": "قرآن",
    "remembrance": "ذكر",
    "dhikr": "ذكر",
}


def _infer_category(chapter_title: str, default: str) -> str:
    """Infer Arabic category from English chapter title keywords."""
    if not chapter_title:
        return default
    lower = chapter_title.lower()
    for keyword, cat in CHAPTER_CATEGORY_MAP.items():
        if keyword in lower:
            return cat
    return default


def _infer_grade(grades_list: list, default: str) -> str:
    """Map API grade strings to our HadithGrade choices."""
    if not grades_list:
        return default
    grade_str = grades_list[0].get("grade", "").lower() if grades_list else ""
    if "muttafaq" in grade_str or ("agreed" in grade_str and "upon" in grade_str):
        return "muttafaqun_alayh"
    if "hasan sahih" in grade_str or ("hasan" in grade_str and "sahih" in grade_str):
        return "hasan_sahih"
    if "sahih" in grade_str or "authentic" in grade_str:
        return "sahih"
    if "hasan" in grade_str or "good" in grade_str:
        return "hasan"
    return default


def _fetch_edition(edition_name: str, timeout: int = 30) -> Optional[dict]:
    """Fetch an edition's JSON file from jsDelivr CDN."""
    url = f"{CDN_BASE}/{edition_name}.json"
    try:
        resp = requests.get(url, timeout=timeout)
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.Timeout:
        return None
    except requests.exceptions.HTTPError:
        return None
    except requests.exceptions.RequestException:
        return None
    except ValueError:
        return None


# ─────────────────────────────────────────────────────────────────────────────
# COMMAND
# ─────────────────────────────────────────────────────────────────────────────

class Command(BaseCommand):
    help = (
        "Fetches real Hadith data from fawazahmed0/hadith-api (jsDelivr CDN) "
        "and seeds the local Hadith model. Safe to run multiple times."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--collection",
            type=str,
            default="nawawi",
            help=(
                "Which collection to seed: nawawi (default), bukhari, muslim, "
                "abudawud, tirmidhi, ibnmajah, or 'all'."
            ),
        )
        parser.add_argument(
            "--max-hadiths",
            type=int,
            default=None,
            help="Limit number of hadiths imported per collection. Overrides collection defaults.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Parse and log entries without writing to the database.",
        )

    # ── Entry Point ─────────────────────────────────────────────────────────

    def handle(self, *args, **options):
        collection_arg = options["collection"]
        max_hadiths_override = options["max_hadiths"]
        dry_run = options["dry_run"]

        if dry_run:
            self.stdout.write(self.style.WARNING("[DRY RUN] No database writes will occur.\n"))

        # Resolve target collections
        if collection_arg == "all":
            targets = list(COLLECTIONS.keys())
        elif collection_arg in COLLECTIONS:
            targets = [collection_arg]
        else:
            raise CommandError(
                f"Unknown collection '{collection_arg}'. "
                f"Choose from: {', '.join(COLLECTIONS.keys())} or 'all'."
            )

        self.stdout.write(
            self.style.MIGRATE_HEADING(
                f"[SEED] Seeding Hadith database from {len(targets)} collection(s)...\n"
            )
        )

        grand_created = 0
        grand_updated = 0
        grand_skipped = 0

        for collection_slug in targets:
            config = COLLECTIONS[collection_slug]
            # max_hadiths: CLI override > collection default > None (all)
            max_hadiths = max_hadiths_override if max_hadiths_override is not None else config.get("max_default")

            created, updated, skipped = self._seed_collection(
                collection_slug=collection_slug,
                config=config,
                max_hadiths=max_hadiths,
                dry_run=dry_run,
            )
            grand_created += created
            grand_updated += updated
            grand_skipped += skipped

            # Polite pause between collections to respect CDN
            if len(targets) > 1:
                time.sleep(1)

        self.stdout.write("")
        if not dry_run:
            total_in_db = Hadith.objects.count()
        else:
            total_in_db = "(dry-run, DB not modified)"

        self.stdout.write(
            self.style.SUCCESS(
                f"[DONE] Seeding complete!\n"
                f"   Created : {grand_created}\n"
                f"   Updated : {grand_updated}\n"
                f"   Skipped : {grand_skipped} (empty text)\n"
                f"   Total in DB: {total_in_db}"
            )
        )

    # ── Per-Collection Seeding ───────────────────────────────────────────────

    def _seed_collection(
        self,
        collection_slug: str,
        config: dict,
        max_hadiths: Optional[int],
        dry_run: bool,
    ) -> tuple:
        """Fetch Arabic + English editions for a collection and persist to DB."""

        self.stdout.write(
            self.style.MIGRATE_LABEL(
                f"\n  -> Collection: {collection_slug} ({config['source_label']})"
            )
        )

        ar_edition = config["ar_edition"]
        en_edition = config["en_edition"]

        self.stdout.write(f"     Fetching Arabic  edition: {ar_edition}.json ...")
        ar_data = _fetch_edition(ar_edition)

        self.stdout.write(f"     Fetching English edition: {en_edition}.json ...")
        en_data = _fetch_edition(en_edition)

        if ar_data is None:
            self.stdout.write(
                self.style.WARNING(
                    f"     [WARN] Could not fetch Arabic edition '{ar_edition}' - skipping."
                )
            )
            return 0, 0, 0

        ar_hadiths_list: List[dict] = ar_data.get("hadiths", [])
        en_hadiths_list: List[dict] = en_data.get("hadiths", []) if en_data else []

        if not ar_hadiths_list:
            self.stdout.write(
                self.style.WARNING(
                    f"     [WARN] No hadiths found in '{ar_edition}' - skipping."
                )
            )
            return 0, 0, 0

        # Build a lookup dict for English: hadithnumber -> entry
        en_by_number = {
            str(h.get("hadithnumber", h.get("arabicnumber", ""))): h
            for h in en_hadiths_list
            if isinstance(h, dict)
        }

        # Get metadata for chapter title lookup (if available)
        metadata = ar_data.get("metadata", {})
        ar_sections = metadata.get("sections", {})

        total_ar = len(ar_hadiths_list)
        total_en = len(en_hadiths_list)
        self.stdout.write(
            f"     Found {total_ar} Arabic hadiths + {total_en} English hadiths."
        )

        # Slice if limit specified
        to_process = ar_hadiths_list[:max_hadiths] if max_hadiths else ar_hadiths_list

        created = updated = skipped = 0
        order_base = Hadith.objects.filter(source=config["source_label"]).count()

        for idx, ar_entry in enumerate(to_process, start=1):
            hadith_num = str(
                ar_entry.get("hadithnumber", ar_entry.get("arabicnumber", idx))
            )

            arabic_text = (ar_entry.get("text") or "").strip()
            if not arabic_text:
                skipped += 1
                continue

            # Match corresponding English entry
            en_entry = en_by_number.get(hadith_num, {})
            english_text = (en_entry.get("text") or "").strip()

            # Chapter / section title (English) for category inference
            reference = ar_entry.get("reference", {})
            section_num = str(reference.get("book", ""))
            section_title_en = metadata.get("sections", {}).get(section_num, "")
            if not section_title_en and en_entry:
                en_meta = en_data.get("metadata", {}) if en_data else {}
                section_title_en = en_meta.get("sections", {}).get(section_num, "")

            category = _infer_category(section_title_en, config["category"])

            # Grade from API grades array (fallback to collection default)
            grades = ar_entry.get("grades") or en_entry.get("grades") or []
            grade = _infer_grade(grades, config["grade"])

            order = order_base + idx

            if dry_run:
                self.stdout.write(
                    f"     [DRY #{hadith_num}] "
                    + arabic_text[:70].encode("ascii", "replace").decode()
                    + "..."
                )
                created += 1
                continue

            try:
                _, is_created = Hadith.objects.update_or_create(
                    text=arabic_text,
                    defaults={
                        "translation": english_text,
                        "narrator": "",        # API doesn't provide individual narrator per hadith
                        "source": config["source_label"],
                        "category": category,
                        "grade": grade,
                        "order": order,
                    },
                )
                if is_created:
                    created += 1
                else:
                    updated += 1

            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f"     [WARN] Could not save hadith #{hadith_num}: {e}")
                )
                skipped += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"     [OK] {config['source_label']}: "
                f"{created} created, {updated} updated, {skipped} skipped."
            )
        )
        return created, updated, skipped
