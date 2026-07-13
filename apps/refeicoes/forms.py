from django import forms

from .models import Refeicao


class RefeicaoForm(forms.ModelForm):
    prato_principal = forms.CharField(max_length=150, required=False, label='Prato principal')
    acompanhamentos = forms.CharField(required=False, label='Acompanhamentos', help_text='Digite um item por linha.', widget=forms.Textarea(attrs={'rows': 4}))
    saladas = forms.CharField(required=False, label='Saladas', help_text='Digite um item por linha.', widget=forms.Textarea(attrs={'rows': 3}))
    bebidas = forms.CharField(required=False, label='Bebidas', help_text='Digite um item por linha.', widget=forms.Textarea(attrs={'rows': 3}))

    class Meta:
        model = Refeicao
        fields = ['tipo', 'data_refeicao', 'turno', 'campus', 'horario_inicio', 'horario_fim', 'observacoes', 'status']
        widgets = {
            'data_refeicao': forms.DateInput(attrs={'type': 'date'}),
            'horario_inicio': forms.TimeInput(attrs={'type': 'time'}),
            'horario_fim': forms.TimeInput(attrs={'type': 'time'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['campus'].initial = self.fields['campus'].initial or 'IFRN Campus Canguaretama'
        instance = kwargs.get('instance')
        if instance and instance.pk:
            self.fields['prato_principal'].initial = '\n'.join(instance.itens.filter(tipo_item='PRATO_PRINCIPAL').values_list('nome', flat=True))
            self.fields['acompanhamentos'].initial = '\n'.join(instance.itens.filter(tipo_item='ACOMPANHAMENTO').values_list('nome', flat=True))
            self.fields['saladas'].initial = '\n'.join(instance.itens.filter(tipo_item='SALADA').values_list('nome', flat=True))
            self.fields['bebidas'].initial = '\n'.join(instance.itens.filter(tipo_item='BEBIDA').values_list('nome', flat=True))

    def clean(self):
        cleaned = super().clean()
        inicio = cleaned.get('horario_inicio')
        fim = cleaned.get('horario_fim')
        if inicio and fim and inicio >= fim:
            raise forms.ValidationError('O horário final deve ser maior que o horário inicial.')
        return cleaned
