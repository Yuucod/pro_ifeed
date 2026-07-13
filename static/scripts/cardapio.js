document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'ifeed_meals';
    const list = document.getElementById('publishedMealsList');
    const typeFilter = document.getElementById('mealTypeFilter');
    const dateFilter = document.getElementById('mealDateFilter');
    const summary = document.getElementById('mealFilterSummary');

    if (!list) return;

    const getMeals = () => {
        try {
            const meals = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') || [];
            return Array.isArray(meals) ? meals : [];
        } catch {
            return [];
        }
    };

    const formatDate = (date) => {
        if (!date) return 'Data não informada';
        const [year, month, day] = date.split('-');
        return `${day}/${month}/${year}`;
    };

    const getMealItems = (meal) => {
        const items = [];
        if (meal.mainDish) items.push(`🍗 ${meal.mainDish}`);
        (meal.sides || []).forEach((item) => items.push(`🥣 ${item}`));
        (meal.salads || []).forEach((item) => items.push(`🥗 ${item}`));
        (meal.drinks || []).forEach((item) => items.push(`🥤 ${item}`));
        return items;
    };

    const applyFilters = (meals) => {
        const selectedType = typeFilter?.value || 'todos';
        const selectedDate = dateFilter?.value || 'todos';
        const today = new Date();
        const todayKey = today.toISOString().split('T')[0];
        const weekLimit = new Date(today);
        weekLimit.setDate(weekLimit.getDate() + 6);

        return meals.filter((meal) => {
            const matchesType = selectedType === 'todos' || meal.type === selectedType;
            let matchesDate = true;

            if (selectedDate === 'hoje') {
                matchesDate = meal.date === todayKey;
            } else if (selectedDate === 'semana') {
                const mealDate = new Date(`${meal.date}T00:00:00`);
                matchesDate = mealDate >= new Date(`${todayKey}T00:00:00`) && mealDate <= weekLimit;
            }

            return matchesType && matchesDate;
        });
    };

    const renderMeals = () => {
        const publishedMeals = getMeals()
            .filter((meal) => meal.status === 'Publicado')
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        const filteredMeals = applyFilters(publishedMeals);

        if (summary) {
            summary.textContent = `${filteredMeals.length} refeição(ões) encontrada(s) com os filtros atuais.`;
        }

        if (!filteredMeals.length) {
            list.innerHTML = `
                <article class="menu-item empty-menu-item">
                    <h3>🍽️ Nenhuma refeição encontrada</h3>
                    <p>Não existem refeições publicadas com os filtros selecionados.</p>
                </article>
            `;
            return;
        }

        list.innerHTML = filteredMeals.map((meal) => {
            const items = getMealItems(meal);
            const itemList = items.length
                ? items.map((item) => `<li>${item}</li>`).join('')
                : '<li>Cardápio sem itens detalhados.</li>';

            return `
                <article class="menu-item published-meal-card">
                    <div class="meal-card-topline">
                        <span class="meal-badge">${meal.type}</span>
                        <span class="meal-date-badge">📅 ${formatDate(meal.date)}</span>
                    </div>

                    <h3>${meal.type === 'Jantar' ? '🌙' : '🍽️'} ${meal.type}</h3>
                    <p class="meal-time">🕒 ${meal.start || '--:--'} às ${meal.end || '--:--'}</p>

                    <ul>${itemList}</ul>

                    ${meal.observations ? `<p class="meal-observation"><strong>Observação:</strong> ${meal.observations}</p>` : ''}

                    <div class="meal-card-actions">
                        <a class="btn-secondary meal-detail-link" href="detalhe-refeicao.html?mealId=${meal.id}">
                            Ver detalhes
                        </a>
                        <a class="btn-primary meal-feedback-link" href="avaliacao.html?mealId=${meal.id}">
                            Avaliar
                        </a>
                    </div>
                </article>
            `;
        }).join('');
    };

    typeFilter?.addEventListener('change', renderMeals);
    dateFilter?.addEventListener('change', renderMeals);

    renderMeals();
});
