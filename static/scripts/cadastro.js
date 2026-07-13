const usersKey = 'ifeed_users';
const cadastroForm = document.getElementById('cadastroForm');

const getUsers = () => {
    const stored = localStorage.getItem(usersKey);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch {
            localStorage.removeItem(usersKey);
        }
    }
    return {};
};

const saveUsers = (users) => {
    localStorage.setItem(usersKey, JSON.stringify(users));
};

if (cadastroForm) {
    const messageBox = cadastroForm.closest('.cadastro-box')?.querySelector('.form-message') || cadastroForm.querySelector('.form-message');
    const matricula = document.getElementById('matricula');
    const inputs = cadastroForm.querySelectorAll('input');

    const showMessage = (text, type = 'error') => {
        if (!messageBox) return;
        messageBox.textContent = text;
        messageBox.className = `form-message ${type}`;
        messageBox.setAttribute('role', type === 'success' ? 'status' : 'alert');
    };

    inputs.forEach((input) => {
        input.addEventListener('input', () => {
            showMessage('', '');
        });
    });

    matricula.addEventListener('input', () => {
        matricula.value = matricula.value
            .replace(/\D/g, '')
            .slice(0, 14);
    });

    cadastroForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const nome = cadastroForm.elements.nome.value.trim();
        const matriculaValor = cadastroForm.elements.matricula.value.trim();
        const curso = cadastroForm.elements.curso.value.trim();
        const turma = cadastroForm.elements.turma.value.trim();
        const email = cadastroForm.elements.email.value.trim().toLowerCase();
        const senha = cadastroForm.elements.senha.value.trim();
        const confirmarSenha = cadastroForm.elements.confirmarSenha.value.trim();
        // Tipo definido por padrão como 'aluno'
        const tipoUsuario = 'aluno';

        if (
            nome === '' ||
            matriculaValor === '' ||
            curso === '' ||
            turma === '' ||
            email === '' ||
            senha === '' ||
            confirmarSenha === ''
        ) {
            showMessage('Preencha todos os campos!');
            return;
        }

        if (nome.length < 5) {
            showMessage('Digite um nome válido.');
            return;
        }

        // Validação para alunos (padrão)
        if (matriculaValor.length < 14) {
            showMessage('A matrícula do aluno deve possuir pelo menos 14 números.');
            return;
        }

        if (!email.includes('@') || !email.includes('.')) {
            showMessage('Digite um e-mail escolar válido.');
            return;
        }

        if (!email.endsWith('@escolar.ifrn.edu.br')) {
            showMessage('Utilize um e-mail institucional do IFRN.');
            return;
        }

        if (senha.length < 6) {
            showMessage('A senha deve possuir no mínimo 6 caracteres.');
            return;
        }

        if (senha !== confirmarSenha) {
            showMessage('As senhas não coincidem.');
            return;
        }

        const users = getUsers();
        const cpfAlreadyExists = Object.values(users).some((user) => user.matricula === matriculaValor);
        const emailAlreadyExists = Object.values(users).some((user) => user.email === email);

        if (emailAlreadyExists) {
            showMessage('Já existe um cadastro com este e-mail. Faça login ou use outro e-mail.');
            return;
        }

        if (cpfAlreadyExists) {
            showMessage('Já existe um cadastro com esta matrícula. Verifique seus dados ou faça login.');
            return;
        }

        users[email] = {
            senha,
            tipo: tipoUsuario,
            nome,
            email,
            matricula: matriculaValor,
            curso,
            turma,
            status: 'ativo',
            criadoEm: new Date().toISOString()
        };

        saveUsers(users);
        showMessage('Cadastro realizado com sucesso! Redirecionando para o login...', 'success');
        cadastroForm.reset();

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1200);
    });
}