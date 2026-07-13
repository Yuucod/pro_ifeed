from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.refeicoes.models import Refeicao
from apps.usuarios.models import Administrador, Aluno


nota_validators = [MinValueValidator(1), MaxValueValidator(5)]


class Feedback(models.Model):
    aluno = models.ForeignKey(Aluno, on_delete=models.PROTECT, related_name='feedbacks')
    refeicao = models.ForeignKey(Refeicao, on_delete=models.PROTECT, related_name='feedbacks')
    nota = models.PositiveSmallIntegerField(validators=nota_validators)
    sabor = models.PositiveSmallIntegerField(validators=nota_validators)
    temperatura = models.PositiveSmallIntegerField(validators=nota_validators)
    quantidade = models.PositiveSmallIntegerField(validators=nota_validators)
    variedade = models.PositiveSmallIntegerField(validators=nota_validators)
    comentario = models.TextField(blank=True)
    sugestao = models.TextField(blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'feedback'
        verbose_name = 'feedback'
        verbose_name_plural = 'feedbacks'
        ordering = ['-criado_em']
        constraints = [
            models.UniqueConstraint(
                fields=['aluno', 'refeicao'],
                name='uk_feedback_aluno_refeicao'
            )
        ]
        indexes = [
            models.Index(fields=['criado_em']),
            models.Index(fields=['nota']),
        ]

    def __str__(self):
        return f'{self.aluno} - {self.refeicao} ({self.nota}★)'


class AnaliseFeedback(models.Model):
    class StatusAnalise(models.TextChoices):
        VISUALIZADO = 'VISUALIZADO', 'Visualizado'
        EM_ANALISE = 'EM_ANALISE', 'Em análise'
        RESOLVIDO = 'RESOLVIDO', 'Resolvido'
        IGNORADO = 'IGNORADO', 'Ignorado'

    feedback = models.OneToOneField(Feedback, on_delete=models.CASCADE, related_name='analise')
    administrador = models.ForeignKey(Administrador, on_delete=models.PROTECT, related_name='analises_feedback')
    status_analise = models.CharField(
        max_length=20,
        choices=StatusAnalise.choices,
        default=StatusAnalise.VISUALIZADO
    )
    observacao_admin = models.TextField(blank=True)
    visualizado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'analise_feedback'
        verbose_name = 'análise de feedback'
        verbose_name_plural = 'análises de feedback'
        indexes = [
            models.Index(fields=['status_analise']),
            models.Index(fields=['visualizado_em']),
        ]

    def __str__(self):
        return f'{self.feedback} - {self.get_status_analise_display()}'
