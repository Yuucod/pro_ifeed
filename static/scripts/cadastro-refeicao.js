document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'ifeed_meals';
    const LEGACY_KEY = 'ifeedMeals';
    const FEEDBACK_KEY = 'ifeed_feedbacks';

    const loggedIn = localStorage.getItem('ifeed_logged_in') === 'true';
    const userType = localStorage.getItem('ifeed_user_type') || '';

    if (!loggedIn) {
        window.location.href = 'login.html';
        return;
    }

    if (userType !== 'administrador') {
        window.location.href = 'dashboard.html';
        return;
    }

    let editingId = null;

    const fields = {
        date: document.getElementById('mealDate'),
        type: document.getElementById('mealType'),
        campus: document.getElementById('campus'),
        status: document.getElementById('mealStatusSelect'),
        start: document.getElementById('startTime'),
        end: document.getElementById('endTime'),
        mainDish: document.getElementById('mainDish'),
        observations: document.getElementById('observations')
    };

    const containers = {
        sides: document.getElementById('sideContainer'),
        salads: document.getElementById('saladContainer'),
        drinks: document.getElementById('drinkContainer')
    };

    const buttons = {
        addSide: document.getElementById('addSide'),
        addSalad: document.getElementById('addSalad'),
        addDrink: document.getElementById('addDrink'),
        save: document.getElementById('saveMealBtn'),
        clear: document.getElementById('clearMealBtn')
    };

    const preview = {
        type: document.getElementById('previewType'),
        date: document.getElementById('previewDate'),
        menu: document.getElementById('previewMenu'),
        observation: document.getElementById('previewObservation')
    };

    const mealList = document.getElementById('mealList');

    if (!fields.date || !buttons.save || !mealList) return;

    init();

    function init() {
        migrateLegacyMeals();
        createDynamicItem(containers.sides, 'Ex.: Arroz branco');
        createDynamicItem(containers.salads, 'Ex.: Salada de alface');
        createDynamicItem(containers.drinks, 'Ex.: Suco de acerola');

        setDefaultDate();
        setDefaultTime();
        bindEvents();
        updatePreview();
        renderMeals();
    }

    function bindEvents() {
        buttons.addSide.addEventListener('click', () => {
            createDynamicItem(containers.sides, 'Ex.: Feijão carioca');
            updatePreview();
        });

        buttons.addSalad.addEventListener('click', () => {
            createDynamicItem(containers.salads, 'Ex.: Tomate');
            updatePreview();
        });

        buttons.addDrink.addEventListener('click', () => {
            createDynamicItem(containers.drinks, 'Ex.: Água ou suco');
            updatePreview();
        });

        buttons.save.addEventListener('click', saveMeal);
        buttons.clear.addEventListener('click', clearForm);

        Object.values(fields).forEach((field) => {
            if (!field) return;
            field.addEventListener('input', updatePreview);
            field.addEventListener('change', () => {
                if (field === fields.type) setDefaultTime();
                updatePreview();
            });
        });

        mealList.addEventListener('click', handleMealListClick);
    }

    function migrateLegacyMeals() {
        if (localStorage.getItem(STORAGE_KEY)) return;
        const legacy = localStorage.getItem(LEGACY_KEY);
        if (legacy) {
            localStorage.setItem(STORAGE_KEY, legacy);
            localStorage.removeItem(LEGACY_KEY);
        }
    }

    function setDefaultDate() {
        fields.date.value = new Date().toISOString().split('T')[0];
    }

    function setDefaultTime() {
        if (fields.type.value === 'Jantar') {
            fields.start.value = '17:40';
            fields.end.value = '18:40';
        } else {
            fields.start.value = '11:30';
            fields.end.value = '13:00';
        }
    }

    function createDynamicItem(container, placeholder = 'Digite um item') {
        if (!container) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'dynamic-item';
        wrapper.innerHTML = `
            <input type="text" placeholder="${placeholder}">
            <button type="button" class="remove-item" aria-label="Remover item">×</button>
        `;

        wrapper.querySelector('input').addEventListener('input', updatePreview);
        wrapper.querySelector('.remove-item').addEventListener('click', () => {
            wrapper.remove();
            if (!container.querySelector('.dynamic-item')) createDynamicItem(container, placeholder);
            updatePreview();
        });

        container.appendChild(wrapper);
    }

    function getDynamicValues(container) {
        if (!container) return [];
        return [...container.querySelectorAll('input')]
            .map((input) => input.value.trim())
            .filter(Boolean);
    }

    function getMeals() {
        try {
            const meals = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') || [];
            return Array.isArray(meals) ? meals : [];
        } catch {
            return [];
        }
    }

    function setMeals(meals) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
    }

    function getFeedbacks() {
        try {
            const feedbacks = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]') || [];
            return Array.isArray(feedbacks) ? feedbacks : [];
        } catch {
            return [];
        }
    }

    function getFormData() {
        return {
            id: editingId || Date.now(),
            date: fields.date.value,
            type: fields.type.value,
            campus: fields.campus.value,
            status: fields.status.value,
            start: fields.start.value,
            end: fields.end.value,
            mainDish: fields.mainDish.value.trim(),
            sides: getDynamicValues(containers.sides),
            salads: getDynamicValues(containers.salads),
            drinks: getDynamicValues(containers.drinks),
            observations: fields.observations.value.trim(),
            createdAt: editingId ? undefined : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    function validateMeal(meal) {
        if (!meal.date) return showToast('Informe a data da refeição.', 'error'), false;
        if (!meal.type) return showToast('Selecione o tipo da refeição.', 'error'), false;
        if (!meal.start || !meal.end) return showToast('Informe o horário da refeição.', 'error'), false;
        if (meal.start >= meal.end) return showToast('O horário final deve ser maior que o inicial.', 'error'), false;
        if (!meal.mainDish && !meal.sides.length && !meal.salads.length && !meal.drinks.length) {
            return showToast('Informe pelo menos um item do cardápio.', 'error'), false;
        }
        return true;
    }

    function saveMeal() {
        const meal = getFormData();
        if (!validateMeal(meal)) return;

        let meals = getMeals();
        if (editingId) {
            const previous = meals.find((item) => item.id === editingId);
            meal.createdAt = previous?.createdAt || new Date().toISOString();
            meals = meals.map((item) => item.id === editingId ? meal : item);
            showToast('Refeição atualizada com sucesso!');
        } else {
            meals.push(meal);
            showToast('Refeição cadastrada com sucesso!');
        }

        setMeals(meals);
        clearForm();
        renderMeals();
    }

    function clearForm() {
        editingId = null;
        fields.type.value = 'Almoço';
        fields.status.value = 'Publicado';
        fields.mainDish.value = '';
        fields.observations.value = '';
        clearDynamicContainer(containers.sides, 'Ex.: Arroz branco');
        clearDynamicContainer(containers.salads, 'Ex.: Salada de alface');
        clearDynamicContainer(containers.drinks, 'Ex.: Suco de acerola');
        setDefaultDate();
        setDefaultTime();
        buttons.save.textContent = 'Salvar Refeição';
        updatePreview();
    }

    function clearDynamicContainer(container, placeholder) {
        container.innerHTML = '';
        createDynamicItem(container, placeholder);
    }

    function updatePreview() {
        const meal = getFormData();
        loadMealIntoPreview(meal);
    }

    function getMealItems(meal) {
        const items = [];
        if (meal.mainDish) items.push(`🍗 ${meal.mainDish}`);
        (meal.sides || []).forEach((item) => items.push(`🥣 ${item}`));
        (meal.salads || []).forEach((item) => items.push(`🥗 ${item}`));
        (meal.drinks || []).forEach((item) => items.push(`🥤 ${item}`));
        return items;
    }

    function loadMealIntoPreview(meal) {
        const icon = meal.type === 'Jantar' ? '🌙' : '🍽️';
        preview.type.textContent = `${icon} ${meal.type || 'Refeição'}`;
        preview.date.textContent = `${formatDate(meal.date)} • ${meal.start || '--:--'} às ${meal.end || '--:--'}`;
        const items = getMealItems(meal);
        preview.menu.innerHTML = items.length
            ? items.map((item) => `<li>${item}</li>`).join('')
            : '<li>Os itens do cardápio aparecerão aqui.</li>';
        preview.observation.textContent = meal.observations || 'Nenhuma observação.';
    }

    function renderMeals() {
        const meals = getMeals().sort((a, b) => new Date(b.date) - new Date(a.date));
        const feedbacks = getFeedbacks();

        if (!meals.length) {
            mealList.innerHTML = `
                <div class="empty-history">
                    <h3>🍽️ Nenhuma refeição cadastrada</h3>
                    <p>As refeições cadastradas aparecerão aqui.</p>
                </div>
            `;
            return;
        }

        mealList.innerHTML = meals.map((meal) => {
            const mealFeedbacks = feedbacks.filter((feedback) => Number(feedback.mealId) === Number(meal.id));
            const average = mealFeedbacks.length
                ? (mealFeedbacks.reduce((sum, item) => sum + Number(item.rating || 0), 0) / mealFeedbacks.length).toFixed(1)
                : '-';
            const statusClass = meal.status === 'Publicado' ? 'published' : 'draft';

            return `
                <article class="meal-item">
                    <h3>${meal.type === 'Jantar' ? '🌙' : '🍽️'} ${meal.type}</h3>
                    <p>📅 ${formatDate(meal.date)}</p>
                    <p>🕒 ${meal.start || '--:--'} às ${meal.end || '--:--'}</p>
                    <span class="status ${statusClass}">${meal.status}</span>
                    <p><strong>Principal:</strong> ${meal.mainDish || 'Não informado'}</p>
                    <p><strong>Feedbacks:</strong> ${mealFeedbacks.length} enviados ${average !== '-' ? `• média ${average}★` : ''}</p>
                    <div class="item-buttons">
                        <button type="button" data-action="view" data-id="${meal.id}">👁 Visualizar</button>
                        <button type="button" data-action="edit" data-id="${meal.id}">✏️ Editar</button>
                        <button type="button" data-action="delete" data-id="${meal.id}">🗑 Excluir</button>
                    </div>
                </article>
            `;
        }).join('');
    }

    function handleMealListClick(event) {
        const button = event.target.closest('button');
        if (!button) return;
        const id = Number(button.dataset.id);
        const action = button.dataset.action;
        if (action === 'view') viewMeal(id);
        if (action === 'edit') editMeal(id);
        if (action === 'delete') deleteMeal(id);
    }

    function viewMeal(id) {
        const meal = getMeals().find((item) => Number(item.id) === Number(id));
        if (!meal) return;
        loadMealIntoPreview(meal);
        document.querySelector('.preview-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
        showToast('Pré-visualização carregada.');
    }

    function editMeal(id) {
        const meal = getMeals().find((item) => Number(item.id) === Number(id));
        if (!meal) return;
        editingId = meal.id;
        fields.date.value = meal.date || '';
        fields.type.value = meal.type || 'Almoço';
        fields.campus.value = meal.campus || 'IFRN Campus Canguaretama';
        fields.status.value = meal.status || 'Publicado';
        fields.start.value = meal.start || '11:30';
        fields.end.value = meal.end || '13:00';
        fields.mainDish.value = meal.mainDish || '';
        fields.observations.value = meal.observations || '';
        fillDynamicContainer(containers.sides, meal.sides || [], 'Ex.: Arroz branco');
        fillDynamicContainer(containers.salads, meal.salads || [], 'Ex.: Salada de alface');
        fillDynamicContainer(containers.drinks, meal.drinks || [], 'Ex.: Suco de acerola');
        buttons.save.textContent = 'Atualizar Refeição';
        updatePreview();
        document.querySelector('.meal-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
        showToast('Modo de edição ativado.');
    }

    function fillDynamicContainer(container, values, placeholder) {
        container.innerHTML = '';
        if (!values.length) {
            createDynamicItem(container, placeholder);
            return;
        }
        values.forEach((value) => {
            createDynamicItem(container, placeholder);
            container.lastElementChild.querySelector('input').value = value;
        });
    }

    function deleteMeal(id) {
        const linkedFeedbacks = getFeedbacks().filter((feedback) => Number(feedback.mealId) === Number(id));
        const message = linkedFeedbacks.length
            ? `Esta refeição possui ${linkedFeedbacks.length} feedback(s). Deseja excluir mesmo assim?`
            : 'Deseja excluir esta refeição?';
        if (!confirm(message)) return;
        setMeals(getMeals().filter((item) => Number(item.id) !== Number(id)));
        renderMeals();
        showToast('Refeição excluída com sucesso.');
    }

    function formatDate(date) {
        if (!date) return 'Hoje';
        const [year, month, day] = date.split('-');
        return `${day}/${month}/${year}`;
    }

    function showToast(message, type = 'success') {
        let toast = document.querySelector('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
});
