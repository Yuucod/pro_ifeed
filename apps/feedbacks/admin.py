from django.contrib import admin

from .models import AnaliseFeedback, Feedback


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('aluno', 'refeicao', 'nota', 'sabor', 'temperatura', 'quantidade', 'variedade', 'criado_em')
    list_filter = ('nota', 'sabor', 'temperatura', 'quantidade', 'variedade', 'criado_em')
    search_fields = ('aluno__usuario__nome', 'aluno__usuario__matricula', 'comentario', 'sugestao')


@admin.register(AnaliseFeedback)
class AnaliseFeedbackAdmin(admin.ModelAdmin):
    list_display = ('feedback', 'administrador', 'status_analise', 'visualizado_em')
    list_filter = ('status_analise', 'visualizado_em')
    search_fields = ('feedback__comentario', 'observacao_admin')
