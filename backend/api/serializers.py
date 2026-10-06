from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Profile, UserProfile


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name"]
        read_only_fields = ["id"]


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=6)
    password2 = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "password2"]

    def validate(self, attrs):
        pw = attrs.get("password")
        pw2 = attrs.get("password2")
        if pw2 and pw != pw2:
            raise serializers.ValidationError({"password": ["Passwords do not match."]})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2", None)
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
        )
        Profile.objects.get_or_create(user=user)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Profile
        fields = [
            "id",
            "username",
            "email",
            "language",
            "theme",
            "city",
            "country",
            "calculation_method",
            "gender",
            "is_excused",
            "bio",
            "headline",
            "avatar",
            "preferences",
        ]
        read_only_fields = ["id", "username", "email"]

    def update(self, instance, validated_data):
        current_prefs = instance.preferences if isinstance(instance.preferences, dict) else {}
        
        # If client passes nested preferences dict
        incoming_prefs = validated_data.get("preferences")
        if incoming_prefs and isinstance(incoming_prefs, dict):
            current_prefs.update(incoming_prefs)

        for attr, value in validated_data.items():
            if attr != "preferences":
                setattr(instance, attr, value)

        # Bidirectional sync: keep preferences dictionary keys in sync with top-level fields
        if "city" in validated_data:
            current_prefs["prayerCity"] = validated_data["city"]
        elif "prayerCity" in current_prefs:
            instance.city = current_prefs["prayerCity"]

        if "country" in validated_data:
            current_prefs["prayerCountry"] = validated_data["country"]
        elif "prayerCountry" in current_prefs:
            instance.country = current_prefs["prayerCountry"]

        if "calculation_method" in validated_data:
            current_prefs["prayerMethod"] = validated_data["calculation_method"]
        elif "prayerMethod" in current_prefs:
            instance.calculation_method = current_prefs["prayerMethod"]

        if "language" in validated_data:
            current_prefs["language"] = validated_data["language"]
        elif "language" in current_prefs:
            instance.language = current_prefs["language"]

        if "theme" in validated_data:
            current_prefs["colorTheme"] = validated_data["theme"]
            current_prefs["theme"] = validated_data["theme"]
        elif "colorTheme" in current_prefs:
            instance.theme = current_prefs["colorTheme"]
        elif "theme" in current_prefs:
            instance.theme = current_prefs["theme"]

        instance.preferences = current_prefs
        instance.save()
        return instance
