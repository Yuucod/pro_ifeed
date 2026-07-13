from datetime import timedelta
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Avg, Count, Q
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone

from apps.usuarios.decorators import admin_required

from .forms import RefeicaoForm
from .models import ItemRefeicao, Refeicao


def _split_items(text):
    return [linha.strip() for linha in (text or '').splitlines() if linha.strip()]


def _save_items(refeicao, form):
    ItemRefeicao.objects.filter(refeicao=refeicao).delete()
    groups = [
        ('PRATO_PRINCIPAL', _split_items(form.cleaned_data.get('prato_principal'))),
        ('ACOMPANHAMENTO', _split_items(form.cleaned_data.get('acompanhamentos'))),
        ('SALADA', _split_items(form.cleaned_data.get('saladas'))),
        ('BEBIDA', _split_items(form.cleaned_data.get('bebidas'))),
    ]
    order = 1
    for tipo, itens in groups:
        for nome in itens:
            ItemRefeicao.objects.create(refeicao=refeicao, tipo_item=tipo, nome=nome, ordem=order)
            order += 1


@login_required
def cardapio(request):
    refeicoes = Refeicao.objects.filter(status=Refeicao.Status.PUBLICADO).prefetch_related('itens').order_by('data_refeicao', 'horario_inicio')
    tipo = request.GET.get('tipo', 'todos')
    periodo = request.GET.get('periodo', 'todos')
    if tipo in ['A', 'J', 'L']:
        refeicoes = refeicoes.filter(tipo=tipo)
    hoje = timezone.localdate()
    if periodo == 'hoje':
        refeicoes = refeicoes.filter(data_refeicao=hoje)
    elif periodo == 'semana':
        limite = hoje + timedelta(days=6)
        refeicoes = refeicoes.filter(data_refeicao__range=(hoje, limite))
    return render(request, 'cardapio.html', {'refeicoes': refeicoes, 'tipo_atual': tipo, 'periodo_atual': periodo})


@login_required
def detalhe_refeicao(request, pk):
    refeicao = get_object_or_404(Refeicao.objects.prefetch_related('itens', 'feedbacks'), pk=pk)
    estatisticas = refeicao.feedbacks.aggregate(media=Avg('nota'), total=Count('id'))
    ja_avaliou = False
    if request.user.is_authenticated and request.user.tipo_usuario == 'ALUNO' and hasattr(request.user, 'aluno'):
        ja_avaliou = refeicao.feedbacks.filter(aluno=request.user.aluno).exists()
    return render(request, 'detalhe-refeicao.html', {'refeicao': refeicao, 'estatisticas': estatisticas, 'ja_avaliou': ja_avaliou})


@admin_required
def cadastrar_refeicao(request):
    if request.method == 'POST':
        form = RefeicaoForm(request.POST)
        if form.is_valid():
            refeicao = form.save(commit=False)
            if hasattr(request.user, 'administrador'):
                refeicao.administrador = request.user.administrador
            refeicao.save()
            _save_items(refeicao, form)
            messages.success(request, 'Refeição cadastrada com sucesso.')
            return redirect('refeicoes:detalhe', pk=refeicao.pk)
    else:
        form = RefeicaoForm(initial={'campus': 'IFRN Campus Canguaretama', 'status': Refeicao.Status.PUBLICADO})
    refeicoes = Refeicao.objects.prefetch_related('itens').order_by('-data_refeicao', '-criado_em')[:20]
    return render(request, 'cadastro-refeicao.html', {'form': form, 'refeicoes': refeicoes, 'titulo': 'Cadastrar refeição'})


@admin_required
def editar_refeicao(request, pk):
    refeicao = get_object_or_404(Refeicao.objects.prefetch_related('itens'), pk=pk)
    if request.method == 'POST':
        form = RefeicaoForm(request.POST, instance=refeicao)
        if form.is_valid():
            refeicao = form.save()
            _save_items(refeicao, form)
            messages.success(request, 'Refeição atualizada com sucesso.')
            return redirect('refeicoes:detalhe', pk=refeicao.pk)
    else:
        form = RefeicaoForm(instance=refeicao)
    refeicoes = Refeicao.objects.prefetch_related('itens').order_by('-data_refeicao', '-criado_em')[:20]
    return render(request, 'cadastro-refeicao.html', {'form': form, 'refeicao': refeicao, 'refeicoes': refeicoes, 'titulo': 'Editar refeição'})


@admin_required
def excluir_refeicao(request, pk):
    refeicao = get_object_or_404(Refeicao, pk=pk)
    if request.method == 'POST':
        refeicao.delete()
        messages.success(request, 'Refeição excluída com sucesso.')
        return redirect('refeicoes:cadastrar')
    messages.error(request, 'Exclusão precisa ser confirmada pelo formulário.')
    return redirect('refeicoes:detalhe', pk=pk)
