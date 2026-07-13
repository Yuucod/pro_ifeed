from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect


def admin_required(view_func):
    @login_required
    def wrapper(request, *args, **kwargs):
        if getattr(request.user, 'tipo_usuario', None) != 'ADMIN':
            messages.error(request, 'Acesso permitido apenas para administradores.')
            return redirect('dashboard')
        return view_func(request, *args, **kwargs)
    return wrapper


def aluno_required(view_func):
    @login_required
    def wrapper(request, *args, **kwargs):
        if getattr(request.user, 'tipo_usuario', None) != 'ALUNO':
            messages.error(request, 'Acesso permitido apenas para alunos.')
            return redirect('dashboard')
        return view_func(request, *args, **kwargs)
    return wrapper
