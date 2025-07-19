from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from nurse_calling.views import (
    UserViewSet, HospitalViewSet, BuildingViewSet, FloorViewSet,
    WardViewSet, BedViewSet, DeviceViewSet, StaffTeamViewSet,
    NurseViewSet, TeamAssignmentViewSet, CallViewSet, PatientViewSet,
    RegisterView, ChangePasswordView, ForgotPasswordView, ResetPasswordView , logout_view
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'hospitals', HospitalViewSet)
router.register(r'buildings', BuildingViewSet)
router.register(r'floors', FloorViewSet)
router.register(r'wards', WardViewSet)
router.register(r'beds', BedViewSet)
router.register(r'devices', DeviceViewSet)
router.register(r'staff-teams', StaffTeamViewSet)
router.register(r'nurses', NurseViewSet)
router.register(r'team-assignments', TeamAssignmentViewSet)
router.register(r'calls', CallViewSet)
router.register(r'patients', PatientViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/register/', RegisterView.as_view(), name='auth_register'),
    path('api/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('api/forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('api/reset-password/', ResetPasswordView.as_view(), name='reset_password'),
    path('api/logout/', logout_view, name='logout'),
]