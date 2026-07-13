document.addEventListener('DOMContentLoaded', () => {
    const MEAL_KEY = 'ifeed_meals';
    const FEEDBACK_KEY = 'ifeed_feedbacks';

    const params = new URLSearchParams(window.location.search);
    const mealId = Number(params.get('mealId'));
    const userType = localStorage.getItem('ifeed_user_type') || 'aluno';

    const elements = {
        title: document.getElementById('detailTitle'),
        info: document.getElementById('detailInfo'),
        badge: document.getElementById('detailBadge'),
        content: document.getElementById('detailContent'),
        empty: document.getElementById('detailEmpty'),
        menu: document.getElementById('detailMenuGroups'),
        date: document.getElementById('detailDate'),
        time: document.getElementById('detailTime'),
        campus: document.getElementById('detailCampus'),
        status: document.getElementById('detailStatus'),
        observation: document.getElementById('detailObservation'),
        average: document.getElementById('detailAverage'),
        stars: document.getElementById('detailStars'),
        count: document.getElementById('detailFeedbackCount'),
        primary: document.getElementById('detailPrimaryAction'),
        secondary: document.getElementById('detailSecondaryAction')
    };

    const getArray = (key) => {
        try {
            const data = JSON.parse(localStorage.getItem(key) || '[]') || [];
            return Array.isArray(data) ? data : [];
        } catch {
            return [];
        }
    };

    const meals = getArray(MEAL_KEY);
    const meal = meals.find((item) => Number(item.id) === mealId) || meals.find((item) => item.status === 'Publicado');

    if (!meal || meal.status !== 'Publicado') {
        showEmpty();
        return;
    }

    renderMeal(meal);

    function showEmpty() {
        elements.title.textContent = 'Refeição não encontrada';
        elements.info.textContent = 'Não foi possível carregar os detalhes dessa refeição.';
        elements.empty.hidden = false;
        elements.content.hidden = true;
        elements.primary.style.display = 'none';
    }

    function renderMeal(meal) {
        elements.empty.hidden = true;
        elements.content.hidden = false;

        const icon = meal.type === 'Jantar' ? '🌙' : '🍽️';
        elements.title.textContent = `${icon} ${meal.type}`;
        elements.info.textContent = `${formatDate(meal.date)} • ${meal.start || '--:--'} às ${meal.end || '--:--'} • ${meal.campus || 'IFRN Campus Canguaretama'}`;
        elements.badge.textContent = meal.status || 'Publicado';

        elements.date.textContent = formatDate(meal.date);
        elements.time.textContent = `${meal.start || '--:--'} às ${meal.end || '--:--'}`;
        elements.campus.textContent = meal.campus || 'IFRN Campus Canguaretama';
        elements.status.textContent = meal.status || 'Publicado';
        elements.observation.textContent = meal.observations || 'Nenhuma observação cadastrada.';

        elements.menu.innerHTML = buildMenuGroups(meal);
        renderFeedbackSummary(meal.id);

        if (userType === 'administrador') {
            elements.primary.textContent = 'Editar refeição';
            elements.primary.href = 'cadastro-refeicao.html';
            elements.secondary.textContent = 'Ver feedbacks';
            elements.secondary.href = 'analise-feedbacks.html';
        } else {
            elements.primary.textContent = 'Avaliar refeição';
            elements.primary.href = `avaliacao.html?mealId=${meal.id}`;
            elements.secondary.textContent = 'Voltar ao cardápio';
            elements.secondary.href = 'cardapio.html';
        }
    }

    function buildMenuGroups(meal) {
        const groups = [
            { title: 'Prato principal', items: meal.mainDish ? [meal.mainDish] : [] },
            { title: 'Acompanhamentos', items: meal.sides || [] },
            { title: 'Saladas', items: meal.salads || [] },
            { title: 'Bebidas', items: meal.drinks || [] },

        ];

        return groups.map((group) => `
            <section class="menu-group">
                <h3>${group.title}</h3>
                <ul>
                    ${group.items.length ? group.items.map((item) => `<li>${item}</li>`).join('') : '<li>Não informado.</li>'}
                </ul>
            </section>
        `).join('');
    }

    function renderFeedbackSummary(id) {
        const feedbacks = getArray(FEEDBACK_KEY).filter((feedback) => Number(feedback.mealId) === Number(id));
        if (!feedbacks.length) {
            elements.average.textContent = '-';
            elements.stars.textContent = '☆☆☆☆☆';
            elements.count.textContent = 'Nenhum feedback enviado para essa refeição ainda.';
            return;
        }

        const avg = feedbacks.reduce((sum, feedback) => sum + Number(feedback.rating || 0), 0) / feedbacks.length;
        const rounded = Math.round(avg);
        elements.average.textContent = avg.toFixed(1);
        elements.stars.textContent = '★'.repeat(rounded) + '☆'.repeat(5 - rounded);
        elements.count.textContent = `${feedbacks.length} feedback(s) recebido(s).`;
    }

    function formatDate(date) {
        if (!date) return 'Data não informada';
        if (String(date).includes('T')) date = String(date).split('T')[0];
        const [year, month, day] = String(date).split('-');
        return day && month && year ? `${day}/${month}/${year}` : String(date);
    }
});
