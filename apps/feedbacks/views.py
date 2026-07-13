from datetime import timedelta
from django.contrib import messages
from django.db.models import Avg, Count
from django.db.models.functions import TruncDate
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone

from apps.refeicoes.models import Refeicao
from apps.usuarios.decorators import admin_required, aluno_required

from .forms import FeedbackForm
from .models import AnaliseFeedback, Feedback


@aluno_required
def avaliar(request):
    refeicao_id = request.GET.get('refeicao') or request.GET.get('mealId') or request.POST.get('refeicao_id')
    refeicao = None
    if refeicao_id:
        refeicao = get_object_or_404(Refeicao.objects.prefetch_related('itens'), pk=refeicao_id, status=Refeicao.Status.PUBLICADO)

    if request.method == 'POST':
        if not refeicao:
            messages.error(request, 'Selecione uma refeição publicada para avaliar.')
            return redirect('feedbacks:avaliar')
        form = FeedbackForm(request.POST)
        if form.is_valid():
            if Feedback.objects.filter(aluno=request.user.aluno, refeicao=refeicao).exists():
                messages.error(request, 'Você já avaliou esta refeição.')
                return redirect('refeicoes:detalhe', pk=refeicao.pk)
            feedback = form.save(commit=False)
            feedback.aluno = request.user.aluno
            feedback.refeicao = refeicao
            feedback.save()
            messages.success(request, 'Feedback enviado com sucesso. Obrigado pela contribuição!')
            return redirect('refeicoes:detalhe', pk=refeicao.pk)
    else:
        form = FeedbackForm(initial={'nota': 5, 'sabor': 5, 'temperatura': 5, 'quantidade': 5, 'variedade': 5})

    refeicoes = Refeicao.objects.filter(status=Refeicao.Status.PUBLICADO).prefetch_related('itens').order_by('-data_refeicao', '-horario_inicio')
    return render(request, 'avaliacao.html', {'form': form, 'refeicao': refeicao, 'refeicoes': refeicoes})


@admin_required
def analise(request):
    feedbacks = Feedback.objects.select_related('aluno__usuario', 'refeicao').prefetch_related('refeicao__itens').order_by('-criado_em')
    refeicao_id = request.GET.get('refeicao', 'todas')
    periodo = request.GET.get('periodo', 'todos')
    nota_minima = request.GET.get('nota', '0')

    if refeicao_id != 'todas' and refeicao_id.isdigit():
        feedbacks = feedbacks.filter(refeicao_id=int(refeicao_id))
    if periodo in ['7', '30']:
        feedbacks = feedbacks.filter(criado_em__gte=timezone.now() - timedelta(days=int(periodo)))
    if nota_minima.isdigit() and int(nota_minima) > 0:
        feedbacks = feedbacks.filter(nota__gte=int(nota_minima))

    total = feedbacks.count()
    medias = feedbacks.aggregate(
        media=Avg('nota'), sabor=Avg('sabor'), temperatura=Avg('temperatura'), quantidade=Avg('quantidade'), variedade=Avg('variedade')
    )
    por_refeicao = list(
        feedbacks.values('refeicao__id', 'refeicao__tipo', 'refeicao__data_refeicao')
        .annotate(media=Avg('nota'), total=Count('id'))
        .order_by('-media', '-total')
    )
    melhor = por_refeicao[0] if por_refeicao else None
    pior = sorted(por_refeicao, key=lambda x: (x['media'] or 0, -x['total']))[0] if por_refeicao else None
    distribuicao = []
    for n in range(5, 0, -1):
        count = feedbacks.filter(nota=n).count()
        percent = round((count / total) * 100) if total else 0
        distribuicao.append({'nota': n, 'total': count, 'percent': percent})
    refeicoes = Refeicao.objects.all().order_by('-data_refeicao')

    return render(request, 'analise-feedbacks.html', {
        'feedbacks': feedbacks,
        'refeicoes': refeicoes,
        'total_feedbacks': total,
        'medias': medias,
        'por_refeicao': por_refeicao,
        'melhor': melhor,
        'pior': pior,
        'distribuicao': distribuicao,
        'filtros': {'refeicao': refeicao_id, 'periodo': periodo, 'nota': nota_minima},
    })


@admin_required
def relatorios(request):
    feedbacks = Feedback.objects.select_related('refeicao')
    refeicao_id = request.GET.get('refeicao', 'todas')
    periodo = request.GET.get('periodo', 'todos')

    if refeicao_id != 'todas' and refeicao_id.isdigit():
        feedbacks = feedbacks.filter(refeicao_id=int(refeicao_id))

    periodos_validos = {'7', '30', '90'}
    if periodo in periodos_validos:
        feedbacks = feedbacks.filter(
            criado_em__gte=timezone.now() - timedelta(days=int(periodo))
        )
    else:
        periodo = 'todos'

    total = feedbacks.count()
    medias = feedbacks.aggregate(
        geral=Avg('nota'),
        sabor=Avg('sabor'),
        temperatura=Avg('temperatura'),
        quantidade=Avg('quantidade'),
        variedade=Avg('variedade'),
    )

    satisfatorios = feedbacks.filter(nota__gte=4).count()
    satisfacao = round((satisfatorios / total) * 100) if total else 0
    com_comentario = feedbacks.exclude(comentario='').count()

    distribuicao = [feedbacks.filter(nota=nota).count() for nota in range(1, 6)]

    tipos_refeicao = dict(Refeicao.Tipo.choices)
    agrupados_por_tipo = {
        item['refeicao__tipo']: item
        for item in feedbacks.values('refeicao__tipo')
        .annotate(total=Count('id'), media=Avg('nota'))
    }
    refeicoes_labels = []
    refeicoes_totais = []
    refeicoes_medias = []
    for codigo, rotulo in Refeicao.Tipo.choices:
        item = agrupados_por_tipo.get(codigo, {})
        refeicoes_labels.append(rotulo)
        refeicoes_totais.append(item.get('total', 0))
        refeicoes_medias.append(round(item.get('media') or 0, 2))

    por_data = list(
        feedbacks.annotate(dia=TruncDate('criado_em'))
        .values('dia')
        .annotate(media=Avg('nota'), total=Count('id'))
        .order_by('dia')
    )

    status_labels = ['Sem análise', 'Visualizado', 'Em análise', 'Resolvido', 'Ignorado']
    status_valores = [
        feedbacks.filter(analise__isnull=True).count(),
        feedbacks.filter(analise__status_analise=AnaliseFeedback.StatusAnalise.VISUALIZADO).count(),
        feedbacks.filter(analise__status_analise=AnaliseFeedback.StatusAnalise.EM_ANALISE).count(),
        feedbacks.filter(analise__status_analise=AnaliseFeedback.StatusAnalise.RESOLVIDO).count(),
        feedbacks.filter(analise__status_analise=AnaliseFeedback.StatusAnalise.IGNORADO).count(),
    ]

    ranking = list(
        feedbacks.values(
            'refeicao_id',
            'refeicao__tipo',
            'refeicao__data_refeicao',
        )
        .annotate(media=Avg('nota'), total=Count('id'))
        .order_by('-media', '-total', '-refeicao__data_refeicao')[:8]
    )
    for item in ranking:
        item['tipo_label'] = tipos_refeicao.get(item['refeicao__tipo'], 'Refeição')

    chart_data = {
        'total': total,
        'distribuicao': distribuicao,
        'categorias': [
            round(medias['geral'] or 0, 2),
            round(medias['sabor'] or 0, 2),
            round(medias['temperatura'] or 0, 2),
            round(medias['quantidade'] or 0, 2),
            round(medias['variedade'] or 0, 2),
        ],
        'refeicoesLabels': refeicoes_labels,
        'refeicoesTotais': refeicoes_totais,
        'refeicoesMedias': refeicoes_medias,
        'timelineLabels': [
            item['dia'].strftime('%d/%m/%Y')
            for item in por_data
            if item['dia']
        ],
        'timelineMedias': [
            round(item['media'] or 0, 2)
            for item in por_data
            if item['dia']
        ],
        'timelineTotais': [
            item['total']
            for item in por_data
            if item['dia']
        ],
        'statusLabels': status_labels,
        'statusValores': status_valores,
    }

    return render(request, 'relatorios-feedbacks.html', {
        'total_feedbacks': total,
        'medias': medias,
        'satisfacao': satisfacao,
        'com_comentario': com_comentario,
        'ranking': ranking,
        'refeicoes': Refeicao.objects.all().order_by('-data_refeicao', 'tipo'),
        'filtros': {
            'refeicao': refeicao_id,
            'periodo': periodo,
        },
        'chart_data': chart_data,
    })


@admin_required
def marcar_analise(request, pk):
    feedback = get_object_or_404(Feedback, pk=pk)
    analise, _ = AnaliseFeedback.objects.get_or_create(
        feedback=feedback,
        defaults={'administrador': request.user.administrador}
    )
    if request.method == 'POST':
        analise.status_analise = request.POST.get('status_analise', analise.status_analise)
        analise.observacao_admin = request.POST.get('observacao_admin', analise.observacao_admin)
        analise.administrador = request.user.administrador
        analise.save()
        messages.success(request, 'Análise atualizada com sucesso.')
    return redirect('feedbacks:analise')
