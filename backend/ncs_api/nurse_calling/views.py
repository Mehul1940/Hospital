from rest_framework import viewsets
from .models import (
    User, Hospital, Building, Floor, Ward, Bed,
    Device, StaffTeam, Nurse, TeamAssignment, Call, Patient
)
from .serializers import (
    UserSerializer, HospitalSerializer, BuildingSerializer, FloorSerializer,
    WardSerializer, BedSerializer, DeviceSerializer, StaffTeamSerializer,
    NurseSerializer, TeamAssignmentSerializer, CallSerializer, PatientSerializer,
    UserRegisterSerializer,
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer 
)
from rest_framework.decorators import api_view, permission_classes
from rest_framework import generics, status
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.utils.crypto import get_random_string
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.contrib.auth.models import Group
from rest_framework_simplejwt.exceptions import TokenError


User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        user = serializer.save()

        # Set role to 'nurse' by default
        user.role = 'nurse'
        user.save()

        # Add user to 'nurse' group
        try:
            nurse_group = Group.objects.get(name='nurse')
        except Group.DoesNotExist:
            nurse_group = Group.objects.create(name='nurse')
        user.groups.add(nurse_group)

        
class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    model = User
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        self.object = self.get_object()
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            if not self.object.check_password(serializer.data.get("old_password")):
                return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)
            
            self.object.set_password(serializer.data.get("new_password"))
            self.object.save()
            return Response({"detail": "Password updated successfully."}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ForgotPasswordView(generics.GenericAPIView):
    serializer_class = ForgotPasswordSerializer

    def post(self, request, *args, **kwargs):
        email = request.data.get("email")
        user = User.objects.filter(email=email).first()
        if user:
            token = get_random_string(length=6)
            user.reset_token = token
            user.save()
            # In production, send this via email
            send_mail(
                subject="Password Reset Token",
                message=f"Use this token to reset your password: {token}",
                recipient_list=[email],
                from_email="noreply@yourdomain.com"
            )
            return Response({"detail": "Reset token sent."}, status=status.HTTP_200_OK)
        return Response({"email": "User not found."}, status=status.HTTP_404_NOT_FOUND)


class ResetPasswordView(generics.GenericAPIView):
    serializer_class = ResetPasswordSerializer

    def post(self, request, *args, **kwargs):
        token = request.data.get("token")
        user = User.objects.filter(reset_token=token).first()
        if user:
            user.set_password(request.data.get("new_password"))
            user.reset_token = ''
            user.save()
            return Response({"detail": "Password reset successful."}, status=status.HTTP_200_OK)
        return Response({"token": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class HospitalViewSet(viewsets.ModelViewSet):
    queryset = Hospital.objects.all()
    serializer_class = HospitalSerializer
    permission_classes = [IsAuthenticated]


class BuildingViewSet(viewsets.ModelViewSet):
    queryset = Building.objects.all()
    serializer_class = BuildingSerializer
    permission_classes = [IsAuthenticated]


class FloorViewSet(viewsets.ModelViewSet):
    queryset = Floor.objects.all()
    serializer_class = FloorSerializer
    permission_classes = [IsAuthenticated]


class WardViewSet(viewsets.ModelViewSet):
    queryset = Ward.objects.all()
    serializer_class = WardSerializer
    permission_classes = [IsAuthenticated]


class BedViewSet(viewsets.ModelViewSet):
    queryset = Bed.objects.all()
    serializer_class = BedSerializer
    permission_classes = [IsAuthenticated]


class DeviceViewSet(viewsets.ModelViewSet):
    queryset = Device.objects.all()
    serializer_class = DeviceSerializer
    permission_classes = [IsAuthenticated]


class StaffTeamViewSet(viewsets.ModelViewSet):
    queryset = StaffTeam.objects.all()
    serializer_class = StaffTeamSerializer
    permission_classes = [IsAuthenticated]


class NurseViewSet(viewsets.ModelViewSet):
    queryset = Nurse.objects.all()
    serializer_class = NurseSerializer
    permission_classes = [IsAuthenticated]


class TeamAssignmentViewSet(viewsets.ModelViewSet):
    queryset = TeamAssignment.objects.all()
    serializer_class = TeamAssignmentSerializer
    permission_classes = [IsAuthenticated]


class CallViewSet(viewsets.ModelViewSet):
    queryset = Call.objects.all()
    serializer_class = CallSerializer
    permission_classes = [IsAuthenticated]


class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='me', permission_classes=[IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data.get('refresh_token')
        if not refresh_token:
            return Response({'error': 'Refresh token is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        token = RefreshToken(refresh_token)
        token.blacklist()
        
        return Response({'message': 'Successfully logged out'}, status=status.HTTP_205_RESET_CONTENT)
    
    except TokenError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)