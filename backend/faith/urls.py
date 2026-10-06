"""
URL routing configuration for the Faith module API.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AdhkarViewSet, HadithViewSet, GoodDeedViewSet

router = DefaultRouter()
router.register(r"adhkar", AdhkarViewSet, basename="adhkar")
router.register(r"hadiths", HadithViewSet, basename="hadith")
router.register(r"deeds", GoodDeedViewSet, basename="good-deed")

urlpatterns = [
    path("", include(router.urls)),
]
