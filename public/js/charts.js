// Chart.js Utilities and Configurations

const ChartUtils = {
    // Default chart colors
    colors: {
        primary: '#6366F1',
        secondary: '#10B981',
        accent: '#F59E0B',
        danger: '#EF4444'
    },

    // Create gradient for chart
    createGradient(ctx, color, alpha = 0.2) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, color + Math.floor(alpha * 255).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, color + '00');
        return gradient;
    },

    // Default chart options
    getDefaultOptions(title = '') {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: !!title,
                    text: title,
                    color: '#F8FAFC',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#F8FAFC',
                    bodyColor: '#F8FAFC',
                    borderColor: '#6366F1',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94A3B8'
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94A3B8'
                    }
                }
            }
        };
    },

    // Create time-series line chart
    createTimeSeriesChart(canvasId, data, label = 'Value', color = null) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const chartColor = color || this.colors.primary;
        const gradient = this.createGradient(ctx.getContext('2d'), chartColor);

        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: label,
                    data: data.values,
                    borderColor: chartColor,
                    backgroundColor: gradient,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: chartColor,
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2
                }]
            },
            options: this.getDefaultOptions()
        });
    },

    // Create multi-line chart
    createMultiLineChart(canvasId, datasets) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const chartDatasets = datasets.map((dataset, index) => {
            const colors = [this.colors.primary, this.colors.secondary, this.colors.accent];
            const color = dataset.color || colors[index % colors.length];

            return {
                label: dataset.label,
                data: dataset.values,
                borderColor: color,
                backgroundColor: this.createGradient(ctx.getContext('2d'), color, 0.1),
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5
            };
        });

        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: datasets[0].labels,
                datasets: chartDatasets
            },
            options: {
                ...this.getDefaultOptions(),
                plugins: {
                    ...this.getDefaultOptions().plugins,
                    legend: {
                        display: true,
                        labels: {
                            color: '#F8FAFC',
                            usePointStyle: true,
                            padding: 20
                        }
                    }
                }
            }
        });
    },

    // Create bar chart
    createBarChart(canvasId, data, label = 'Value', color = null) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const chartColor = color || this.colors.primary;

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: label,
                    data: data.values,
                    backgroundColor: chartColor + '80',
                    borderColor: chartColor,
                    borderWidth: 1,
                    borderRadius: 8
                }]
            },
            options: this.getDefaultOptions()
        });
    },

    // Format device analytics data for charts
    formatDeviceAnalytics(analyticsData) {
        // New structure: data comes in temperature.data, humidity.data, powerConsumption.data
        const tempData = analyticsData.temperature?.data || [];
        const humData = analyticsData.humidity?.data || [];
        const powerData = analyticsData.powerConsumption?.data || [];

        return {
            temperature: {
                labels: tempData.map(d => new Date(d.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })),
                values: tempData.map(d => d.value)
            },
            humidity: {
                labels: humData.map(d => new Date(d.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })),
                values: humData.map(d => d.value)
            },
            power: {
                labels: powerData.map(d => new Date(d.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })),
                values: powerData.map(d => d.value)
            }
        };
    },

    // Destroy chart safely
    destroyChart(chart) {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    }
};

// Export for global use
window.ChartUtils = ChartUtils;
