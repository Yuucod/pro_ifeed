from django.conf import settings
from django.db import models

from apps.usuarios.models import Administrador


class Refeicao(models.Model):
    class Tipo(models.TextChoices):
        ALMOCO = 'A', 'Almoço'
        JANTAR = 'J', 'Jantar'
        LANCHE = 'L', 'Lanche'

    class Turno(models.TextChoices):
        MANHA = 'M', 'Manhã'
        VESPERTINO = 'V', 'Vespertino'
        NOTURNO = 'N', 'Noturno'

    class Status(models.TextChoices):
        RASCUNHO = 'RASCUNHO', 'Rascunho'
        PUBLICADO = 'PUBLICADO', 'Publicado'
        ENCERRADA = 'ENCERRADA', 'Encerrada'
        CANCELADA = 'CANCELADA', 'Cancelada'

    tipo = models.CharField(max_length=1, choices=Tipo.choices)
    data_refeicao = models.DateField()
    turno = models.CharField(max_length=1, choices=Turno.choices)
    campus = models.CharField(max_length=150, default='IFRN Campus Canguaretama')
    horario_inicio = models.TimeField()
    horario_fim = models.TimeField()
    observacoes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.RASCUNHO)
    administrador = models.ForeignKey(
        Administrador,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='refeicoes_cadastradas'
    )
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'refeicao'
        verbose_name = 'refeição'
        verbose_name_plural = 'refeições'
        ordering = ['-data_refeicao', 'tipo']
        indexes = [
            models.Index(fields=['data_refeicao']),
            models.Index(fields=['tipo']),
            models.Index(fields=['turno']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f'{self.get_tipo_display()} - {self.data_refeicao:%d/%m/%Y}'


class ItemRefeicao(models.Model):
    class TipoItem(models.TextChoices):
        PRATO_PRINCIPAL = 'PRATO_PRINCIPAL', 'Prato principal'
        ACOMPANHAMENTO = 'ACOMPANHAMENTO', 'Acompanhamento'
        SALADA = 'SALADA', 'Salada'
        BEBIDA = 'BEBIDA', 'Bebida'

    refeicao = models.ForeignKey(Refeicao, on_delete=models.CASCADE, related_name='itens')
    tipo_item = models.CharField(max_length=30, choices=TipoItem.choices)
    nome = models.CharField(max_length=150)
    ordem = models.PositiveSmallIntegerField(default=1)

    class Meta:
        db_table = 'item_refeicao'
        verbose_name = 'item da refeição'
        verbose_name_plural = 'itens da refeição'
        ordering = ['ordem', 'id']
        constraints = [
            models.UniqueConstraint(
                fields=['refeicao', 'tipo_item', 'nome'],
                name='uk_item_refeicao_nome'
            )
        ]

    def __str__(self):
        return f'{self.get_tipo_item_display()}: {self.nome}'
