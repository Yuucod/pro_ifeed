from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.auth.decorators import login_required
from django.db.models import Avg, Count
from django.shortcuts import redirect, render
from django.urls import include, path

from apps.feedbacks.models import Feedback
from apps.refeicoes.models import Refeicao
from apps.usuarios.models import Usuario


def home(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
    return render(request, 'index.html')


@login_required
def dashboard(request):
    refeicoes_publicadas = Refeicao.objects.filter(status=Refeicao.Status.PUBLICADO).prefetch_related('itens')
    feedbacks = Feedback.objects.select_related('aluno__usuario', 'refeicao').order_by('-criado_em')
    hoje = None
    try:
        from django.utils import timezone
        hoje = timezone.localdate()
    except Exception:
        pass
    refeicao_destaque = refeicoes_publicadas.filter(data_refeicao=hoje).first() if hoje else None
    if not refeicao_destaque:
        refeicao_destaque = refeicoes_publicadas.order_by('-data_refeicao').first()

    total_feedbacks = feedbacks.count()
    media_geral = feedbacks.aggregate(media=Avg('nota'))['media']
    distribuicao = []
    for n in range(5, 0, -1):
        count = feedbacks.filter(nota=n).count()
        percent = round((count / total_feedbacks) * 100) if total_feedbacks else 0
        distribuicao.append({'nota': n, 'total': count, 'percent': percent})
    satisfacao = round((feedbacks.filter(nota__gte=4).count() / total_feedbacks) * 100) if total_feedbacks else 0

    contexto = {
        'refeicao_destaque': refeicao_destaque,
        'total_refeicoes': refeicoes_publicadas.count(),
        'total_feedbacks': total_feedbacks,
        'media_geral': media_geral,
        'satisfacao': satisfacao,
        'feedbacks_recentes': feedbacks[:5],
        'distribuicao': distribuicao,
        'total_usuarios': Usuario.objects.count(),
    }
    if request.user.tipo_usuario == Usuario.TipoUsuario.ALUNO and hasattr(request.user, 'aluno'):
        meus_feedbacks = feedbacks.filter(aluno=request.user.aluno)
        contexto['meus_feedbacks'] = meus_feedbacks[:5]
        contexto['minhas_avaliacoes'] = meus_feedbacks.count()
    return render(request, 'dashboard.html', contexto)


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', home, name='home'),
    path('dashboard/', dashboard, name='dashboard'),
    path('login/', lambda request: redirect('usuarios:entrar'), name='login_alias'),
    path('login.html', lambda request: redirect('usuarios:entrar')),
    path('cadastro.html', lambda request: redirect('usuarios:cadastro_publico')),
    path('dashboard.html', lambda request: redirect('dashboard')),
    path('perfil.html', lambda request: redirect('usuarios:perfil')),
    path('cardapio.html', lambda request: redirect('refeicoes:cardapio')),
    path('avaliacao.html', lambda request: redirect('feedbacks:avaliar')),
    path('cadastro-refeicao.html', lambda request: redirect('refeicoes:cadastrar')),
    path('analise-feedbacks.html', lambda request: redirect('feedbacks:analise')),
    path('relatorios.html', lambda request: redirect('feedbacks:relatorios')),
    path('relatorios/', lambda request: redirect('feedbacks:relatorios'), name='relatorios_alias'),
    path('usuarios.html', lambda request: redirect('usuarios:listar')),
    path('recuperar-senha.html', lambda request: redirect('usuarios:recuperar_senha')),
    path('cadastro/', lambda request: redirect('usuarios:cadastro_publico'), name='cadastro_alias'),
    path('perfil/', lambda request: redirect('usuarios:perfil'), name='perfil_alias'),
    path('cardapio/', lambda request: redirect('refeicoes:cardapio'), name='cardapio_alias'),
    path('avaliacao/', lambda request: redirect('feedbacks:avaliar'), name='avaliacao_alias'),
    path('usuarios/', include('apps.usuarios.urls')),
    path('auth/', include('django.contrib.auth.urls')),
    path('refeicoes/', include('apps.refeicoes.urls')),
    path('feedbacks/', include('apps.feedbacks.urls')),
]


if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.BASE_DIR / 'static')
