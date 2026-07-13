document.addEventListener('DOMContentLoaded', () => {
    const SESSION_TIMEOUT_MINUTES = 30;

    const clearSession = () => {
        [
            'ifeed_logged_in',
            'ifeed_user_type',
            'ifeed_user_name',
            'ifeed_user_email',
            'ifeed_user_matricula',
            'ifeed_user_curso',
            'ifeed_login_time',
            'ifeed_user_password'
        ].forEach((key) => localStorage.removeItem(key));
    };

    const isSessionExpired = () => {
        const loginTime = localStorage.getItem('ifeed_login_time');
        if (!loginTime) return false;
        const elapsed = Date.now() - Date.parse(loginTime);
        return Number.isNaN(elapsed) ? false : elapsed > SESSION_TIMEOUT_MINUTES * 60 * 1000;
    };

    const isPrivatePage = document.body.dataset.private === 'true';
    if (!isPrivatePage) return;

    const isLoggedIn = localStorage.getItem('ifeed_logged_in') === 'true';
    const userType = localStorage.getItem('ifeed_user_type') || '';
    const requiredRole = document.body.dataset.requires || '';

    if (!isLoggedIn || isSessionExpired()) {
        clearSession();
        window.location.href = 'login.html';
        return;
    }

    if (requiredRole && userType !== requiredRole) {
        window.location.href = 'dashboard.html';
        return;
    }

    const nav = document.getElementById('main-navigation');
    if (!nav) return;

    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';

    const baseLinks = [
        { href: 'dashboard.html', label: 'Dashboard' },
        { href: 'cardapio.html', label: 'Cardápio' }
    ];

    const studentLinks = [
        { href: 'avaliacao.html', label: 'Avaliar Refeição' }
    ];

    const adminLinks = [
        { href: 'cadastro-refeicao.html', label: 'Cadastrar Refeição' },
        { href: 'analise-feedbacks.html', label: 'Análise de Feedbacks' },
        { href: 'usuarios.html', label: 'Usuários' }
    ];

    const links = [...baseLinks];

    if (userType === 'aluno') {
        links.push(...studentLinks);
    }

    if (userType === 'administrador') {
        links.push(...adminLinks);
    }

    links.push({ href: 'perfil.html', label: 'Meu Perfil' });

    nav.innerHTML = links.map((link) => {
        const isActive = currentPage === link.href;
        const active = isActive ? ' class="active" aria-current="page"' : '';
        return `<li><a href="${link.href}"${active}>${link.label}</a></li>`;
    }).join('') + '<li><a href="#" id="navLogout" class="btn-logout">Sair</a></li>';



    const footerColumns = [...document.querySelectorAll('.footer-column')];
    const footerNavColumn = footerColumns.find((column) => {
        const title = column.querySelector('h3');
        return title && title.textContent.trim().toLowerCase().includes('navegação');
    });

    if (footerNavColumn) {
        const footerLinks = links.map((link) => `<a href="${link.href}">${link.label}</a>`).join('');
        footerNavColumn.innerHTML = `<h3>Navegação</h3>${footerLinks}`;
    }

    const logoutLink = document.getElementById('navLogout');
    if (logoutLink) {
        logoutLink.addEventListener('click', (event) => {
            event.preventDefault();
            clearSession();
            window.location.href = 'login.html';
        });
    }
});
