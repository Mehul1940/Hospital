from django.apps import AppConfig


class NurseCallingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'nurse_calling'
    verbose_name = "NURSE_CALLING"  

    def ready(self):
        import nurse_calling.signals