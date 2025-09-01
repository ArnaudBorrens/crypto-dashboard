// Enhanced Crypto Portfolio Dashboard JavaScript

class CryptoDashboard {
    constructor() {
        this.data = {
            portfolio_overview: {
                total_value: 9751.26,
                total_cost: 8389.42,
                total_pnl: 1361.84,
                pnl_percentage: 16.24,
                daily_change: 2.34,
                daily_change_percent: 0.24
            },
            individual_coins: [
                {
                    symbol: "BTC",
                    name: "Bitcoin",
                    amount: 0.025123,
                    current_price: 65000,
                    current_value: 1632.99,
                    total_cost: 1005.67,
                    avg_cost: 40025.34,
                    unrealized_pnl: 627.33,
                    pnl_percent: 62.38,
                    portfolio_weight: 16.74,
                    change_24h: 2.5,
                    interest_earned_total: 73.52,
                    transactions_count: 8,
                    volatility: 15.2
                },
                {
                    symbol: "ETH", 
                    name: "Ethereum",
                    amount: 2.5055,
                    current_price: 2280.50,
                    current_value: 5713.79,
                    total_cost: 6263.75,
                    avg_cost: 2500.85,
                    unrealized_pnl: -549.96,
                    pnl_percent: -8.78,
                    portfolio_weight: 58.60,
                    change_24h: -1.2,
                    interest_earned_total: 136.49,
                    transactions_count: 12,
                    volatility: 18.7
                },
                {
                    symbol: "ADA",
                    name: "Cardano", 
                    amount: 1200,
                    current_price: 0.85,
                    current_value: 1020.00,
                    total_cost: 800.00,
                    avg_cost: 0.67,
                    unrealized_pnl: 220.00,
                    pnl_percent: 27.50,
                    portfolio_weight: 10.46,
                    change_24h: 3.8,
                    interest_earned_total: 0.00,
                    transactions_count: 3,
                    volatility: 22.1
                },
                {
                    symbol: "DOT",
                    name: "Polkadot",
                    amount: 45.5,
                    current_price: 8.45,
                    current_value: 384.48,
                    total_cost: 320.00,
                    avg_cost: 7.03,
                    unrealized_pnl: 64.48,
                    pnl_percent: 20.15,
                    portfolio_weight: 3.94,
                    change_24h: 1.9,
                    interest_earned_total: 0.00,
                    transactions_count: 2,
                    volatility: 24.3
                }
            ],
            price_history: {
                dates: ["2024-08-01", "2024-08-05", "2024-08-10", "2024-08-15", "2024-08-20", "2024-08-25", "2024-08-30"],
                BTC: [0, -5.2, -3.9, -8.2, -12.1, -18.5, -14.7],
                ETH: [0, -10.2, -13.7, -8.5, -5.2, -2.1, -3.5],
                ADA: [0, -10.0, -18.6, -25.7, -35.2, -45.1, -58.6],
                DOT: [0, -5.8, 8.1, 15.3, 25.8, 45.2, 69.3]
            },
            interest_earnings: {
                months: ["2024-01", "2024-02", "2024-03", "2024-04", "2024-05", "2024-06", "2024-07", "2024-08"],
                BTC: [5.67, 6.25, 7.84, 9.12, 10.50, 11.25, 10.85, 12.34],
                ETH: [13.75, 15.50, 14.20, 17.85, 18.92, 19.35, 16.78, 20.14]
            },
            allocation_history: [
                {date: "2024-01", BTC: 16.3, ETH: 84.9, ADA: 3.5, DOT: 0.0},
                {date: "2024-02", BTC: 16.4, ETH: 81.9, ADA: 3.4, DOT: 0.0},
                {date: "2024-03", BTC: 15.6, ETH: 82.5, ADA: 3.1, DOT: 0.0},
                {date: "2024-04", BTC: 17.1, ETH: 80.4, ADA: 2.9, DOT: 0.0},
                {date: "2024-05", BTC: 13.2, ETH: 77.9, ADA: 2.7, DOT: 6.3},
                {date: "2024-06", BTC: 14.6, ETH: 78.5, ADA: 3.7, DOT: 3.2},
                {date: "2024-07", BTC: 14.2, ETH: 83.1, ADA: 2.5, DOT: 0.1},
                {date: "2024-08", BTC: 14.1, ETH: 81.0, ADA: 3.0, DOT: 1.8}
            ],
            risk_metrics: {
                BTC: {volatility: 15.2, max_drawdown: -18.5, sharpe_ratio: 1.8},
                ETH: {volatility: 18.7, max_drawdown: -13.7, sharpe_ratio: 1.4},
                ADA: {volatility: 22.1, max_drawdown: -58.6, sharpe_ratio: 0.9},
                DOT: {volatility: 24.3, max_drawdown: -5.8, sharpe_ratio: 2.1}
            }
        };
        
        this.colors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5'];
        this.activeCoinFilters = new Set(['BTC', 'ETH', 'ADA', 'DOT']);
        this.currentTimePeriod = '30D';
        this.charts = {};
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeCharts();
        this.updateChartVisibility();
    }

    setupEventListeners() {
        // Coin toggle buttons
        document.querySelectorAll('.coin-toggle').forEach(button => {
            button.addEventListener('click', this.handleCoinToggle.bind(this));
        });

        // Time period selector
        const timePeriodSelect = document.querySelector('.time-period-select');
        if (timePeriodSelect) {
            timePeriodSelect.addEventListener('change', this.handleTimePeriodChange.bind(this));
        }

        // Coin card clicks for modal
        document.querySelectorAll('.coin-card').forEach(card => {
            card.addEventListener('click', this.handleCoinCardClick.bind(this));
            // Make focusable for keyboard navigation
            card.setAttribute('tabindex', '0');
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handleCoinCardClick.call(this, e);
                }
            });
        });

        // Modal close functionality
        const modal = document.getElementById('coinModal');
        const closeButton = document.querySelector('.modal-close');
        
        if (closeButton) {
            closeButton.addEventListener('click', this.closeModal.bind(this));
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }

        // Keyboard escape for modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    handleCoinToggle(event) {
        const coin = event.target.dataset.coin;
        const button = event.target;
        
        if (this.activeCoinFilters.has(coin)) {
            this.activeCoinFilters.delete(coin);
            button.classList.remove('active');
        } else {
            this.activeCoinFilters.add(coin);
            button.classList.add('active');
        }
        
        this.updateChartVisibility();
    }

    handleTimePeriodChange(event) {
        this.currentTimePeriod = event.target.value;
        this.updateChartVisibility();
    }

    handleCoinCardClick(event) {
        const coinSymbol = event.currentTarget.dataset.coin;
        const coinData = this.data.individual_coins.find(coin => coin.symbol === coinSymbol);
        
        if (coinData) {
            this.openCoinModal(coinData);
        }
    }

    openCoinModal(coinData) {
        const modal = document.getElementById('coinModal');
        const titleElement = document.getElementById('modalCoinTitle');
        const contentElement = document.getElementById('modalCoinContent');
        
        titleElement.textContent = `${coinData.name} (${coinData.symbol})`;
        
        contentElement.innerHTML = `
            <div class="modal-coin-details">
                <div class="modal-metrics-grid">
                    <div class="modal-metric-card">
                        <h4>Holdings</h4>
                        <div class="metric-value-large">${this.formatAmount(coinData.amount, coinData.symbol)}</div>
                        <div class="metric-subtitle">Current Price: $${this.formatNumber(coinData.current_price)}</div>
                    </div>
                    
                    <div class="modal-metric-card">
                        <h4>Current Value</h4>
                        <div class="metric-value-large">$${this.formatNumber(coinData.current_value)}</div>
                        <div class="metric-subtitle">Portfolio Weight: ${coinData.portfolio_weight}%</div>
                    </div>
                    
                    <div class="modal-metric-card">
                        <h4>Profit & Loss</h4>
                        <div class="metric-value-large ${coinData.unrealized_pnl >= 0 ? 'profit' : 'loss'}">
                            ${coinData.unrealized_pnl >= 0 ? '+' : ''}$${this.formatNumber(Math.abs(coinData.unrealized_pnl))}
                        </div>
                        <div class="metric-subtitle ${coinData.pnl_percent >= 0 ? 'profit' : 'loss'}">
                            ${coinData.pnl_percent >= 0 ? '+' : ''}${coinData.pnl_percent}%
                        </div>
                    </div>
                    
                    <div class="modal-metric-card">
                        <h4>Performance</h4>
                        <div class="metric-value-large ${coinData.change_24h >= 0 ? 'profit' : 'loss'}">
                            ${coinData.change_24h >= 0 ? '+' : ''}${coinData.change_24h}%
                        </div>
                        <div class="metric-subtitle">24h Change</div>
                    </div>
                </div>
                
                <div class="modal-additional-info">
                    <div class="info-section">
                        <h4>Investment Details</h4>
                        <div class="info-grid">
                            <div class="info-item">
                                <span class="info-label">Total Investment:</span>
                                <span class="info-value">$${this.formatNumber(coinData.total_cost)}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Average Cost:</span>
                                <span class="info-value">$${this.formatNumber(coinData.avg_cost)}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Transactions:</span>
                                <span class="info-value">${coinData.transactions_count}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Interest Earned:</span>
                                <span class="info-value">$${this.formatNumber(coinData.interest_earned_total)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <h4>Risk Metrics</h4>
                        <div class="info-grid">
                            <div class="info-item">
                                <span class="info-label">Volatility:</span>
                                <span class="info-value">${coinData.volatility}%</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Max Drawdown:</span>
                                <span class="info-value">${this.data.risk_metrics[coinData.symbol].max_drawdown}%</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Sharpe Ratio:</span>
                                <span class="info-value">${this.data.risk_metrics[coinData.symbol].sharpe_ratio}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        modal.classList.remove('hidden');
        
        // Focus management for accessibility
        const closeButton = modal.querySelector('.modal-close');
        if (closeButton) {
            closeButton.focus();
        }
    }

    closeModal() {
        const modal = document.getElementById('coinModal');
        modal.classList.add('hidden');
    }

    initializeCharts() {
        this.createPerformanceChart();
        this.createCostValueChart();
        this.createInterestChart();
        this.createAllocationChart();
        this.createRiskChart();
        this.createCorrelationChart();
    }

    createPerformanceChart() {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;

        const datasets = [];
        const coins = ['BTC', 'ETH', 'ADA', 'DOT'];
        
        coins.forEach((coin, index) => {
            datasets.push({
                label: coin,
                data: this.data.price_history[coin],
                borderColor: this.colors[index],
                backgroundColor: this.colors[index] + '20',
                fill: false,
                tension: 0.1
            });
        });

        this.charts.performance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.data.price_history.dates,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Price Change (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        });
    }

    createCostValueChart() {
        const ctx = document.getElementById('costValueChart');
        if (!ctx) return;

        const coins = this.data.individual_coins.map(coin => coin.symbol);
        const costData = this.data.individual_coins.map(coin => coin.total_cost);
        const valueData = this.data.individual_coins.map(coin => coin.current_value);

        this.charts.costValue = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: coins,
                datasets: [
                    {
                        label: 'Total Cost',
                        data: costData,
                        backgroundColor: this.colors[1],
                        borderColor: this.colors[1],
                        borderWidth: 1
                    },
                    {
                        label: 'Current Value',
                        data: valueData,
                        backgroundColor: this.colors[0],
                        borderColor: this.colors[0],
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Value ($)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Cryptocurrency'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            afterLabel: (context) => {
                                const coinData = this.data.individual_coins[context.dataIndex];
                                const pnl = coinData.unrealized_pnl;
                                const pnlPercent = coinData.pnl_percent;
                                return `P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnl >= 0 ? '+' : ''}${pnlPercent}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    createInterestChart() {
        const ctx = document.getElementById('interestChart');
        if (!ctx) return;

        this.charts.interest = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.data.interest_earnings.months,
                datasets: [
                    {
                        label: 'BTC Interest',
                        data: this.data.interest_earnings.BTC,
                        borderColor: this.colors[0],
                        backgroundColor: this.colors[0] + '20',
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'ETH Interest',
                        data: this.data.interest_earnings.ETH,
                        borderColor: this.colors[1],
                        backgroundColor: this.colors[1] + '20',
                        fill: false,
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Interest Earned ($)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }

    createAllocationChart() {
        const ctx = document.getElementById('allocationChart');
        if (!ctx) return;

        const datasets = [];
        const coins = ['BTC', 'ETH', 'ADA', 'DOT'];
        
        coins.forEach((coin, index) => {
            datasets.push({
                label: coin,
                data: this.data.allocation_history.map(item => item[coin]),
                backgroundColor: this.colors[index] + '80',
                borderColor: this.colors[index],
                borderWidth: 1,
                fill: true
            });
        });

        this.charts.allocation = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.data.allocation_history.map(item => item.date),
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        stacked: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Allocation (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    filler: {
                        propagate: false
                    }
                },
                elements: {
                    line: {
                        tension: 0.1
                    }
                },
                interaction: {
                    intersect: false
                }
            }
        });
    }

    createRiskChart() {
        const ctx = document.getElementById('riskChart');
        if (!ctx) return;

        const coins = Object.keys(this.data.risk_metrics);
        const volatilityData = coins.map(coin => this.data.risk_metrics[coin].volatility);
        const sharpeData = coins.map(coin => this.data.risk_metrics[coin].sharpe_ratio * 10);
        const maxDrawdownData = coins.map(coin => Math.abs(this.data.risk_metrics[coin].max_drawdown));

        this.charts.risk = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: coins,
                datasets: [
                    {
                        label: 'Volatility (%)',
                        data: volatilityData,
                        borderColor: this.colors[0],
                        backgroundColor: this.colors[0] + '20',
                        pointBackgroundColor: this.colors[0],
                        pointBorderColor: this.colors[0],
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: this.colors[0]
                    },
                    {
                        label: 'Sharpe Ratio (x10)',
                        data: sharpeData,
                        borderColor: this.colors[1],
                        backgroundColor: this.colors[1] + '20',
                        pointBackgroundColor: this.colors[1],
                        pointBorderColor: this.colors[1],
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: this.colors[1]
                    },
                    {
                        label: 'Max Drawdown (%)',
                        data: maxDrawdownData,
                        borderColor: this.colors[2],
                        backgroundColor: this.colors[2] + '20',
                        pointBackgroundColor: this.colors[2],
                        pointBorderColor: this.colors[2],
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: this.colors[2]
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 60,
                        ticks: {
                            stepSize: 10
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.dataset.label === 'Sharpe Ratio (x10)') {
                                    label += (context.parsed.r / 10).toFixed(1);
                                } else {
                                    label += context.parsed.r.toFixed(1);
                                    label += context.dataset.label.includes('(%)') ? '%' : '';
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    createCorrelationChart() {
        const ctx = document.getElementById('correlationChart');
        if (!ctx) return;

        // Simulated correlation data
        const correlationData = [
            [1.0, 0.85, 0.72, 0.68],
            [0.85, 1.0, 0.78, 0.74],
            [0.72, 0.78, 1.0, 0.82],
            [0.68, 0.74, 0.82, 1.0]
        ];

        const coins = ['BTC', 'ETH', 'ADA', 'DOT'];
        const datasets = [];
        
        correlationData.forEach((row, rowIndex) => {
            row.forEach((correlation, colIndex) => {
                datasets.push({
                    label: `${coins[rowIndex]} vs ${coins[colIndex]}`,
                    data: [{
                        x: colIndex,
                        y: rowIndex,
                        v: correlation
                    }],
                    backgroundColor: this.getCorrelationColor(correlation),
                    borderColor: '#fff',
                    borderWidth: 1
                });
            });
        });

        this.charts.correlation = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        min: -0.5,
                        max: 3.5,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                return coins[value] || '';
                            }
                        },
                        title: {
                            display: false
                        }
                    },
                    y: {
                        type: 'linear',
                        min: -0.5,
                        max: 3.5,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                return coins[value] || '';
                            }
                        },
                        title: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: function(tooltipItems) {
                                const item = tooltipItems[0];
                                const coinX = coins[Math.round(item.parsed.x)];
                                const coinY = coins[Math.round(item.parsed.y)];
                                return `${coinY} vs ${coinX}`;
                            },
                            label: function(context) {
                                return `Correlation: ${context.raw.v.toFixed(2)}`;
                            }
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 15,
                        hoverRadius: 20
                    }
                }
            }
        });
    }

    getCorrelationColor(correlation) {
        // Color scale from red (low correlation) to green (high correlation)
        const intensity = Math.abs(correlation);
        const red = correlation < 0 ? 255 : Math.floor(255 * (1 - intensity));
        const green = correlation > 0 ? Math.floor(255 * intensity) : 0;
        const blue = 0;
        return `rgba(${red}, ${green}, ${blue}, 0.7)`;
    }

    updateChartVisibility() {
        const activeCoins = Array.from(this.activeCoinFilters);
        
        // Update all charts based on active filters
        Object.keys(this.charts).forEach(chartKey => {
            this.updateChartData(chartKey, activeCoins);
        });
    }

    updateChartData(chartKey, activeCoins) {
        const chart = this.charts[chartKey];
        if (!chart) return;

        switch (chartKey) {
            case 'performance':
                chart.data.datasets = chart.data.datasets.filter(dataset => 
                    activeCoins.includes(dataset.label)
                );
                break;
            case 'costValue':
                const filteredIndices = this.data.individual_coins
                    .map((coin, index) => activeCoins.includes(coin.symbol) ? index : -1)
                    .filter(index => index !== -1);
                
                chart.data.labels = filteredIndices.map(index => this.data.individual_coins[index].symbol);
                chart.data.datasets[0].data = filteredIndices.map(index => this.data.individual_coins[index].total_cost);
                chart.data.datasets[1].data = filteredIndices.map(index => this.data.individual_coins[index].current_value);
                break;
            case 'interest':
                chart.data.datasets = chart.data.datasets.filter(dataset => {
                    const coin = dataset.label.split(' ')[0];
                    return activeCoins.includes(coin);
                });
                break;
            case 'allocation':
                chart.data.datasets = chart.data.datasets.filter(dataset => 
                    activeCoins.includes(dataset.label)
                );
                break;
            case 'risk':
                chart.data.labels = activeCoins;
                chart.data.datasets.forEach((dataset, index) => {
                    if (index === 0) { // Volatility
                        dataset.data = activeCoins.map(coin => this.data.risk_metrics[coin].volatility);
                    } else if (index === 1) { // Sharpe Ratio
                        dataset.data = activeCoins.map(coin => this.data.risk_metrics[coin].sharpe_ratio * 10);
                    } else if (index === 2) { // Max Drawdown
                        dataset.data = activeCoins.map(coin => Math.abs(this.data.risk_metrics[coin].max_drawdown));
                    }
                });
                break;
            case 'correlation':
                const coins = ['BTC', 'ETH', 'ADA', 'DOT'];
                chart.data.datasets = chart.data.datasets.filter(dataset => {
                    const [coin1, coin2] = dataset.label.split(' vs ');
                    return activeCoins.includes(coin1) && activeCoins.includes(coin2);
                });
                break;
        }
        
        chart.update();
    }

    formatNumber(number) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(number);
    }

    formatAmount(amount, symbol) {
        if (symbol === 'BTC') {
            return `${amount.toFixed(6)} ${symbol}`;
        } else if (symbol === 'ETH') {
            return `${amount.toFixed(4)} ${symbol}`;
        } else {
            return `${amount.toLocaleString()} ${symbol}`;
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CryptoDashboard();
});

// Add modal styles dynamically
const modalStyles = `
<style>
.modal-coin-details {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.modal-metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
}

.modal-metric-card {
    padding: 16px;
    background: var(--color-bg-1);
    border-radius: var(--radius-base);
    text-align: center;
}

.modal-metric-card h4 {
    margin: 0 0 8px 0;
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.metric-value-large {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    margin-bottom: 4px;
}

.metric-value-large.profit {
    color: var(--color-success);
}

.metric-value-large.loss {
    color: var(--color-error);
}

.metric-subtitle {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
}

.metric-subtitle.profit {
    color: var(--color-success);
}

.metric-subtitle.loss {
    color: var(--color-error);
}

.modal-additional-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
}

.info-section h4 {
    margin: 0 0 16px 0;
    font-size: var(--font-size-lg);
    color: var(--color-text);
}

.info-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid var(--color-card-border-inner);
}

.info-item:last-child {
    border-bottom: none;
}

.info-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
}

.info-value {
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text);
}

@media (max-width: 768px) {
    .modal-metrics-grid {
        grid-template-columns: 1fr;
    }
    
    .modal-additional-info {
        grid-template-columns: 1fr;
    }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', modalStyles);