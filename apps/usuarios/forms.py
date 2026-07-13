from django import forms
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm, PasswordChangeForm, PasswordResetForm

from .models import Usuario


class LoginForm(AuthenticationForm):
    username = forms.CharField(label='Matrícula ou e-mail', widget=forms.TextInput(attrs={'placeholder': 'Digite sua matrícula ou e-mail'}))
    password = forms.CharField(label='Senha', widget=forms.PasswordInput(attrs={'placeholder': 'Digite sua senha'}))

    def clean(self):
        login = self.cleaned_data.get('username')
        if login and '@' not in login:
            usuario = Usuario.objects.filter(matricula=login).first()
            if usuario:
                self.cleaned_data['username'] = usuario.email
        return super().clean()


class CadastroAlunoForm(UserCreationForm):
    curso = forms.CharField(max_length=100, required=False, label='Curso', initial='TSI')

    class Meta:
        model = Usuario
        fields = ['nome', 'email', 'matricula', 'curso', 'password1', 'password2']

    def save(self, commit=True):
        usuario = super().save(commit=False)
        usuario.tipo_usuario = Usuario.TipoUsuario.ALUNO
        usuario.is_active = True
        usuario.is_staff = False
        if commit:
            usuario.save()
        return usuario


class UsuarioCreateForm(UserCreationForm):
    curso = forms.CharField(max_length=100, required=False, label='Curso do aluno')
    cargo = forms.CharField(max_length=100, required=False, label='Cargo do administrador')

    class Meta:
        model = Usuario
        fields = ['nome', 'email', 'matricula', 'tipo_usuario', 'is_active', 'password1', 'password2', 'curso', 'cargo']

    def save(self, commit=True):
        usuario = super().save(commit=False)
        usuario.is_staff = usuario.tipo_usuario == Usuario.TipoUsuario.ADMIN
        if commit:
            usuario.save()
        return usuario


class UsuarioUpdateForm(forms.ModelForm):
    curso = forms.CharField(max_length=100, required=False, label='Curso do aluno')
    cargo = forms.CharField(max_length=100, required=False, label='Cargo do administrador')

    class Meta:
        model = Usuario
        fields = ['nome', 'email', 'matricula', 'tipo_usuario', 'is_active', 'curso', 'cargo']

    def save(self, commit=True):
        usuario = super().save(commit=False)
        usuario.is_staff = usuario.tipo_usuario == Usuario.TipoUsuario.ADMIN or usuario.is_superuser
        if commit:
            usuario.save()
        return usuario



class PerfilUpdateForm(forms.ModelForm):
    curso = forms.CharField(max_length=100, required=False, label='Curso')
    cargo = forms.CharField(max_length=100, required=False, label='Cargo / setor')

    class Meta:
        model = Usuario
        fields = ['nome', 'email', 'matricula', 'curso', 'cargo']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        usuario = self.instance
        if usuario and usuario.pk:
            if usuario.tipo_usuario == Usuario.TipoUsuario.ALUNO and hasattr(usuario, 'aluno'):
                self.fields['curso'].initial = usuario.aluno.curso
            if usuario.tipo_usuario == Usuario.TipoUsuario.ADMIN and hasattr(usuario, 'administrador'):
                self.fields['cargo'].initial = usuario.administrador.cargo

    def clean_email(self):
        email = self.cleaned_data.get('email')
        qs = Usuario.objects.filter(email__iexact=email)
        if self.instance and self.instance.pk:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise forms.ValidationError('Este e-mail já está sendo utilizado por outro usuário.')
        return email

    def clean_matricula(self):
        matricula = self.cleaned_data.get('matricula')
        if matricula:
            qs = Usuario.objects.filter(matricula=matricula)
            if self.instance and self.instance.pk:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise forms.ValidationError('Esta matrícula já está sendo utilizada por outro usuário.')
        return matricula
