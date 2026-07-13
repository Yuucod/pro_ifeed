from django.contrib.auth.models import AbstractUser
from django.db import models

from .managers import UsuarioManager


class Usuario(AbstractUser):
    class TipoUsuario(models.TextChoices):
        ALUNO = 'ALUNO', 'Aluno'
        ADMIN = 'ADMIN', 'Administrador'

    username = None
    nome = models.CharField('nome completo', max_length=100)
    email = models.EmailField('e-mail', unique=True)
    matricula = models.CharField('matrícula', max_length=30, unique=True, null=True, blank=True)
    tipo_usuario = models.CharField(max_length=10, choices=TipoUsuario.choices, default=TipoUsuario.ALUNO)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nome']

    objects = UsuarioManager()

    class Meta:
        db_table = 'usuario'
        verbose_name = 'usuário'
        verbose_name_plural = 'usuários'

    @property
    def primeiro_nome(self):
        return (self.nome or self.email).split()[0]

    def __str__(self):
        return f'{self.nome} ({self.get_tipo_usuario_display()})'


class Aluno(models.Model):
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name='aluno')
    curso = models.CharField(max_length=100, blank=True, default='Não informado')

    class Meta:
        db_table = 'aluno'
        verbose_name = 'aluno'
        verbose_name_plural = 'alunos'

    def __str__(self):
        return self.usuario.nome


class Administrador(models.Model):
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name='administrador')
    cargo = models.CharField(max_length=100, blank=True, default='Administrador')

    class Meta:
        db_table = 'administrador'
        verbose_name = 'administrador'
        verbose_name_plural = 'administradores'

    def __str__(self):
        return self.usuario.nome
