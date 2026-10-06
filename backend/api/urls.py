from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

router = DefaultRouter()
router.register("profile", views.UserProfileViewSet, basename="userprofile")

urlpatterns = [
    path("profile/me/", views.user_profile_me),
    path("profile/me", views.user_profile_me),
    path("", include(router.urls)),
    path("health/", views.health),
    path("auth/register/", views.RegisterView.as_view(), name="auth_register"),
    path("auth/login/", views.CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me/", views.me, name="auth_me"),
    path("users/me/", views.me, name="users_me"),
    path("auth/change-password/", views.change_password),
    path("auth/profile-stats/", views.profile_stats),
    path("auth/export/", views.export_data),
    path("auth/delete-account/", views.delete_account),
    path("today/", views.today_dashboard),
    path("tasks/", views.tasks),
    path("tasks/<int:task_id>/", views.task_detail),
    path("tasks/lists/", views.task_lists),
    path("tasks/lists/<str:identifier>/", views.task_list_detail),
    path("tasks/tags/", views.task_tags),
    path("tasks/tags/<str:identifier>/", views.task_tag_detail),
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
    # Calendar
    path("calendar/events/",          views.calendar_events),
    path("calendar/events/month/",     views.calendar_month),
    path("calendar/events/agenda/",    views.calendar_agenda),
    path("calendar/events/<int:event_id>/", views.calendar_event_detail),
    path("trash/", views.trash_list),
    path("trash/<str:item_type>/<int:item_id>/", views.trash_detail),
]