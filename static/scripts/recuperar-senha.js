document.addEventListener('DOMContentLoaded', () => {
    const USERS_KEY = 'ifeed_users';
    const defaultUsers = {
        ServicoSocial: {
            senha: 'ServicoSocialCang',
            tipo: 'administrador',
            nome: 'Serviço Social',
            email: 'servicosocial@escolar.ifrn.edu.br',
            matricula: '1234567',
            curso: 'Serviço Social'
        }
    };

    const form = document.getElementById('recoveryForm');
    if (!form) return;

    const messageBox = form.querySelector('.form-message');

    const showMessage = (text, type = 'error') => {
        messageBox.textContent = text;
        messageBox.className = `form-message ${type}`;
        messageBox.setAttribute('role', type === 'success' ? 'status' : 'alert');
    };

    const getUsers = () => {
        try {
            const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}') || {};
            const safeUsers = typeof users === 'object' && !Array.isArray(users) ? users : {};
            Object.keys(defaultUsers).forEach((key) => {
                const exists = Object.keys(safeUsers).some((storedKey) => storedKey.toLowerCase() === key.toLowerCase());
                if (!exists) safeUsers[key] = defaultUsers[key];
            });
            localStorage.setItem(USERS_KEY, JSON.stringify(safeUsers));
            return safeUsers;
        } catch {
            localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
            return { ...defaultUsers };
        }
    };

    const findUserKey = (users, login) => {
        const normalized = login.trim().toLowerCase();
        return Object.keys(users).find((key) => {
            const user = users[key];
            return key.toLowerCase() === normalized ||
                (user.email && user.email.toLowerCase() === normalized) ||
                (user.matricula && user.matricula === login.trim());
        });
    };

    form.addEventListener('input', () => showMessage('', ''));

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const login = form.elements.login.value.trim();
        const newPassword = form.elements.newPassword.value.trim();
        const confirmPassword = form.elements.confirmPassword.value.trim();

        if (!login || !newPassword || !confirmPassword) {
            showMessage('Preencha todos os campos.');
            return;
        }

        if (newPassword.length < 6) {
            showMessage('A nova senha deve ter pelo menos 6 caracteres.');
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage('As senhas não coincidem.');
            return;
        }

        const users = getUsers();
        const userKey = findUserKey(users, login);

        if (!userKey) {
            showMessage('Não encontramos uma conta com esse e-mail, matrícula ou login.');
            return;
        }

        users[userKey].senha = newPassword;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));

        showMessage('Senha atualizada com sucesso! Redirecionando para o login...', 'success');
        form.reset();

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1400);
    });
});
