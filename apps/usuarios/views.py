from django.contrib import messages
from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import LoginView, PasswordChangeView, PasswordResetView
from django.db.models import Count
from django.db.models.deletion import ProtectedError
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse_lazy

from .decorators import admin_required
from .forms import CadastroAlunoForm, LoginForm, PerfilUpdateForm, UsuarioCreateForm, UsuarioUpdateForm
from .models import Administrador, Aluno, Usuario


class EntrarView(LoginView):
    template_name = 'login.html'
    authentication_form = LoginForm
    redirect_authenticated_user = True


def recuperar_senha(request):
    if request.method == 'POST':
        login = request.POST.get('login', '').strip().lower()
        nova_senha = request.POST.get('newPassword', '')
        confirmar = request.POST.get('confirmPassword', '')
        usuario = Usuario.objects.filter(email__iexact=login).first() or Usuario.objects.filter(matricula=login).first()
        if not usuario:
            messages.error(request, 'Usuário não encontrado.')
        elif len(nova_senha) < 8:
            messages.error(request, 'A nova senha deve possuir pelo menos 8 caracteres.')
        elif nova_senha != confirmar:
            messages.error(request, 'As senhas não coincidem.')
        else:
            usuario.set_password(nova_senha)
            usuario.save(update_fields=['password'])
            messages.success(request, 'Senha atualizada com sucesso. Faça login para continuar.')
            return redirect('usuarios:entrar')
    return render(request, 'recuperar-senha.html')


class AlterarSenhaView(PasswordChangeView):
    template_name = 'alterar-senha.html'
    success_url = reverse_lazy('usuarios:perfil')

    def form_valid(self, form):
        messages.success(self.request, 'Senha alterada com sucesso.')
        return super().form_valid(form)


def cadastro_publico(request):
    if request.method == 'POST':
        form = CadastroAlunoForm(request.POST)
        if form.is_valid():
            usuario = form.save()
            criar_perfil_por_tipo(usuario, {'curso': form.cleaned_data.get('curso') or 'Não informado'})
            messages.success(request, 'Cadastro realizado com sucesso. Faça login para continuar.')
            return redirect('usuarios:entrar')
    else:
        form = CadastroAlunoForm()
    return render(request, 'cadastro.html', {'form': form})


@login_required
def perfil(request):
    if request.method == 'POST' and request.POST.get('profile_action') == 'update_profile':
        perfil_form = PerfilUpdateForm(request.POST, instance=request.user)
        if perfil_form.is_valid():
            usuario = perfil_form.save()
            criar_perfil_por_tipo(usuario, perfil_form.cleaned_data)
            messages.success(request, 'Informações atualizadas com sucesso.')
            return redirect('usuarios:perfil')
        messages.error(request, 'Confira os dados informados e tente novamente.')
    else:
        perfil_form = PerfilUpdateForm(instance=request.user)

    feedbacks = []
    refeicoes = []
    if request.user.tipo_usuario == Usuario.TipoUsuario.ALUNO and hasattr(request.user, 'aluno'):
        feedbacks = request.user.aluno.feedbacks.select_related('refeicao').order_by('-criado_em')[:6]
    if request.user.tipo_usuario == Usuario.TipoUsuario.ADMIN and hasattr(request.user, 'administrador'):
        refeicoes = request.user.administrador.refeicoes_cadastradas.all().order_by('-criado_em')[:6]
    return render(request, 'perfil.html', {'feedbacks': feedbacks, 'refeicoes': refeicoes, 'perfil_form': perfil_form})


@login_required
def sair(request):
    logout(request)
    return redirect('usuarios:entrar')


@admin_required
def listar_usuarios(request):
    if request.method == 'POST':
        form = UsuarioCreateForm(request.POST)
        if form.is_valid():
            usuario = form.save()
            criar_perfil_por_tipo(usuario, form.cleaned_data)
            messages.success(request, 'Usuário cadastrado com sucesso.')
            return redirect('usuarios:listar')
    else:
        form = UsuarioCreateForm(initial={'is_active': True})

    busca = request.GET.get('q', '').strip()
    usuarios = Usuario.objects.all().order_by('nome')
    if busca:
        usuarios = usuarios.filter(nome__icontains=busca) | usuarios.filter(email__icontains=busca) | usuarios.filter(matricula__icontains=busca)
    resumo = {
        'total': Usuario.objects.count(),
        'alunos': Usuario.objects.filter(tipo_usuario='ALUNO').count(),
        'admins': Usuario.objects.filter(tipo_usuario='ADMIN').count(),
        'ativos': Usuario.objects.filter(is_active=True).count(),
    }
    return render(request, 'usuarios.html', {'usuarios': usuarios.distinct(), 'resumo': resumo, 'busca': busca, 'form': form})


@admin_required
def criar_usuario(request):
    if request.method == 'POST':
        form = UsuarioCreateForm(request.POST)
        if form.is_valid():
            usuario = form.save()
            criar_perfil_por_tipo(usuario, form.cleaned_data)
            messages.success(request, 'Usuário cadastrado com sucesso.')
            return redirect('usuarios:listar')
    else:
        form = UsuarioCreateForm(initial={'is_active': True})
    return render(request, 'usuarios_form.html', {'form': form, 'titulo': 'Cadastrar usuário'})


@admin_required
def editar_usuario(request, pk):
    usuario = get_object_or_404(Usuario, pk=pk)
    initial = {}
    if usuario.tipo_usuario == 'ALUNO' and hasattr(usuario, 'aluno'):
        initial['curso'] = usuario.aluno.curso
    if usuario.tipo_usuario == 'ADMIN' and hasattr(usuario, 'administrador'):
        initial['cargo'] = usuario.administrador.cargo
    if request.method == 'POST':
        form = UsuarioUpdateForm(request.POST, instance=usuario, initial=initial)
        if form.is_valid():
            usuario = form.save()
            criar_perfil_por_tipo(usuario, form.cleaned_data)
            messages.success(request, 'Usuário atualizado com sucesso.')
            return redirect('usuarios:listar')
    else:
        form = UsuarioUpdateForm(instance=usuario, initial=initial)
    return render(request, 'usuarios_form.html', {'form': form, 'titulo': 'Editar usuário', 'usuario_editado': usuario})


@admin_required
def alternar_status_usuario(request, pk):
    usuario = get_object_or_404(Usuario, pk=pk)
    if usuario == request.user:
        messages.error(request, 'Você não pode desativar a própria conta.')
        return redirect('usuarios:listar')
    usuario.is_active = not usuario.is_active
    usuario.save(update_fields=['is_active'])
    messages.success(request, 'Status do usuário alterado com sucesso.')
    return redirect('usuarios:listar')


@admin_required
def excluir_usuario(request, pk):
    usuario = get_object_or_404(Usuario, pk=pk)
    if usuario == request.user:
        messages.error(request, 'Você não pode excluir a própria conta.')
        return redirect('usuarios:listar')
    if request.method == 'POST':
        try:
            usuario.delete()
            messages.success(request, 'Usuário excluído com sucesso.')
        except ProtectedError:
            messages.error(request, 'Não foi possível excluir: este usuário possui dados vinculados. Desative a conta em vez de excluir.')
    return redirect('usuarios:listar')


def criar_perfil_por_tipo(usuario, dados):
    if usuario.tipo_usuario == 'ALUNO':
        Aluno.objects.update_or_create(usuario=usuario, defaults={'curso': dados.get('curso') or 'Não informado'})
        Administrador.objects.filter(usuario=usuario).delete()
    elif usuario.tipo_usuario == 'ADMIN':
        Administrador.objects.update_or_create(usuario=usuario, defaults={'cargo': dados.get('cargo') or 'Administrador'})
        Aluno.objects.filter(usuario=usuario).delete()
