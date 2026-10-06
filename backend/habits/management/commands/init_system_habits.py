"""
Management command to initialize core system habits with system_code for users.
Usage:
    python manage.py init_system_habits
    python manage.py init_system_habits --username admin
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from habits.presets import initialize_core_habits_for_user


class Command(BaseCommand):
    help = "Initializes core system habits ('quran', 'morning_adhkar', 'evening_adhkar') with system_code"

    def add_arguments(self, parser):
        parser.add_argument(
            "--username",
            type=str,
            help="Specific username to initialize habits for",
        )

    def handle(self, *args, **options):
        User = get_user_model()
        username = options.get("username")

        if username:
            users = User.objects.filter(username=username)
            if not users.exists():
                self.stderr.write(self.style.ERROR(f"User '{username}' not found."))
                return
        else:
            users = User.objects.all()

        total_created = 0
        user_count = 0

        for user in users:
            created = initialize_core_habits_for_user(user=user)
            total_created += len(created)
            user_count += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f"Initialized core habits for user '{user.username}' ({len(created)} newly created)"
                )
            )

        # Also initialize for global/anonymous template if users list was empty
        if user_count == 0:
            created = initialize_core_habits_for_user(user=None)
            total_created += len(created)
            self.stdout.write(
                self.style.SUCCESS(f"Initialized global/demo core habits ({len(created)} created)")
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Done! Created {total_created} habits across {user_count} user(s)."
            )
        )
