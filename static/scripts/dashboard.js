document.addEventListener('DOMContentLoaded', () => {
    updateGreeting();
    updateCurrentDate();
    updateMealStatus();
    setInterval(updateMealStatus, 1000);

    function updateGreeting() {
        const greeting = document.getElementById('greeting');
        if (!greeting) return;

        const userName = greeting.dataset.userName || 'Usuário';
        const hour = new Date().getHours();
        let text = '🌙 Boa noite';

        if (hour >= 5 && hour < 12) text = '🌅 Bom dia';
        if (hour >= 12 && hour < 18) text = '☀️ Boa tarde';

        greeting.textContent = `${text}, ${userName}!`;
    }

    function updateCurrentDate() {
        const currentDate = document.getElementById('currentDate');
        if (!currentDate) return;

        currentDate.textContent = new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    function updateMealStatus() {
        const mealIcon = document.getElementById('mealIcon');
        const mealTitle = document.getElementById('mealTitle');
        const mealStatus = document.getElementById('mealStatus');
        const mealTime = document.getElementById('mealTime');
        if (!mealIcon || !mealTitle || !mealStatus || !mealTime) return;

        const now = new Date();
        const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

        const lunchStart = 11 * 3600 + 30 * 60;
        const lunchEnd = 13 * 3600;
        const dinnerStart = 17 * 3600 + 40 * 60;
        const dinnerEnd = 18 * 3600 + 40 * 60;

        if (currentSeconds < lunchStart) {
            showStatus('🍽️', 'Almoço', '🟡 Abre em', lunchStart - currentSeconds, '11h30 às 13h00');
        } else if (currentSeconds <= lunchEnd) {
            showStatus('🍛', 'Almoço', '🟢 Servindo agora', lunchEnd - currentSeconds, 'Encerra em');
        } else if (currentSeconds < dinnerStart) {
            showStatus('🌙', 'Jantar', '🟡 Abre em', dinnerStart - currentSeconds, '17h40 às 18h40');
        } else if (currentSeconds <= dinnerEnd) {
            showStatus('🍲', 'Jantar', '🟢 Servindo agora', dinnerEnd - currentSeconds, 'Encerra em');
        } else {
            showStatus('🔴', 'Refeitório', '🔴 Fechado', (24 * 3600 - currentSeconds) + lunchStart, 'Retorna em');
        }

        function showStatus(icon, title, status, seconds, label) {
            mealIcon.textContent = icon;
            mealTitle.textContent = title;
            mealStatus.textContent = status;
            mealTime.innerHTML = `<strong>${label}</strong><br>${formatTime(seconds)}`;
        }
    }

    function formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
});
