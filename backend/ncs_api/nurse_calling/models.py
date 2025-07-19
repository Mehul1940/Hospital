from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.conf import settings
import uuid
from django.utils import timezone

def generate_uuid():
    return str(uuid.uuid4())

BUILDING_TYPE_CHOICES = [
    ('administrator', 'Administrator'),
    ('clinical', 'Clinical'),
    ('research','Research'),
    ('lab','Labratory'),
    ('other','Other'),
]

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('supervisor', 'Supervisor'),
        ('nurse', 'Nurse'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    email = models.EmailField(unique=True)

    groups = models.ManyToManyField(
        'auth.Group',
        related_name='nurse_users',
        related_query_name='nurse_user',
        blank=True,
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='nurse_users_permissions',
        related_query_name='nurse_user_permission',
        blank=True,
    )


class Hospital(models.Model):
    id = models.CharField(primary_key=True, max_length=100, default=generate_uuid, editable=False)
    name = models.CharField(max_length=255)
    address = models.TextField()
    admin = models.OneToOneField("Nurse", on_delete=models.SET_NULL, null=True, blank=True, related_name="managed_hospital")
    speciality = models.TextField(
        blank=True, 
        null=True, 
        help_text="e.g., Cardiology, Oncology, Pediatrics. Separate multiple specialities with commas."
    )
    phone_number = models.CharField(
        max_length=20, 
        blank=True, 
        null=True, 
        help_text="Contact phone number for the hospital."
    )

    def __str__(self):
        return self.name


class Building(models.Model):
    id = models.CharField(
        primary_key=True,
        max_length=100,
        default=generate_uuid,
        editable=False,
    )
    name = models.CharField(max_length=255)
    hospital = models.ForeignKey(
        'Hospital',
        on_delete=models.CASCADE,
        related_name='buildings'
    )
    supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'role': 'supervisor'},
        related_name='supervised_buildings'
    )
    building_type = models.CharField(
        max_length=20,
        choices=BUILDING_TYPE_CHOICES,
        default='other'
    )
    floors = models.PositiveIntegerField(
        blank=True,
        verbose_name='Number of Floors',
        help_text='e.g., 5'
    )
    address = models.TextField(
        blank=True,
        help_text='Full building address'
    )
    description = models.TextField(
        blank=True,
        help_text='Optional description'
    )

    def __str__(self):
        return self.name


class Floor(models.Model):
    id = models.CharField(primary_key=True, max_length=100, default=generate_uuid, editable=False)
    number = models.IntegerField()
    building = models.ForeignKey(Building, on_delete=models.CASCADE)
    supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'role': 'supervisor'},
        related_name='supervised_floors'
    )

    def __str__(self):
        return f"Floor {self.number} - {self.building.name}"


class Ward(models.Model):
    id = models.CharField(primary_key=True, max_length=100, default=generate_uuid, editable=False)
    name = models.CharField(max_length=255)
    floor = models.ForeignKey(Floor, on_delete=models.CASCADE)
    building = models.ForeignKey(Building, on_delete=models.CASCADE)

    def __str__(self):
        return f"Ward {self.name} - {self.building.name}"


class Bed(models.Model):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('occupied', 'Occupied'),
        ('maintenance', 'Under Maintenance'),
    ]
    id = models.CharField(primary_key=True, max_length=100, default=generate_uuid, editable=False)
    number = models.CharField(max_length=50)
    ward = models.ForeignKey(Ward, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available') 

    def __str__(self):
        return f"Bed {self.number} . ({self.get_status_display()})"


class Device(models.Model):
    id = models.CharField(primary_key=True, max_length=100, default=generate_uuid, editable=False)
    serial_number = models.CharField(max_length=100)
    bed = models.ForeignKey(Bed, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.serial_number} . {self.bed.number} "


class StaffTeam(models.Model):  
    id = models.CharField(primary_key=True, max_length=100, default=generate_uuid, editable=False)
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class Nurse(models.Model):
    id = models.CharField(primary_key=True, max_length=100, default=generate_uuid, editable=False)
    team = models.ForeignKey(StaffTeam, on_delete=models.CASCADE)
    nurse_id = models.CharField(max_length=100)
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class TeamAssignment(models.Model):
    id = models.CharField(primary_key=True, max_length=100, default=generate_uuid, editable=False)
    ward = models.ForeignKey(Ward, on_delete=models.CASCADE)
    floor = models.ForeignKey(Floor, on_delete=models.CASCADE)
    team = models.ForeignKey(StaffTeam, on_delete=models.CASCADE)


class Call(models.Model):
    id = models.CharField(primary_key=True, max_length=100, default=generate_uuid, editable=False)
    device = models.ForeignKey(Device, on_delete=models.CASCADE)
    bed = models.ForeignKey(Bed, on_delete=models.CASCADE)
    call_time = models.DateTimeField()
    status = models.CharField(max_length=50)
    response_time = models.DateTimeField(null=True, blank=True)
    nurse = models.ForeignKey(Nurse, on_delete=models.SET_NULL, null=True)


class Patient(models.Model):
    id = models.CharField(primary_key=True, max_length=100, default=generate_uuid, editable=False)
    name = models.CharField(max_length=255)
    age = models.PositiveIntegerField()
    gender = models.CharField(max_length=10)
    bed = models.OneToOneField(
        Bed, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="patient"
    )
    nurse = models.ForeignKey(
        Nurse, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="patients"
    )
    device = models.ForeignKey(
        Device, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="patients"
    )

    def __str__(self):
        return self.name
    

class Supervisor(models.Model):
    id = models.CharField(primary_key=True, max_length=100, default=generate_uuid, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, limit_choices_to={'role': 'supervisor'})
    team = models.ForeignKey(StaffTeam, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name
    
class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    role = models.CharField(max_length=50, default='Admin')
    two_factor_enabled = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']  # username still required unless you override auth

    def __str__(self):
        return self.email