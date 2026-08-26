from django.core.management.base import BaseCommand

from api.models import Profile
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = "Create the local demo account used by the Pillar login hint."

    def handle(self, *args, **options):
        user_model = get_user_model()
        user, created = user_model.objects.get_or_create(
            username="demo",
            defaults={"email": "demo@example.com"},
        )
        if created:
            user.set_password("pillar123")
            user.save(update_fields=["password"])
        Profile.objects.get_or_create(user=user)
        self.stdout.write(self.style.SUCCESS("Demo account ready: demo / pillar123"))