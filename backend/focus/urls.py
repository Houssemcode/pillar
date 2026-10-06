"""
URL configuration for the Focus module.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import FocusSessionViewSet

router = DefaultRouter()
router.register(r"sessions", FocusSessionViewSet, basename="focus-session")
router.register(r"", FocusSessionViewSet, basename="focus")

urlpatterns = [
    path("", include(router.urls)),
]
