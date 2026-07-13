document.addEventListener('DOMContentLoaded', () => {
    const stars = document.querySelectorAll('.star');
    const ratingValue = document.getElementById('ratingValue');
    const evaluationForm = document.getElementById('evaluationForm');
    const evaluationMessage = document.getElementById('evaluationMessage');
    const mealSelect = document.getElementById('mealSelect');
    const selectedMealTitle = document.getElementById('selectedMealTitle');
    const selectedMealInfo = document.getElementById('selectedMealInfo');
    const selectedMealItems = document.getElementById('selectedMealItems');

    const currentUserName = localStorage.getItem('ifeed_user_name') || 'Estudante';
    const currentUserMatricula = localStorage.getItem('ifeed_user_matricula') || '';

    const getMeals = () => {
        try {
            const meals = JSON.parse(localStorage.getItem('ifeed_meals') || '[]') || [];
            return Array.isArray(meals) ? meals : [];
        } catch {
            return [];
        }
    };

    const getFeedbacks = () => {
        try {
            const feedbacks = JSON.parse(localStorage.getItem('ifeed_feedbacks') || '[]') || [];
            return Array.isArray(feedbacks) ? feedbacks : [];
        } catch {
            return [];
        }
    };

    const saveFeedbacks = (feedbacks) => {
        localStorage.setItem('ifeed_feedbacks', JSON.stringify(feedbacks));
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

    const setMessage = (text, type = 'success') => {
        if (!evaluationMessage) return;
        evaluationMessage.textContent = text;
        evaluationMessage.className = `form-message ${type}`;
    };

    const publishedMeals = getMeals().filter((meal) => meal.status === 'Publicado');

    const params = new URLSearchParams(window.location.search);
    const selectedIdFromUrl = Number(params.get('mealId'));

    const renderMealOptions = () => {
        if (!mealSelect) return;

        if (!publishedMeals.length) {
            mealSelect.innerHTML = '<option value="">Nenhuma refeição publicada</option>';
            mealSelect.disabled = true;
            evaluationForm.querySelector('button[type="submit"]').disabled = true;
            selectedMealTitle.textContent = 'Nenhuma refeição disponível';
            selectedMealInfo.textContent = 'Aguarde o administrador publicar uma refeição para avaliação.';
            selectedMealItems.innerHTML = '<li>Sem cardápio disponível no momento.</li>';
            return;
        }

        mealSelect.innerHTML = publishedMeals.map((meal) => (
            `<option value="${meal.id}">${meal.type} - ${formatDate(meal.date)} (${meal.start || '--:--'} às ${meal.end || '--:--'})</option>`
        )).join('');

        const hasUrlMeal = publishedMeals.some((meal) => meal.id === selectedIdFromUrl);
        mealSelect.value = hasUrlMeal ? String(selectedIdFromUrl) : String(publishedMeals[0].id);
        renderSelectedMeal();
    };

    const renderSelectedMeal = () => {
        const mealId = Number(mealSelect?.value);
        const meal = publishedMeals.find((item) => item.id === mealId);

        if (!meal) return;

        selectedMealTitle.textContent = `${meal.type === 'Jantar' ? '🌙' : '🍽️'} ${meal.type}`;
        selectedMealInfo.textContent = `${formatDate(meal.date)} • ${meal.start || '--:--'} às ${meal.end || '--:--'} • ${meal.campus || 'IFRN Campus Canguaretama'}`;

        const items = getMealItems(meal);
        selectedMealItems.innerHTML = items.length
            ? items.map((item) => `<li>${item}</li>`).join('')
            : '<li>Cardápio sem itens detalhados.</li>';
    };

    const updateStars = (value) => {
        stars.forEach((star) => {
            const starValue = Number(star.dataset.value);
            star.classList.toggle('active', starValue <= value);
        });
        if (ratingValue) ratingValue.value = String(value);
    };

    stars.forEach((star) => {
        star.addEventListener('click', () => {
            updateStars(Number(star.dataset.value));
        });
    });

    if (mealSelect) {
        mealSelect.addEventListener('change', renderSelectedMeal);
    }

    evaluationForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const mealId = Number(mealSelect?.value);
        const meal = publishedMeals.find((item) => item.id === mealId);

        if (!meal) {
            setMessage('Selecione uma refeição publicada para avaliar.', 'error');
            return;
        }

        const feedbacks = getFeedbacks();
        const alreadyAnswered = feedbacks.some((feedback) =>
            Number(feedback.mealId) === mealId && feedback.userMatricula === currentUserMatricula
        );

        if (alreadyAnswered) {
            setMessage('Você já enviou feedback para esta refeição.', 'error');
            return;
        }

        feedbacks.push({
            id: Date.now(),
            mealId: meal.id,
            mealType: meal.type,
            mealDate: meal.date,
            rating: Number(ratingValue.value || 5),
            taste: evaluationForm.elements.taste.value,
            temperature: evaluationForm.elements.temperature.value,
            quantity: evaluationForm.elements.quantity.value,
            variety: evaluationForm.elements.variety.value,
            comment: evaluationForm.elements.comment.value.trim(),
            userName: currentUserName,
            userMatricula: currentUserMatricula,
            createdAt: new Date().toISOString(),
        });

        saveFeedbacks(feedbacks);
        setMessage('Obrigado pelo seu feedback!', 'success');

        evaluationForm.reset();
        mealSelect.value = String(meal.id);
        renderSelectedMeal();
        updateStars(5);

        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1200);
    });

    renderMealOptions();
    updateStars(5);
});
