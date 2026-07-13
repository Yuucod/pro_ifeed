const defaultUsers = {
    ServicoSocial: {
        senha: 'ServicoSocialCang',
        tipo: 'administrador',
        nome: 'Serviço Social',
        email: 'servicosocial@escolar.ifrn.edu.br',
        matricula: '1234567',
        curso: 'Serviço Social',
        status: 'ativo',
        criadoEm: new Date().toISOString()
    },
};

const usersKey = 'ifeed_users';
const SESSION_TIMEOUT_MINUTES = 30;

const clearSession = () => {
    ['ifeed_logged_in', 'ifeed_user_type', 'ifeed_user_name', 'ifeed_user_email', 'ifeed_user_matricula', 'ifeed_user_curso', 'ifeed_login_time', 'ifeed_user_password'].forEach(key => localStorage.removeItem(key));
};

const isSessionExpired = () => {
    const loginTime = localStorage.getItem('ifeed_login_time');
    if (!loginTime) return false;
    const elapsed = Date.now() - Date.parse(loginTime);
    return Number.isNaN(elapsed) ? false : elapsed > SESSION_TIMEOUT_MINUTES * 60 * 1000;
};

const isLoggedIn = localStorage.getItem('ifeed_logged_in') === 'true';
if (isLoggedIn) {
    if (isSessionExpired()) {
        clearSession();
    } else {
        window.location.href = 'dashboard.html';
    }
}

const getUsers = () => {
    const stored = localStorage.getItem(usersKey);
    if (stored) {
        try {
            const parsed = JSON.parse(stored) || {};
            // Garantir que os usuários seed existam (não sobrescrever dados já presentes)
            let modified = false;
            Object.keys(defaultUsers).forEach((key) => {
                const existingKey = Object.keys(parsed).find(
                    (storedKey) => storedKey.toLowerCase() === key.toLowerCase()
                );
                if (!existingKey) {
                    parsed[key] = defaultUsers[key];
                    modified = true;
                }
            });
            if (modified) {
                try { localStorage.setItem(usersKey, JSON.stringify(parsed)); } catch {}
            }
            return parsed;
        } catch {
            localStorage.removeItem(usersKey);
        }
    }
    localStorage.setItem(usersKey, JSON.stringify(defaultUsers));
    return { ...defaultUsers };
};

const saveUsers = (users) => {
    localStorage.setItem(usersKey, JSON.stringify(users));
};

const findUser = (login) => {
    const users = getUsers();
    const normalized = login.trim().toLowerCase();
    const directKey = Object.keys(users).find(
        (storedKey) => storedKey.toLowerCase() === normalized
    );
    if (directKey) {
        return users[directKey];
    }
    return Object.values(users).find((user) =>
        (user.matricula && user.matricula === login) ||
        (user.email && user.email.toLowerCase() === normalized)
    );
};

const loginForm = document.querySelector('.login-box form');

if (loginForm) {
    const messageBox = loginForm.parentElement.querySelector('.form-message');
    const inputs = loginForm.querySelectorAll('input');

    const showMessage = (text, type = 'error') => {
        if (!messageBox) return;
        messageBox.textContent = text;
        messageBox.className = `form-message ${type}`;
    };

    inputs.forEach((input) => {
        input.addEventListener('input', () => {
            showMessage('', '');
        });
    });

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const login = loginForm.elements.login.value.trim();
        const senha = loginForm.elements.senha.value.trim();

        if (login === '' || senha === '') {
            showMessage('Preencha todos os campos!', 'error');
            return;
        }

        const user = findUser(login);
        if (!user || user.senha !== senha) {
            showMessage('Login ou senha incorretos.', 'error');
            return;
        }

        if (user.status === 'inativo') {
            showMessage('Usuário inativo. Procure o administrador do sistema.', 'error');
            return;
        }

        // Não é necessário selecionar tipo no login — usa o tipo armazenado no usuário

        localStorage.setItem('ifeed_logged_in', 'true');
        localStorage.setItem('ifeed_user_type', user.tipo);
        localStorage.setItem('ifeed_user_name', user.nome);
        localStorage.setItem('ifeed_user_email', user.email);
        localStorage.setItem('ifeed_user_matricula', user.matricula);
        localStorage.setItem('ifeed_user_curso', user.curso || (user.tipo === 'administrador' ? 'Serviço Social' : ''));
        localStorage.setItem('ifeed_login_time', new Date().toISOString());

        showMessage('Login realizado com sucesso! Redirecionando...', 'success');

        setTimeout(() => {
            // Redireciona ao dashboard; o dashboard irá adaptar a interface conforme o tipo de usuário
            window.location.href = 'dashboard.html';
        }, 800);
    });
}