# app/signals.py
from django.db.models.signals import post_save ,  post_delete
from django.dispatch import receiver
from .models import Patient, Bed

@receiver(post_save, sender=Patient)
def update_bed_status_on_patient_assign(sender, instance, **kwargs):
    if instance.bed:
        # Update bed status to 'occupied'
        bed = instance.bed
        if bed.status != 'occupied':
            bed.status = 'occupied'
            bed.save()

@receiver(post_delete, sender=Patient)
def release_bed_on_patient_delete(sender, instance, **kwargs):
    if instance.bed:
        bed = instance.bed
        bed.status = 'available'
        bed.save()