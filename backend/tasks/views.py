"""
Views and ViewSets for the Tasks module API.

Provides full DRF ModelViewSets for:
- Task (filtering by is_completed, due_date, list_id, search, priority, trash)
- TaskList (lists management with tasks sub-endpoint)
- Tag (tag management)
"""
from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import TaskList, Tag, Task
from .serializers import TaskListSerializer, TagSerializer, TaskSerializer


class TaskViewSet(viewsets.ModelViewSet):
    """
    ModelViewSet for Tasks.

    Filtering Capabilities:
    - is_completed: ?is_completed=true / ?is_completed=false (also accepts ?done=true)
    - due_date: ?due_date=YYYY-MM-DD
    - list_id: ?list_id=1 (also accepts ?list=1 or ?list=Work)
    - tag: ?tag=urgent (filters by tag name)
    - priority: ?priority=high / medium / low / none
    - search: ?search=keyword (searches title and description)
    - trash: ?trash=true (trashed only), ?trash=all (all), default is non-trashed

    Custom Actions:
    - POST/PATCH /api/tasks/{id}/toggle/       (Toggle is_completed)
    - POST       /api/tasks/batch-complete/    (Batch complete tasks by IDs)
    - POST       /api/tasks/batch-trash/       (Batch move tasks to trash)
    - POST       /api/tasks/batch-delete/      (Batch permanently delete tasks)
    """
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = (
            Task.objects
            .select_related("list")
            .prefetch_related("subtasks", "tags")
        )

        user = self.request.user
        if user and user.is_authenticated:
            queryset = queryset.filter(Q(owner=user) | Q(owner__isnull=True))

        params = self.request.query_params

        # 1. Filter by is_completed / done
        is_completed_param = params.get("is_completed") or params.get("done")
        if is_completed_param is not None:
            if is_completed_param.lower() in ("true", "1", "yes"):
                queryset = queryset.filter(is_completed=True)
            elif is_completed_param.lower() in ("false", "0", "no"):
                queryset = queryset.filter(is_completed=False)

        # 2. Filter by due_date
        due_date_param = params.get("due_date")
        if due_date_param:
            queryset = queryset.filter(due_date=due_date_param.strip())

        # 2b. Filter by due_today shortcut
        due_today = params.get("due_today")
        if due_today and due_today.lower() in ("true", "1"):
            queryset = queryset.filter(due_date=timezone.localdate())

        # 3. Filter by list_id or list name
        list_param = params.get("list_id") or params.get("list")
        if list_param:
            list_str = str(list_param).strip()
            if list_str.isdigit():
                queryset = queryset.filter(list_id=int(list_str))
            else:
                queryset = queryset.filter(list__name__iexact=list_str)

        # 4. Filter by tag
        tag_param = params.get("tag")
        if tag_param:
            tag_str = tag_param.strip().lstrip("#")
            queryset = queryset.filter(tags__name__iexact=tag_str)

        # 5. Filter by priority
        priority_param = params.get("priority")
        if priority_param:
            queryset = queryset.filter(priority__iexact=priority_param.strip())

        # 6. Filter by trash status
        trash_param = params.get("trash")
        if trash_param == "true":
            queryset = queryset.filter(in_trash=True)
        elif trash_param != "all":
            queryset = queryset.filter(in_trash=False)

        # 7. Search filter
        search_param = params.get("search")
        if search_param:
            query = search_param.strip()
            queryset = queryset.filter(
                Q(title__icontains=query) | Q(description__icontains=query)
            )

        return queryset

    def perform_create(self, serializer):
        if self.request.user and self.request.user.is_authenticated:
            serializer.save(owner=self.request.user)
        else:
            serializer.save()

    def destroy(self, request, *args, **kwargs):
        """Soft-deletes the task to trash, or permanently deletes if requested."""
        task = self.get_object()
        permanent = request.query_params.get("permanent") == "true"
        if task.in_trash or permanent:
            task.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        task.in_trash = True
        task.save(update_fields=["in_trash", "updated_at"])
        return Response(self.get_serializer(task).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post", "patch"], url_path="toggle")
    def toggle(self, request, pk=None):
        """Toggle task completion state."""
        task = self.get_object()
        task.is_completed = not task.is_completed
        task.save(update_fields=["is_completed", "updated_at"])
        return Response(self.get_serializer(task).data)

    @action(detail=False, methods=["post"], url_path="batch-complete")
    def batch_complete(self, request):
        """Batch toggle or complete a set of tasks."""
        task_ids = request.data.get("ids", [])
        is_completed = request.data.get("done", request.data.get("is_completed", True))
        updated = self.get_queryset().filter(id__in=task_ids).update(
            is_completed=is_completed, updated_at=timezone.now()
        )
        return Response({"status": "success", "updated_count": updated, "is_completed": is_completed})

    @action(detail=False, methods=["post"], url_path="batch-trash")
    def batch_trash(self, request):
        """Batch move tasks to trash."""
        task_ids = request.data.get("ids", [])
        in_trash = request.data.get("in_trash", True)
        updated = self.get_queryset().filter(id__in=task_ids).update(
            in_trash=in_trash, updated_at=timezone.now()
        )
        return Response({"status": "success", "updated_count": updated, "in_trash": in_trash})

    @action(detail=False, methods=["post"], url_path="batch-delete")
    def batch_delete(self, request):
        """Batch permanently delete tasks."""
        task_ids = request.data.get("ids", [])
        deleted_count, _ = self.get_queryset().filter(id__in=task_ids).delete()
        return Response({"status": "success", "deleted_count": deleted_count})


class TaskListViewSet(viewsets.ModelViewSet):
    """
    ModelViewSet for Task Lists.
    """
    queryset = TaskList.objects.all()
    serializer_class = TaskListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = TaskList.objects.all()
        user = self.request.user
        if user and user.is_authenticated:
            queryset = queryset.filter(Q(owner=user) | Q(owner__isnull=True))

        trash_param = self.request.query_params.get("trash")
        if trash_param == "true":
            queryset = queryset.filter(in_trash=True)
        elif trash_param != "all":
            queryset = queryset.filter(in_trash=False)

        return queryset

    def perform_create(self, serializer):
        if self.request.user and self.request.user.is_authenticated:
            serializer.save(owner=self.request.user)
        else:
            serializer.save()

    def get_object(self):
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_val = str(self.kwargs.get(lookup_url_kwarg, "")).strip()
        if lookup_val.isdigit():
            return super().get_object()
        obj = self.get_queryset().filter(name__iexact=lookup_val).first()
        if obj:
            self.check_object_permissions(self.request, obj)
            return obj
        return super().get_object()

    @action(detail=True, methods=["get"], url_path="tasks")
    def tasks(self, request, pk=None):
        """Return all tasks assigned to this list."""
        task_list = self.get_object()
        tasks = task_list.tasks.filter(in_trash=False)
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)


class TagViewSet(viewsets.ModelViewSet):
    """
    ModelViewSet for Task Tags.
    """
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Tag.objects.all()
        user = self.request.user
        if user and user.is_authenticated:
            queryset = queryset.filter(Q(owner=user) | Q(owner__isnull=True))
        return queryset

    def get_object(self):
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_val = str(self.kwargs.get(lookup_url_kwarg, "")).strip()
        if lookup_val.isdigit():
            return super().get_object()
        obj = self.get_queryset().filter(name__iexact=lookup_val).first()
        if obj:
            self.check_object_permissions(self.request, obj)
            return obj
        return super().get_object()

    def perform_create(self, serializer):
        if self.request.user and self.request.user.is_authenticated:
            serializer.save(owner=self.request.user)
        else:
            serializer.save()
