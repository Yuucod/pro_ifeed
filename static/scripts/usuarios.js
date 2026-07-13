document.addEventListener('DOMContentLoaded', () => {
    const USERS_KEY = 'ifeed_users';
    const DEFAULT_ADMIN_KEY = 'ServicoSocial';
    const defaultAdmin = {
        senha: 'ServicoSocialCang',
        tipo: 'administrador',
        nome: 'Serviço Social',
        email: 'servicosocial@escolar.ifrn.edu.br',
        matricula: '1234567',
        curso: 'Serviço Social',
        turma: '',
        status: 'ativo',
        criadoEm: new Date().toISOString()
    };

    let editingKey = null;

    const form = document.getElementById('userForm');
    const table = document.getElementById('usersTable');
    const searchInput = document.getElementById('userSearchInput');
    const message = document.getElementById('usersMessage');
    const formTitle = document.getElementById('userFormTitle');

    const fields = {
        nome: document.getElementById('userNameInput'),
        email: document.getElementById('userEmailInput'),
        matricula: document.getElementById('userMatriculaInput'),
        curso: document.getElementById('userCursoInput'),
        turma: document.getElementById('userTurmaInput'),
        tipo: document.getElementById('userTypeInput'),
        status: document.getElementById('userStatusInput'),
        senha: document.getElementById('userPasswordInput')
    };

    const summary = {
        total: document.getElementById('totalUsers'),
        students: document.getElementById('totalStudents'),
        admins: document.getElementById('totalAdmins'),
        active: document.getElementById('totalActive')
    };

    if (!form || !table) return;

    seedAdmin();
    renderUsers();

    form.addEventListener('submit', handleSubmit);
    document.getElementById('clearUserForm')?.addEventListener('click', clearForm);
    searchInput?.addEventListener('input', renderUsers);
    table.addEventListener('click', handleTableClick);

    function getUsers() {
        try {
            const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}') || {};
            return typeof users === 'object' && !Array.isArray(users) ? users : {};
        } catch {
            return {};
        }
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    function seedAdmin() {
        const users = getUsers();
        const hasAdmin = Object.values(users).some((user) => user.tipo === 'administrador');
        if (!users[DEFAULT_ADMIN_KEY] && !hasAdmin) {
            users[DEFAULT_ADMIN_KEY] = defaultAdmin;
            saveUsers(users);
        }
    }

    function usersArray() {
        return Object.entries(getUsers()).map(([key, user]) => ({
            key,
            ...user,
            status: user.status || 'ativo'
        }));
    }

    function handleSubmit(event) {
        event.preventDefault();

        const user = {
            nome: fields.nome.value.trim(),
            email: fields.email.value.trim().toLowerCase(),
            matricula: fields.matricula.value.trim(),
            curso: fields.curso.value.trim(),
            turma: fields.turma.value.trim(),
            tipo: fields.tipo.value,
            status: fields.status.value,
            senha: fields.senha.value.trim()
        };

        if (!validateUser(user)) return;

        const users = getUsers();
        const duplicated = Object.entries(users).some(([key, item]) => {
            if (editingKey && key === editingKey) return false;
            return item.email?.toLowerCase() === user.email || item.matricula === user.matricula;
        });

        if (duplicated) {
            showMessage('Já existe usuário com este e-mail ou matrícula.', 'error');
            return;
        }

        const key = editingKey || user.email;
        const previous = editingKey ? users[editingKey] : null;

        users[key] = {
            ...previous,
            nome: user.nome,
            email: user.email,
            matricula: user.matricula,
            curso: user.curso,
            turma: user.turma,
            tipo: user.tipo,
            status: user.status,
            senha: user.senha || previous?.senha || '123456',
            criadoEm: previous?.criadoEm || new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        };

        if (editingKey && editingKey !== key) {
            delete users[editingKey];
        }

        saveUsers(users);
        showMessage(editingKey ? 'Usuário atualizado com sucesso.' : 'Usuário cadastrado com sucesso.', 'success');
        clearForm();
        renderUsers();
    }

    function validateUser(user) {
        if (!user.nome || !user.email || !user.matricula || !user.curso) {
            showMessage('Preencha nome, e-mail, matrícula e curso/setor.', 'error');
            return false;
        }

        if (!user.email.includes('@') || !user.email.includes('.')) {
            showMessage('Digite um e-mail válido.', 'error');
            return false;
        }

        if (!editingKey && user.senha.length < 6) {
            showMessage('Informe uma senha com no mínimo 6 caracteres.', 'error');
            return false;
        }

        if (editingKey && user.senha && user.senha.length < 6) {
            showMessage('A nova senha deve ter no mínimo 6 caracteres.', 'error');
            return false;
        }

        return true;
    }

    function renderUsers() {
        const search = (searchInput?.value || '').trim().toLowerCase();
        const users = usersArray();
        const filtered = users.filter((user) => {
            const content = `${user.nome} ${user.email} ${user.matricula} ${user.curso} ${user.tipo}`.toLowerCase();
            return content.includes(search);
        });

        updateSummary(users);

        if (!filtered.length) {
            table.innerHTML = '<div class="users-empty">Nenhum usuário encontrado.</div>';
            return;
        }

        table.innerHTML = filtered.map((user) => `
            <article class="user-row">
                <div class="user-main">
                    <strong>${user.nome || 'Sem nome'}</strong>
                    <span>${user.email || 'Sem e-mail'}</span>
                </div>
                <div class="user-meta">
                    <strong>${user.matricula || '-'}</strong><br>
                    <span>${user.curso || '-'}</span>
                </div>
                <div>
                    <span class="user-type-badge ${user.tipo}">${user.tipo === 'administrador' ? 'Admin' : 'Aluno'}</span>
                    <span class="user-status-badge ${user.status}">${user.status}</span>
                </div>
                <div class="user-actions">
                    <button type="button" class="edit-user" data-action="edit" data-key="${user.key}">Editar</button>
                    <button type="button" class="toggle-user" data-action="toggle" data-key="${user.key}">${user.status === 'ativo' ? 'Desativar' : 'Ativar'}</button>
                    <button type="button" class="delete-user" data-action="delete" data-key="${user.key}">Excluir</button>
                </div>
            </article>
        `).join('');
    }

    function updateSummary(users) {
        summary.total.textContent = String(users.length);
        summary.students.textContent = String(users.filter((user) => user.tipo === 'aluno').length);
        summary.admins.textContent = String(users.filter((user) => user.tipo === 'administrador').length);
        summary.active.textContent = String(users.filter((user) => user.status !== 'inativo').length);
    }

    function handleTableClick(event) {
        const button = event.target.closest('button');
        if (!button) return;

        const key = button.dataset.key;
        const action = button.dataset.action;

        if (action === 'edit') editUser(key);
        if (action === 'toggle') toggleUser(key);
        if (action === 'delete') deleteUser(key);
    }

    function editUser(key) {
        const users = getUsers();
        const user = users[key];
        if (!user) return;

        editingKey = key;
        formTitle.textContent = 'Editar usuário';
        fields.nome.value = user.nome || '';
        fields.email.value = user.email || '';
        fields.matricula.value = user.matricula || '';
        fields.curso.value = user.curso || '';
        fields.turma.value = user.turma || '';
        fields.tipo.value = user.tipo || 'aluno';
        fields.status.value = user.status || 'ativo';
        fields.senha.value = '';
        fields.senha.placeholder = 'Deixe em branco para manter a senha atual';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function toggleUser(key) {
        const users = getUsers();
        const user = users[key];
        if (!user) return;

        const currentEmail = localStorage.getItem('ifeed_user_email') || '';
        if (user.email?.toLowerCase() === currentEmail.toLowerCase()) {
            showMessage('Você não pode desativar a própria conta logada.', 'error');
            return;
        }

        user.status = user.status === 'inativo' ? 'ativo' : 'inativo';
        user.atualizadoEm = new Date().toISOString();
        saveUsers(users);
        showMessage(`Usuário ${user.status === 'ativo' ? 'ativado' : 'desativado'} com sucesso.`, 'success');
        renderUsers();
    }

    function deleteUser(key) {
        const users = getUsers();
        const user = users[key];
        if (!user) return;

        const currentEmail = localStorage.getItem('ifeed_user_email') || '';
        if (user.email?.toLowerCase() === currentEmail.toLowerCase()) {
            showMessage('Você não pode excluir a própria conta logada.', 'error');
            return;
        }

        if (!confirm(`Excluir o usuário ${user.nome}?`)) return;

        delete users[key];
        saveUsers(users);
        showMessage('Usuário excluído com sucesso.', 'success');
        renderUsers();
    }

    function clearForm() {
        editingKey = null;
        formTitle.textContent = 'Novo usuário';
        form.reset();
        fields.tipo.value = 'aluno';
        fields.status.value = 'ativo';
        fields.senha.placeholder = 'Mínimo de 6 caracteres';
    }

    function showMessage(text, type = 'success') {
        message.textContent = text;
        message.className = `users-message ${type}`;
        if (text) {
            setTimeout(() => {
                message.textContent = '';
                message.className = 'users-message';
            }, 3500);
        }
    }
});
