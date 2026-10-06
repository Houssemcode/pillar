"""
URL routing configuration for the Tasks module API.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import TaskViewSet, TaskListViewSet, TagViewSet

router = DefaultRouter()
router.register(r"lists", TaskListViewSet, basename="task-list")
router.register(r"tags", TagViewSet, basename="task-tag")
router.register(r"", TaskViewSet, basename="task")

urlpatterns = [
    path("", include(router.urls)),
]
