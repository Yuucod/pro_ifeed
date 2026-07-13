from django.urls import path

from . import views

app_name = 'refeicoes'

urlpatterns = [
    path('cardapio/', views.cardapio, name='cardapio'),
    path('cadastrar/', views.cadastrar_refeicao, name='cadastrar'),
    path('<int:pk>/', views.detalhe_refeicao, name='detalhe'),
    path('<int:pk>/editar/', views.editar_refeicao, name='editar'),
    path('<int:pk>/excluir/', views.excluir_refeicao, name='excluir'),
]
