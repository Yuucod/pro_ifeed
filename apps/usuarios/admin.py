from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _

from .models import Administrador, Aluno, Usuario


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    ordering = ('nome',)
    list_display = ('nome', 'email', 'matricula', 'tipo_usuario', 'is_active', 'is_staff')
    list_filter = ('tipo_usuario', 'is_active', 'is_staff')
    search_fields = ('nome', 'email', 'matricula')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Informações pessoais'), {'fields': ('nome', 'matricula', 'tipo_usuario')}),
        (_('Permissões'), {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        (_('Datas importantes'), {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('nome', 'email', 'matricula', 'tipo_usuario', 'password1', 'password2', 'is_staff', 'is_superuser', 'is_active'),
        }),
    )


@admin.register(Aluno)
class AlunoAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'curso')
    search_fields = ('usuario__nome', 'usuario__email', 'usuario__matricula', 'curso')


@admin.register(Administrador)
class AdministradorAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'cargo')
    search_fields = ('usuario__nome', 'usuario__email', 'usuario__matricula', 'cargo')
