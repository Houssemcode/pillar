from django.contrib import admin
from django.urls import include, path


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/faith/", include("faith.urls")),
    path("api/tasks/", include("tasks.urls")),
    path("api/habits/", include("habits.urls")),
    path("api/focus/", include("focus.urls")),
    path("api/", include("api.urls")),
]