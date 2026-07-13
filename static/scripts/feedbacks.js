document.addEventListener('DOMContentLoaded', () => {
    const FEEDBACK_KEY = 'ifeed_feedbacks';
    const MEAL_KEY = 'ifeed_meals';

    const mealFilter = document.getElementById('feedbackMealFilter');
    const dateFilter = document.getElementById('feedbackDateFilter');
    const ratingFilter = document.getElementById('feedbackRatingFilter');

    const totalEl = document.getElementById('analysisTotalFeedbacks');
    const avgEl = document.getElementById('analysisAvgRating');
    const bestMealEl = document.getElementById('bestMeal');
    const worstMealEl = document.getElementById('worstMeal');
    const barsEl = document.getElementById('analysisRatingBars');
    const criteriaEl = document.getElementById('criteriaAverages');
    const mealPerformanceEl = document.getElementById('mealPerformanceList');
    const feedbackListEl = document.getElementById('analysisFeedbackList');

    const getMeals = () => {
        try {
            const meals = JSON.parse(localStorage.getItem(MEAL_KEY) || '[]') || [];
            return Array.isArray(meals) ? meals : [];
        } catch {
            return [];
        }
    };

    const getFeedbacks = () => {
        try {
            const feedbacks = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]') || [];
            return Array.isArray(feedbacks) ? feedbacks : [];
        } catch {
            return [];
        }
    };

    const meals = getMeals();
    populateMealFilter(meals);
    mealFilter?.addEventListener('change', render);
    dateFilter?.addEventListener('change', render);
    ratingFilter?.addEventListener('change', render);

    render();

    function populateMealFilter(mealsList) {
        if (!mealFilter) return;
        const publishedMeals = mealsList
            .slice()
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        mealFilter.innerHTML = '<option value="todas">Todas as refeições</option>' + publishedMeals.map((meal) => (
            `<option value="${meal.id}">${meal.type} • ${formatDate(meal.date)}</option>`
        )).join('');
    }

    function render() {
        const meals = getMeals();
        const feedbacks = applyFilters(getFeedbacks());
        const feedbacksByMeal = groupByMeal(feedbacks, meals);

        totalEl.textContent = String(feedbacks.length);
        avgEl.textContent = feedbacks.length ? average(feedbacks.map((item) => Number(item.rating || 0))).toFixed(2) : '-';
        bestMealEl.textContent = feedbacks.length ? getMealLabel(getBestOrWorst(feedbacksByMeal, 'best')) : '-';
        worstMealEl.textContent = feedbacks.length ? getMealLabel(getBestOrWorst(feedbacksByMeal, 'worst')) : '-';

        renderRatingBars(feedbacks);
        renderCriteria(feedbacks);
        renderMealPerformance(feedbacksByMeal, meals);
        renderFeedbackList(feedbacks, meals);
    }

    function applyFilters(feedbacks) {
        const mealValue = mealFilter?.value || 'todas';
        const dateValue = dateFilter?.value || 'todos';
        const minRating = Number(ratingFilter?.value || '0');
        const now = new Date();

        return feedbacks.filter((feedback) => {
            const matchesMeal = mealValue === 'todas' || Number(feedback.mealId) === Number(mealValue);
            const matchesRating = Number(feedback.rating || 0) >= minRating;

            let matchesDate = true;
            if (dateValue !== 'todos') {
                const days = Number(dateValue);
                const createdAt = new Date(feedback.createdAt);
                const diff = (now - createdAt) / (1000 * 60 * 60 * 24);
                matchesDate = diff <= days;
            }

            return matchesMeal && matchesRating && matchesDate;
        });
    }

    function groupByMeal(feedbacks, meals) {
        const map = new Map();
        feedbacks.forEach((feedback) => {
            const key = Number(feedback.mealId);
            if (!map.has(key)) {
                const meal = meals.find((item) => Number(item.id) === key);
                map.set(key, { meal, feedbacks: [] });
            }
            map.get(key).feedbacks.push(feedback);
        });
        return [...map.values()];
    }

    function getBestOrWorst(grouped, mode) {
        if (!grouped.length) return null;
        const sorted = grouped
            .map((entry) => ({
                meal: entry.meal,
                average: average(entry.feedbacks.map((item) => Number(item.rating || 0)))
            }))
            .sort((a, b) => mode === 'best' ? b.average - a.average : a.average - b.average);
        return sorted[0];
    }

    function getMealLabel(entry) {
        if (!entry || !entry.meal) return 'Sem dados';
        return `${entry.meal.type} (${formatDate(entry.meal.date)})`;
    }

    function renderRatingBars(feedbacks) {
        if (!barsEl) return;
        if (!feedbacks.length) {
            barsEl.innerHTML = '<p class="analysis-empty">Nenhum feedback encontrado com os filtros atuais.</p>';
            return;
        }

        const distribution = [1, 2, 3, 4, 5].map((rating) => ({
            rating,
            count: feedbacks.filter((item) => Number(item.rating) === rating).length
        })).reverse();

        const max = Math.max(...distribution.map((item) => item.count), 1);
        barsEl.innerHTML = distribution.map((item) => `
            <div class="rating-row">
                <div class="rating-label">${item.rating}★</div>
                <div class="rating-bar-wrap"><div class="rating-bar" style="width:${(item.count / max) * 100}%"></div></div>
                <div class="rating-count">${item.count}</div>
            </div>
        `).join('');
    }

    function renderCriteria(feedbacks) {
        if (!criteriaEl) return;
        if (!feedbacks.length) {
            criteriaEl.innerHTML = '<div class="analysis-empty">Nenhum critério disponível.</div>';
            return;
        }

        const criteria = [
            { key: 'taste', label: 'Sabor' },
            { key: 'temperature', label: 'Temperatura' },
            { key: 'quantity', label: 'Quantidade' },
            { key: 'variety', label: 'Variedade' }
        ];

        criteriaEl.innerHTML = criteria.map((criterion) => {
            const score = average(feedbacks.map((item) => qualitativeToScore(item[criterion.key]))).toFixed(2);
            return `
                <div class="criteria-item">
                    <strong>${score}</strong>
                    <span>${criterion.label}</span>
                </div>
            `;
        }).join('');
    }

    function renderMealPerformance(grouped, meals) {
        if (!mealPerformanceEl) return;
        if (!grouped.length) {
            mealPerformanceEl.innerHTML = '<div class="analysis-empty">Nenhuma refeição com feedback encontrada.</div>';
            return;
        }

        mealPerformanceEl.innerHTML = grouped
            .sort((a, b) => average(b.feedbacks.map((item) => Number(item.rating || 0))) - average(a.feedbacks.map((item) => Number(item.rating || 0))))
            .map(({ meal, feedbacks }) => {
                const safeMeal = meal || {};
                const averageRating = average(feedbacks.map((item) => Number(item.rating || 0))).toFixed(2);
                return `
                    <div class="meal-performance-card-item">
                        <h3>${safeMeal.type || 'Refeição'} • ${formatDate(safeMeal.date || feedbacks[0]?.mealDate)}</h3>
                        <div class="performance-meta">
                            <span><strong>Média:</strong> ${averageRating} / 5</span>
                            <span><strong>Feedbacks:</strong> ${feedbacks.length}</span>
                            <span><strong>Horário:</strong> ${safeMeal.start || '--:--'} às ${safeMeal.end || '--:--'}</span>
                        </div>
                    </div>
                `;
            }).join('');
    }

    function renderFeedbackList(feedbacks, meals) {
        if (!feedbackListEl) return;
        if (!feedbacks.length) {
            feedbackListEl.innerHTML = '<p class="analysis-empty">Nenhum comentário encontrado.</p>';
            return;
        }

        feedbackListEl.innerHTML = feedbacks
            .slice()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((feedback) => {
                const meal = meals.find((item) => Number(item.id) === Number(feedback.mealId));
                const mealLabel = meal ? `${meal.type} • ${formatDate(meal.date)}` : `${feedback.mealType || 'Refeição'} • ${formatDate(feedback.mealDate)}`;
                return `
                    <div class="admin-feedback-card">
                        <div class="feedback-header">
                            <span class="feedback-user">${feedback.userName || 'Aluno'} (${feedback.userMatricula || '---'})</span>
                            <span class="feedback-date">${new Date(feedback.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                        <div class="feedback-body">
                            <div><strong>Refeição:</strong> ${mealLabel}</div>
                            <div><strong>Nota:</strong> ${feedback.rating}★</div>
                            <div><strong>Sabor:</strong> ${feedback.taste || 'Não informado'}</div>
                            <div><strong>Temperatura:</strong> ${feedback.temperature || 'Não informado'}</div>
                            <div><strong>Quantidade:</strong> ${feedback.quantity || 'Não informado'}</div>
                            <div><strong>Variedade:</strong> ${feedback.variety || 'Não informado'}</div>
                            <div class="feedback-comment"><strong>Comentário:</strong> ${feedback.comment || '<em>Sem comentário</em>'}</div>
                        </div>
                    </div>
                `;
            }).join('');
    }

    function average(values) {
        const valid = values.filter((value) => !Number.isNaN(Number(value)));
        if (!valid.length) return 0;
        return valid.reduce((sum, value) => sum + Number(value), 0) / valid.length;
    }

    function qualitativeToScore(value) {
        const map = {
            'Muito ruim': 1,
            'Ruim': 2,
            'Boa': 4,
            'Excelente': 5
        };
        return map[value] || 0;
    }

    function formatDate(date) {
        if (!date) return 'Data não informada';
        if (String(date).includes('T')) date = String(date).split('T')[0];
        const [year, month, day] = String(date).split('-');
        return day && month && year ? `${day}/${month}/${year}` : String(date);
    }
});
