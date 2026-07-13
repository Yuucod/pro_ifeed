from django import forms

from .models import AnaliseFeedback, Feedback

RATING_CHOICES = [(1, '1 - Muito ruim'), (2, '2 - Ruim'), (3, '3 - Regular'), (4, '4 - Boa'), (5, '5 - Excelente')]


class FeedbackForm(forms.ModelForm):
    class Meta:
        model = Feedback
        fields = ['nota', 'sabor', 'temperatura', 'quantidade', 'variedade', 'comentario', 'sugestao']
        widgets = {
            'nota': forms.Select(choices=RATING_CHOICES),
            'sabor': forms.Select(choices=RATING_CHOICES),
            'temperatura': forms.Select(choices=RATING_CHOICES),
            'quantidade': forms.Select(choices=RATING_CHOICES),
            'variedade': forms.Select(choices=RATING_CHOICES),
            'comentario': forms.Textarea(attrs={'rows': 4, 'placeholder': 'Conte como foi sua experiência.'}),
            'sugestao': forms.Textarea(attrs={'rows': 3, 'placeholder': 'Deixe uma sugestão de melhoria.'}),
        }
        labels = {
            'nota': 'Nota geral',
            'sabor': 'Sabor',
            'temperatura': 'Temperatura',
            'quantidade': 'Quantidade',
            'variedade': 'Variedade',
        }


class AnaliseFeedbackForm(forms.ModelForm):
    class Meta:
        model = AnaliseFeedback
        fields = ['status_analise', 'observacao_admin']
        widgets = {'observacao_admin': forms.Textarea(attrs={'rows': 4})}
