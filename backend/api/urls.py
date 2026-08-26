from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    path("health/", views.health),
    path("auth/register/", views.register),
    path("auth/login/", views.login),
    path("auth/refresh/", TokenRefreshView.as_view()),
    path("auth/me/", views.me),
    path("tasks/", views.tasks),
    path("tasks/<int:task_id>/", views.task_detail),
    path("tasks/lists/", views.task_lists),
    path("tasks/tags/", views.task_tags),
    path("habits/", views.habits),
    path("habits/<int:habit_id>/", views.habit_detail),
    path("habits/<int:habit_id>/toggle/", views.habit_toggle),
    path("habits/heatmap/", views.habit_heatmap),
    path("faith/prayers/", views.prayers),
    path("faith/prayers/<str:prayer_key>/toggle/", views.prayer_toggle),
    path("faith/adhkar/", views.adhkar),
    path("faith/khatmah/", views.khatmah),
    path("faith/deeds/", views.deeds),
    path("focus/sessions/", views.sessions),
    path("focus/sessions/today/", views.sessions_today),
    path("focus/sessions/weekly/", views.sessions_weekly),
]