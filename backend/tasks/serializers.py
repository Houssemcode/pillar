"""
DRF Serializers for the Tasks module.

Provides standard ModelSerializers with robust nested serialization for:
- TaskList
- Tag
- Subtask
- Task (nested Subtasks and Tags with dynamic atomic create/update)
"""
from rest_framework import serializers

from .models import TaskList, Tag, Task, Subtask


class TagSerializer(serializers.ModelSerializer):
    """
    Serializer for Task categorization tags.
    """
    class Meta:
        model = Tag
        fields = ["id", "name", "color", "created_at"]
        read_only_fields = ["id", "created_at"]


class SubtaskSerializer(serializers.ModelSerializer):
    """
    Serializer for Subtask checklists within a Task.
    Provides dual-compatibility for ('title' / 'text') and ('is_completed' / 'done').
    """
    id = serializers.IntegerField(required=False)
    text = serializers.CharField(source="title", required=False)
    done = serializers.BooleanField(source="is_completed", required=False)

    class Meta:
        model = Subtask
        fields = ["id", "title", "text", "is_completed", "done", "order", "created_at"]
        read_only_fields = ["created_at"]
        extra_kwargs = {
            "title": {"required": False},
        }

    def to_internal_value(self, data):
        ret = super().to_internal_value(data)
        if "text" in data and "title" not in ret:
            ret["title"] = str(data["text"]).strip()
        if "done" in data and "is_completed" not in ret:
            ret["is_completed"] = bool(data["done"])
        return ret


class TaskListSerializer(serializers.ModelSerializer):
    """
    Serializer for Task Lists with dynamic count aggregations and accent color support.
    """
    task_count = serializers.SerializerMethodField(read_only=True)
    active_count = serializers.SerializerMethodField(read_only=True)
    accent_color = serializers.CharField(required=False, default="#10B981")
    color = serializers.CharField(required=False, default="#10B981")

    class Meta:
        model = TaskList
        fields = [
            "id",
            "name",
            "color",
            "accent_color",
            "icon",
            "default_view",
            "in_trash",
            "task_count",
            "active_count",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, "copy") else dict(data)
        if "accentColor" in data and "accent_color" not in data:
            data["accent_color"] = data["accentColor"]
        if "defaultView" in data and "default_view" not in data:
            data["default_view"] = data["defaultView"]
        if "accent_color" in data and "color" not in data:
            data["color"] = data["accent_color"]
        elif "color" in data and "accent_color" not in data:
            data["accent_color"] = data["color"]
        ret = super().to_internal_value(data)
        if "accent_color" in ret and "color" not in ret:
            ret["color"] = ret["accent_color"]
        elif "color" in ret and "accent_color" not in ret:
            ret["accent_color"] = ret["color"]
        return ret

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        color = ret.get("color") or ret.get("accent_color") or "#10B981"
        ret["color"] = color
        ret["accent_color"] = ret.get("accent_color") or color
        ret["default_view"] = ret.get("default_view") or "list"
        ret["defaultView"] = ret["default_view"]
        return ret

    def get_task_count(self, obj):
        return obj.tasks.filter(in_trash=False).count()

    def get_active_count(self, obj):
        return obj.tasks.filter(in_trash=False, is_completed=False).count()


class TaskSerializer(serializers.ModelSerializer):
    """
    Comprehensive Task Serializer supporting:
    - Nested Subtasks (atomic creation, update, and deletion reconciliation)
    - Nested Tags (read-only representation + write support via IDs or names)
    - Full bidirectional compatibility with legacy React frontend fields:
        title <-> text
        is_completed <-> done
        description <-> notes
        time <-> due_time
        list <-> list_name
    """
    # Nested relations
    subtasks = SubtaskSerializer(many=True, required=False)
    tags = TagSerializer(many=True, read_only=True)
    list_details = TaskListSerializer(source="list", read_only=True)

    # Writable relational fields
    list = serializers.PrimaryKeyRelatedField(
        queryset=TaskList.objects.all(),
        required=False,
        allow_null=True,
    )
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(),
        many=True,
        write_only=True,
        required=False,
        source="tags",
    )

    # Convenience and compatibility fields for React frontend
    text = serializers.CharField(source="title", required=False)
    done = serializers.BooleanField(source="is_completed", required=False)
    notes = serializers.CharField(source="description", required=False, allow_blank=True)
    due_time = serializers.CharField(source="time", required=False, allow_blank=True)
    list_name = serializers.CharField(source="list.name", read_only=True, default="")
    tag = serializers.SerializerMethodField(read_only=True)
    tag_color = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Task
        fields = [
            "id",
            # Canonical fields
            "title",
            "description",
            "due_date",
            "time",
            "priority",
            "is_completed",
            "list",
            "list_details",
            "list_name",
            "tags",
            "tag_ids",
            "subtasks",
            # Additional productivity attributes
            "in_trash",
            "recurrence",
            "attachments",
            "reminder_offset",
            "created_at",
            "updated_at",
            # Compatibility alias fields
            "text",
            "done",
            "notes",
            "due_time",
            "tag",
            "tag_color",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        extra_kwargs = {
            "title": {"required": False},
        }

    def get_tag(self, obj):
        """Returns the primary tag name for single-tag UI components."""
        first_tag = obj.tags.first()
        return first_tag.name if first_tag else ""

    def get_tag_color(self, obj):
        """Returns the color of the primary tag."""
        first_tag = obj.tags.first()
        return first_tag.color if first_tag else ""

    def to_internal_value(self, data):
        """
        Normalize incoming field names and defensively sanitize types so either
        modern ('title', 'is_completed') or legacy ('text', 'done', 'notes', 'due_time')
        payloads succeed without DRF type validation errors.
        """
        data_dict = dict(data)

        # 1. Normalize aliases
        if "text" in data_dict and "title" not in data_dict:
            data_dict["title"] = str(data_dict["text"]).strip()
        if "done" in data_dict and "is_completed" not in data_dict:
            data_dict["is_completed"] = bool(data_dict["done"])
        if "notes" in data_dict and "description" not in data_dict:
            data_dict["description"] = str(data_dict["notes"])
        if "due_time" in data_dict and "time" not in data_dict:
            data_dict["time"] = str(data_dict["due_time"])

        # 2. Defensively sanitize 'list': handle empty string, ID vs name string
        raw_list = data_dict.get("list")
        if raw_list == "" or raw_list is False:
            data_dict["list"] = None
        elif isinstance(raw_list, str):
            clean_list_str = raw_list.strip()
            if clean_list_str.isdigit():
                data_dict["list"] = int(clean_list_str)
            elif clean_list_str:
                request = self.context.get("request")
                user = request.user if request and request.user.is_authenticated else None
                task_list, _ = TaskList.objects.get_or_create(
                    name=clean_list_str,
                    defaults={"owner": user}
                )
                data_dict["list"] = task_list.id
            else:
                data_dict["list"] = None
        elif raw_list is None and data_dict.get("list_name"):
            clean_name = str(data_dict["list_name"]).strip()
            if clean_name:
                request = self.context.get("request")
                user = request.user if request and request.user.is_authenticated else None
                task_list, _ = TaskList.objects.get_or_create(
                    name=clean_name,
                    defaults={"owner": user}
                )
                data_dict["list"] = task_list.id

        # 3. Defensively sanitize 'priority': force lowercase
        if "priority" in data_dict and data_dict["priority"]:
            clean_priority = str(data_dict["priority"]).lower().strip()
            valid_priorities = {Task.Priority.HIGH, Task.Priority.MEDIUM, Task.Priority.LOW, Task.Priority.NONE}
            data_dict["priority"] = clean_priority if clean_priority in valid_priorities else Task.Priority.NONE
        elif "priority" in data_dict and not data_dict["priority"]:
            data_dict["priority"] = Task.Priority.NONE

        # 4. Defensively sanitize 'due_date': empty string to None
        if "due_date" in data_dict and (data_dict["due_date"] == "" or data_dict["due_date"] is False):
            data_dict["due_date"] = None

        # 5. Defensively sanitize 'time': empty string to ""
        if "time" in data_dict and data_dict["time"] is None:
            data_dict["time"] = ""

        # 6. Defensively sanitize 'recurrence': empty string to None
        if "recurrence" in data_dict and data_dict["recurrence"] == "":
            data_dict["recurrence"] = None

        return super().to_internal_value(data_dict)

    def _sync_tags(self, task, raw_tags):
        """Helper to assign tags from either IDs, names, or dicts."""
        if not raw_tags:
            return
        tag_objects = []
        user = task.owner
        for item in raw_tags:
            if isinstance(item, int):
                try:
                    tag_objects.append(Tag.objects.get(id=item))
                except Tag.DoesNotExist:
                    pass
            elif isinstance(item, str) and item.strip():
                tag_name = item.strip().lstrip("#")
                tag, _ = Tag.objects.get_or_create(
                    name=tag_name,
                    defaults={"owner": user, "color": "#3B82F6"}
                )
                tag_objects.append(tag)
            elif isinstance(item, dict) and "name" in item:
                tag_name = str(item["name"]).strip().lstrip("#")
                tag, _ = Tag.objects.get_or_create(
                    name=tag_name,
                    defaults={"owner": user, "color": item.get("color", "#3B82F6")}
                )
                tag_objects.append(tag)

        if tag_objects:
            task.tags.set(tag_objects)

    def create(self, validated_data):
        """
        Create a new Task with nested Subtasks and Tag associations.
        """
        subtasks_data = validated_data.pop("subtasks", [])
        tags_data = validated_data.pop("tags", [])

        # Fallback to initial_data if not captured by validation
        if not subtasks_data and "subtasks" in self.initial_data:
            subtasks_data = self.initial_data["subtasks"]

        # Ensure title has a fallback if only text was passed
        if not validated_data.get("title"):
            validated_data["title"] = self.initial_data.get("text", "Untitled Task")

        task = Task.objects.create(**validated_data)

        # Handle tags
        if tags_data:
            task.tags.set(tags_data)
        elif "tags" in self.initial_data:
            self._sync_tags(task, self.initial_data["tags"])
        elif "tag" in self.initial_data and self.initial_data["tag"]:
            self._sync_tags(task, [self.initial_data["tag"]])

        # Handle nested subtasks
        if subtasks_data:
            for idx, st_data in enumerate(subtasks_data):
                st_title = st_data.get("title") or st_data.get("text", "")
                if not st_title:
                    continue
                st_completed = st_data.get("is_completed", st_data.get("done", False))
                st_order = st_data.get("order", idx)
                Subtask.objects.create(
                    task=task,
                    title=st_title,
                    is_completed=st_completed,
                    order=st_order,
                )

        return task

    def update(self, instance, validated_data):
        """
        Dynamically update a Task and reconcile nested Subtasks.
        - Existing subtasks matching an ID are updated.
        - Subtasks without an existing ID are created.
        - Omitted subtasks are deleted from the database.
        """
        subtasks_data = validated_data.pop("subtasks", None)
        tags_data = validated_data.pop("tags", None)

        if subtasks_data is None and "subtasks" in self.initial_data:
            subtasks_data = self.initial_data["subtasks"]

        # Update core task attributes
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update tags
        if tags_data is not None:
            instance.tags.set(tags_data)
        elif "tags" in self.initial_data:
            self._sync_tags(instance, self.initial_data["tags"])
        elif "tag" in self.initial_data:
            self._sync_tags(instance, [self.initial_data["tag"]] if self.initial_data["tag"] else [])

        # Reconcile nested subtasks
        if subtasks_data is not None:
            existing_subtasks = {st.id: st for st in instance.subtasks.all()}
            kept_subtask_ids = set()

            for idx, st_data in enumerate(subtasks_data):
                raw_id = st_data.get("id")
                st_title = st_data.get("title") or st_data.get("text", "")
                st_completed = st_data.get("is_completed", st_data.get("done", False))
                st_order = st_data.get("order", idx)

                # Attempt to convert ID to int (frontend might pass numeric strings or 'tmp-xxx')
                try:
                    st_id = int(raw_id) if raw_id is not None else None
                except (ValueError, TypeError):
                    st_id = None

                if st_id and st_id in existing_subtasks:
                    subtask = existing_subtasks[st_id]
                    if st_title:
                        subtask.title = st_title
                    subtask.is_completed = st_completed
                    subtask.order = st_order
                    subtask.save()
                    kept_subtask_ids.add(subtask.id)
                elif st_title:
                    new_subtask = Subtask.objects.create(
                        task=instance,
                        title=st_title,
                        is_completed=st_completed,
                        order=st_order,
                    )
                    kept_subtask_ids.add(new_subtask.id)

            # Prune removed subtasks
            instance.subtasks.exclude(id__in=kept_subtask_ids).delete()

        return instance
