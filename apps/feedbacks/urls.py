from django.urls import path

from . import views

app_name = 'feedbacks'

urlpatterns = [
    path('avaliar/', views.avaliar, name='avaliar'),
    path('analise/', views.analise, name='analise'),
    path('relatorios/', views.relatorios, name='relatorios'),
    path('<int:pk>/marcar-analise/', views.marcar_analise, name='marcar_analise'),
]
