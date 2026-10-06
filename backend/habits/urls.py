"""
URL routing configuration for the Habits module API.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import HabitViewSet, HabitAreaViewSet

router = DefaultRouter()
router.register(r"areas", HabitAreaViewSet, basename="habit-area")
router.register(r"", HabitViewSet, basename="habit")

urlpatterns = [
    path("", include(router.urls)),
]
