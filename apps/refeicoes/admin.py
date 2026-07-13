from django.contrib import admin

from .models import ItemRefeicao, Refeicao


class ItemRefeicaoInline(admin.TabularInline):
    model = ItemRefeicao
    extra = 1


@admin.register(Refeicao)
class RefeicaoAdmin(admin.ModelAdmin):
    list_display = ('tipo', 'data_refeicao', 'turno', 'status', 'horario_inicio', 'horario_fim')
    list_filter = ('tipo', 'turno', 'status', 'data_refeicao')
    search_fields = ('campus', 'observacoes', 'itens__nome')
    inlines = [ItemRefeicaoInline]


@admin.register(ItemRefeicao)
class ItemRefeicaoAdmin(admin.ModelAdmin):
    list_display = ('refeicao', 'tipo_item', 'nome', 'ordem')
    list_filter = ('tipo_item',)
    search_fields = ('nome',)
