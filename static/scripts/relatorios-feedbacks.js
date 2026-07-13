document.addEventListener('DOMContentLoaded', () => {
    const dataElement = document.getElementById('feedback-chart-data');
    const printButton = document.getElementById('printReport');

    if (printButton) {
        printButton.addEventListener('click', () => window.print());
    }

    if (!dataElement) {
        return;
    }

    if (typeof Chart === 'undefined') {
        document.querySelectorAll('[data-chart-card]').forEach((card) => {
            const canvas = card.querySelector('canvas');
            const emptyState = card.querySelector('.chart-empty');
            if (canvas) canvas.hidden = true;
            if (emptyState) {
                emptyState.textContent = 'Não foi possível carregar os gráficos. Verifique a conexão com a internet e atualize a página.';
                emptyState.hidden = false;
            }
        });
        return;
    }

    const chartData = JSON.parse(dataElement.textContent);
    const hasData = Number(chartData.total || 0) > 0;

    if (!hasData) {
        document.querySelectorAll('[data-chart-card]').forEach((card) => {
            const canvas = card.querySelector('canvas');
            const emptyState = card.querySelector('.chart-empty');
            if (canvas) canvas.hidden = true;
            if (emptyState) emptyState.hidden = false;
        });
        return;
    }

    const colors = {
        green: '#3f8f55',
        greenLight: 'rgba(63, 143, 85, .18)',
        red: '#dc5964',
        orange: '#e99a42',
        yellow: '#e4bd45',
        blue: '#4f82c3',
        purple: '#8c6bc1',
        grid: '#e5eee7',
        text: '#607166',
        white: '#ffffff',
    };

    Chart.defaults.responsive = true;
    Chart.defaults.maintainAspectRatio = false;
    Chart.defaults.color = colors.text;
    Chart.defaults.font.family = "'Poppins', 'Segoe UI', sans-serif";

    const legend = {
        labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 8,
            boxHeight: 8,
            padding: 16,
        },
    };

    const tooltip = {
        backgroundColor: '#173f2b',
        titleColor: colors.white,
        bodyColor: colors.white,
        padding: 11,
        cornerRadius: 10,
    };

    const distributionCanvas = document.getElementById('distributionChart');
    if (distributionCanvas) {
        new Chart(distributionCanvas, {
            type: 'bar',
            data: {
                labels: ['1 estrela', '2 estrelas', '3 estrelas', '4 estrelas', '5 estrelas'],
                datasets: [{
                    label: 'Quantidade de feedbacks',
                    data: chartData.distribuicao,
                    backgroundColor: [colors.red, colors.orange, colors.yellow, colors.green, colors.blue],
                    borderRadius: 8,
                    borderSkipped: false,
                }],
            },
            options: {
                plugins: {
                    legend: { display: false },
                    tooltip,
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { maxRotation: 0 },
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { precision: 0 },
                        grid: { color: colors.grid },
                    },
                },
            },
        });
    }

    const categoryCanvas = document.getElementById('categoryChart');
    if (categoryCanvas) {
        new Chart(categoryCanvas, {
            type: 'radar',
            data: {
                labels: ['Geral', 'Sabor', 'Temperatura', 'Quantidade', 'Variedade'],
                datasets: [{
                    label: 'Média',
                    data: chartData.categorias,
                    borderColor: colors.green,
                    backgroundColor: colors.greenLight,
                    pointBackgroundColor: colors.green,
                    pointBorderColor: colors.white,
                    pointRadius: 4,
                    borderWidth: 2,
                }],
            },
            options: {
                plugins: { legend, tooltip },
                scales: {
                    r: {
                        min: 0,
                        max: 5,
                        ticks: {
                            stepSize: 1,
                            backdropColor: 'transparent',
                        },
                        angleLines: { color: colors.grid },
                        grid: { color: colors.grid },
                        pointLabels: { color: colors.text },
                    },
                },
            },
        });
    }

    const mealCanvas = document.getElementById('mealChart');
    if (mealCanvas) {
        new Chart(mealCanvas, {
            data: {
                labels: chartData.refeicoesLabels,
                datasets: [
                    {
                        type: 'bar',
                        label: 'Quantidade',
                        data: chartData.refeicoesTotais,
                        yAxisID: 'y',
                        backgroundColor: colors.green,
                        borderRadius: 8,
                        borderSkipped: false,
                    },
                    {
                        type: 'line',
                        label: 'Média',
                        data: chartData.refeicoesMedias,
                        yAxisID: 'y1',
                        borderColor: colors.orange,
                        backgroundColor: colors.orange,
                        pointBackgroundColor: colors.orange,
                        pointRadius: 4,
                        tension: .3,
                    },
                ],
            },
            options: {
                interaction: { mode: 'index', intersect: false },
                plugins: { legend, tooltip },
                scales: {
                    x: { grid: { display: false } },
                    y: {
                        beginAtZero: true,
                        position: 'left',
                        ticks: { precision: 0 },
                        grid: { color: colors.grid },
                        title: { display: true, text: 'Feedbacks' },
                    },
                    y1: {
                        beginAtZero: true,
                        min: 0,
                        max: 5,
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        title: { display: true, text: 'Média' },
                    },
                },
            },
        });
    }

    const timelineCanvas = document.getElementById('timelineChart');
    if (timelineCanvas) {
        new Chart(timelineCanvas, {
            type: 'line',
            data: {
                labels: chartData.timelineLabels,
                datasets: [{
                    label: 'Média diária',
                    data: chartData.timelineMedias,
                    borderColor: colors.blue,
                    backgroundColor: 'rgba(79, 130, 195, .14)',
                    fill: true,
                    tension: .35,
                    pointBackgroundColor: colors.blue,
                    pointBorderColor: colors.white,
                    pointBorderWidth: 2,
                    pointRadius: 4,
                }],
            },
            options: {
                plugins: {
                    legend,
                    tooltip: {
                        ...tooltip,
                        callbacks: {
                            afterLabel(context) {
                                const total = chartData.timelineTotais[context.dataIndex] || 0;
                                return `${total} feedback(s) no dia`;
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { maxRotation: 45, minRotation: 0 },
                    },
                    y: {
                        min: 0,
                        max: 5,
                        ticks: { stepSize: 1 },
                        grid: { color: colors.grid },
                    },
                },
            },
        });
    }

    const statusCanvas = document.getElementById('statusChart');
    if (statusCanvas) {
        new Chart(statusCanvas, {
            type: 'doughnut',
            data: {
                labels: chartData.statusLabels,
                datasets: [{
                    data: chartData.statusValores,
                    backgroundColor: [colors.blue, colors.yellow, colors.orange, colors.green, colors.red],
                    borderColor: colors.white,
                    borderWidth: 3,
                    hoverOffset: 7,
                }],
            },
            options: {
                cutout: '62%',
                plugins: { legend, tooltip },
            },
        });
    }
});
