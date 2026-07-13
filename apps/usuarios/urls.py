from django.urls import path

from . import views

app_name = 'usuarios'

urlpatterns = [
    path('entrar/', views.EntrarView.as_view(), name='entrar'),
    path('cadastro/', views.cadastro_publico, name='cadastro_publico'),
    path('sair/', views.sair, name='sair'),
    path('perfil/', views.perfil, name='perfil'),
    path('recuperar-senha/', views.recuperar_senha, name='recuperar_senha'),
    path('alterar-senha/', views.AlterarSenhaView.as_view(), name='alterar_senha'),
    path('', views.listar_usuarios, name='listar'),
    path('novo/', views.criar_usuario, name='criar'),
    path('<int:pk>/editar/', views.editar_usuario, name='editar'),
    path('<int:pk>/status/', views.alternar_status_usuario, name='alternar_status'),
    path('<int:pk>/excluir/', views.excluir_usuario, name='excluir'),
]
