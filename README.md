<p align="center">
</p>

<h1 align="center">IFEED - Sistema Institucional de Feedback Alimentar</h1>

<p align="center">
  Sistema web para avaliação, acompanhamento e gestão da alimentação estudantil do IFRN Campus Canguaretama.
</p>

---

## Sobre o Projeto

O **ProIFEED** é um sistema web desenvolvido para coletar, organizar e analisar os feedbacks dos estudantes sobre as refeições oferecidas no refeitório escolar.

A plataforma aproxima os alunos da gestão alimentar: os estudantes consultam o cardápio e avaliam as refeições, enquanto os administradores cadastram refeições, gerenciam usuários, acompanham comentários e analisam os resultados por meio de indicadores, rankings e gráficos interativos.

As avaliações deixam de ser apenas opiniões isoladas e passam a formar uma base de dados útil para identificar a aceitação das refeições e apoiar melhorias no serviço de alimentação.

---

## Desenvolvedores

| Nome | GitHub |
| :--- | :--- |
| Francislayne Nobre | [@fraan-dev](https://github.com/fraan-dev) |
| Maria Lara | [@larasantana-22](https://github.com/larasantana-22) |
| Vitoria Beniz | [@vbeenizv](https://github.com/vbeenizv) |
| Yuri Souza | [@yuuricode](https://github.com/yuuricode) |


---

### Área Pública

- Página inicial institucional.
- Login e cadastro de aluno.
- Recuperação de senha.

### Usuário Aluno

- Acesso ao painel do aluno.
- Consulta ao cardápio publicado.
- Visualização dos detalhes de cada refeição.
- Avaliação com nota geral e critérios específicos.
- Envio de comentário e sugestão.
- Histórico de avaliações.
- Consulta e atualização do perfil.

### Usuário Administrador

- Dashboard administrativo.
- Cadastro, edição, publicação e exclusão de refeições.
- Gerenciamento de usuários.
- Visualização dos feedbacks enviados pelos alunos.
- Registro do status de análise de cada feedback.
- Filtros por refeição, período e nota.
- Indicadores de total de feedbacks, média geral e satisfação.
- Gráfico de distribuição das notas.
- Gráfico de médias por critério.
- Comparativo por tipo de refeição.
- Gráfico de evolução temporal.
- Gráfico de acompanhamento do status das análises.
- Ranking das refeições mais bem avaliadas.
- Impressão do relatório administrativo.

---

## Tecnologias Utilizadas

| Tecnologia | Uso no Projeto |
| :--- | :--- |
| **Python** | Linguagem principal do backend. |
| **Django** | Rotas, views, models, autenticação, permissões e templates. |
| **SQLite / MySQL** | Armazenamento dos dados do sistema. |
| **HTML5** | Estrutura das páginas. |
| **CSS3** | Estilização e responsividade. |
| **JavaScript** | Interatividade e configuração dos gráficos. |
| **Chart.js** | Geração dos gráficos administrativos. |

---

## Estrutura do Projeto

```text
pro_ifeed-main/
├── README.md
├── CONTRIBUICAO_COLABORADORA.md
├── .gitignore
└── pro_ifeed/
    ├── apps/
    │   ├── feedbacks/
    │   │   ├── models.py
    │   │   ├── views.py
    │   │   ├── urls.py
    │   │   └── tests.py
    │   ├── refeicoes/
    │   └── usuarios/
    ├── pro_ifeed/
    │   ├── settings.py
    │   ├── urls.py
    │   ├── asgi.py
    │   └── wsgi.py
    ├── templates/
    │   ├── dashboard.html
    │   ├── analise-feedbacks.html
    │   ├── relatorios-feedbacks.html
    │   └── partials/
    ├── static/
    │   ├── estilos/
    │   │   └── relatorios-feedbacks.css
    │   ├── scripts/
    │   │   └── relatorios-feedbacks.js
    │   └── img/
    ├── database/
    ├── manage.py
    ├── requirements.txt
    └── db.sqlite3
```

---

## Models Principais

| Model | Função |
| :--- | :--- |
| `Usuario` | Usuário personalizado com nome, e-mail, matrícula e tipo de acesso. |
| `Aluno` | Perfil acadêmico vinculado ao usuário aluno. |
| `Administrador` | Perfil administrativo vinculado ao usuário administrador. |
| `Refeicao` | Refeição cadastrada com tipo, data, turno, horário e status. |
| `ItemRefeicao` | Itens que compõem uma refeição. |
| `Feedback` | Nota geral, critérios, comentário e sugestão enviados pelo aluno. |
| `AnaliseFeedback` | Status e observação administrativa relacionados a um feedback. |

---

## Como Executar Localmente

Abra o terminal dentro da pasta `pro_ifeed`, onde está o arquivo `manage.py`.

### Windows

Crie o ambiente virtual:

```bash
python -m venv venv
```

Ative o ambiente virtual:

```bash
venv\Scripts\activate
```

Instale as dependências:

```bash
pip install -r requirements.txt
```

Execute as migrações:

```bash
python manage.py migrate
```

Crie ou atualize os dados de teste:

```bash
python manage.py seed_ifeed
```

Inicie o servidor:

```bash
python manage.py runserver
```

### Linux

Crie e ative o ambiente virtual:

```bash
python3 -m venv venv
source venv/bin/activate
```

Instale as dependências e prepare o banco:

```bash
pip install -r requirements.txt
python3 manage.py migrate
python3 manage.py seed_ifeed
```

Inicie o servidor:

```bash
python3 manage.py runserver
```

Acesse:

```text
http://127.0.0.1:8000/
```

Para encerrar o servidor, pressione `Ctrl + C`.

---

## Executar os Testes

```bash
python manage.py test
```

Os testes verificam o acesso administrativo à página de relatórios, a proteção contra acesso de alunos e a geração dos dados utilizados pelos gráficos.

---

## Rotas Principais

| Página | Rota |
| :--- | :--- |
| Página inicial | `/` |
| Login | `/usuarios/entrar/` |
| Cadastro | `/usuarios/cadastro/` |
| Dashboard | `/dashboard/` |
| Perfil | `/usuarios/perfil/` |
| Cardápio | `/refeicoes/cardapio/` |
| Avaliação | `/feedbacks/avaliar/` |
| Cadastro de refeição | `/refeicoes/cadastrar/` |
| Análise de feedbacks | `/feedbacks/analise/` |
| Relatórios e gráficos | `/feedbacks/relatorios/` |
| Gerenciamento de usuários | `/usuarios/listar/` |
| Administração do Django | `/admin/` |

---

## Acesso de Teste

Após executar `python manage.py seed_ifeed`:

| Perfil | E-mail | Senha |
| :--- | :--- | :--- |
| Administrador | `admin@ifrn.edu.br` | `admin12345` |
| Aluno | `aluno@ifrn.edu.br` | `aluno12345` |

---

## Considerações Finais

O ProIFEED foi desenvolvido para melhorar a comunicação entre estudantes e a gestão da alimentação escolar.

Com a área de relatórios administrativos, as avaliações podem ser interpretadas de forma mais visual e objetiva, facilitando a identificação de resultados positivos e dos aspectos que precisam ser melhorados nas refeições oferecidas.
