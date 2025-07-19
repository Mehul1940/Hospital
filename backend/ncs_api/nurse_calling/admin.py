from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import (
    User, Hospital, Building, Floor, Ward, Bed,
    Device, StaffTeam, Nurse, TeamAssignment, Call, Patient 
)

# Customize the User admin
class UserAdmin(BaseUserAdmin):
    model = User
    list_display = ('username', 'email', 'role', 'is_staff', 'is_superuser')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('username', 'email', 'role')
    ordering = ('username',)

    fieldsets = (
        (None, {'fields': ('username', 'email', 'password')}),
        (_('Personal Info'), {'fields': ('first_name', 'last_name')}),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Role Info'), {'fields': ('role',)}),
        (_('Important Dates'), {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'role', 'password1', 'password2'),
        }),
    )

# Register models
admin.site.register(User, UserAdmin)
admin.site.register(Hospital)
admin.site.register(Building)
admin.site.register(Floor)
admin.site.register(Ward)
admin.site.register(Bed)
admin.site.register(Device)
admin.site.register(StaffTeam)
admin.site.register(Nurse)
admin.site.register(TeamAssignment)
admin.site.register(Call)
admin.site.register(Patient)
