from datetime import date, time

from django.test import TestCase
from django.urls import reverse

from apps.refeicoes.models import Refeicao
from apps.usuarios.models import Administrador, Aluno, Usuario

from .models import AnaliseFeedback, Feedback


class RelatoriosFeedbackTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin_user = Usuario.objects.create_user(
            email='gestao@ifrn.edu.br',
            nome='Gestão do Refeitório',
            matricula='ADM-TESTE',
            tipo_usuario=Usuario.TipoUsuario.ADMIN,
            password='senha-teste-123',
        )
        cls.admin = Administrador.objects.create(
            usuario=cls.admin_user,
            cargo='Gestão',
        )

        cls.aluno_user = Usuario.objects.create_user(
            email='aluno.teste@ifrn.edu.br',
            nome='Aluno de Teste',
            matricula='20260002',
            tipo_usuario=Usuario.TipoUsuario.ALUNO,
            password='senha-teste-123',
        )
        cls.aluno = Aluno.objects.create(
            usuario=cls.aluno_user,
            curso='Informática',
        )

        cls.refeicao = Refeicao.objects.create(
            tipo=Refeicao.Tipo.ALMOCO,
            data_refeicao=date(2026, 7, 13),
            turno=Refeicao.Turno.VESPERTINO,
            horario_inicio=time(11, 30),
            horario_fim=time(13, 0),
            status=Refeicao.Status.PUBLICADO,
            administrador=cls.admin,
        )
        cls.feedback = Feedback.objects.create(
            aluno=cls.aluno,
            refeicao=cls.refeicao,
            nota=5,
            sabor=5,
            temperatura=4,
            quantidade=4,
            variedade=5,
            comentario='Refeição muito boa.',
        )
        AnaliseFeedback.objects.create(
            feedback=cls.feedback,
            administrador=cls.admin,
            status_analise=AnaliseFeedback.StatusAnalise.RESOLVIDO,
        )

    def test_administrador_acessa_relatorios(self):
        self.client.force_login(self.admin_user)

        response = self.client.get(reverse('feedbacks:relatorios'))

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'relatorios-feedbacks.html')
        self.assertContains(response, 'Relatórios e gráficos de feedback')

    def test_aluno_nao_acessa_relatorios(self):
        self.client.force_login(self.aluno_user)

        response = self.client.get(reverse('feedbacks:relatorios'))

        self.assertRedirects(response, reverse('dashboard'))

    def test_relatorio_gera_dados_dos_graficos(self):
        self.client.force_login(self.admin_user)

        response = self.client.get(
            reverse('feedbacks:relatorios'),
            {'refeicao': self.refeicao.pk, 'periodo': 'todos'},
        )

        chart_data = response.context['chart_data']
        self.assertEqual(chart_data['total'], 1)
        self.assertEqual(chart_data['distribuicao'], [0, 0, 0, 0, 1])
        self.assertEqual(chart_data['categorias'], [5.0, 5.0, 4.0, 4.0, 5.0])
        self.assertEqual(chart_data['statusValores'], [0, 0, 0, 1, 0])
