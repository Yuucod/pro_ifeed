from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.usuarios.models import Administrador, Aluno, Usuario
from apps.refeicoes.models import ItemRefeicao, Refeicao


class Command(BaseCommand):
    help = 'Cria usuários e uma refeição de exemplo para testar o IFEED.'

    def handle(self, *args, **options):
        admin, _ = Usuario.objects.get_or_create(
            email='admin@ifrn.edu.br',
            defaults={
                'nome': 'Administrador IFEED',
                'matricula': 'ADM001',
                'tipo_usuario': Usuario.TipoUsuario.ADMIN,
                'is_staff': True,
                'is_active': True,
            }
        )
        admin.tipo_usuario = Usuario.TipoUsuario.ADMIN
        admin.is_staff = True
        admin.is_active = True
        admin.set_password('admin12345')
        admin.save()
        adm_profile, _ = Administrador.objects.get_or_create(usuario=admin, defaults={'cargo': 'Gestão do Refeitório'})

        aluno, _ = Usuario.objects.get_or_create(
            email='aluno@ifrn.edu.br',
            defaults={
                'nome': 'Aluno Teste',
                'matricula': '20260001',
                'tipo_usuario': Usuario.TipoUsuario.ALUNO,
                'is_active': True,
            }
        )
        aluno.tipo_usuario = Usuario.TipoUsuario.ALUNO
        aluno.is_staff = False
        aluno.is_active = True
        aluno.set_password('aluno12345')
        aluno.save()
        Aluno.objects.get_or_create(usuario=aluno, defaults={'curso': 'TSI'})

        refeicao, created = Refeicao.objects.get_or_create(
            tipo=Refeicao.Tipo.ALMOCO,
            data_refeicao=timezone.localdate(),
            defaults={
                'turno': Refeicao.Turno.VESPERTINO,
                'campus': 'IFRN Campus Canguaretama',
                'horario_inicio': '11:30',
                'horario_fim': '13:00',
                'status': Refeicao.Status.PUBLICADO,
                'administrador': adm_profile,
                'observacoes': 'Refeição de exemplo para teste do sistema.',
            }
        )
        if created:
            itens = [
                ('PRATO_PRINCIPAL', 'Frango ao molho'),
                ('ACOMPANHAMENTO', 'Arroz branco'),
                ('ACOMPANHAMENTO', 'Feijão carioca'),
                ('SALADA', 'Salada de alface e tomate'),
                ('BEBIDA', 'Suco natural'),
            ]
            for ordem, (tipo_item, nome) in enumerate(itens, start=1):
                ItemRefeicao.objects.create(refeicao=refeicao, tipo_item=tipo_item, nome=nome, ordem=ordem)

        self.stdout.write(self.style.SUCCESS('Dados de teste criados/atualizados.'))
        self.stdout.write('Admin: admin@ifrn.edu.br / admin12345')
        self.stdout.write('Aluno: aluno@ifrn.edu.br / aluno12345')
