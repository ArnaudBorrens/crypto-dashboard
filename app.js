// Nexo Portfolio Dashboard - Main Application
class NexoPortfolioDashboard {
    constructor() {
        this.transactions = [];
        this.holdings = {};
        this.prices = {};
        this.allocationChart = null;
        this.priceUpdateInterval = null;
        
        // API Configuration
        this.coinGeckoAPI = 'https://api.coingecko.com/api/v3/simple/price';
        this.updateInterval = 30000; // 30 seconds
        
        // Currency mapping for CoinGecko API
        this.currencyMap = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum',
            'ADA': 'cardano',
            'DOT': 'polkadot',
            'LINK': 'chainlink',
            'USDC': 'usd-coin',
            'USDT': 'tether',
            'BNB': 'binancecoin',
            'SOL': 'solana',
            'MATIC': 'matic-network',
            'AVAX': 'avalanche-2',
            'ATOM': 'cosmos',
            'LTC': 'litecoin',
            'XRP': 'ripple'
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadSavedData();
        console.log('Nexo Portfolio Dashboard initialized');
    }
    
    setupEventListeners() {
        // File upload elements
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('csvFileInput');
        const browseButton = document.getElementById('browseButton');
        const clearDataButton = document.getElementById('clearDataButton');
        const uploadNewButton = document.getElementById('uploadNewButton');
        
        // Drag and drop events
        uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Click on upload area (but not on the browse button)
        uploadArea.addEventListener('click', (e) => {
            if (e.target !== browseButton && !browseButton.contains(e.target)) {
                fileInput.click();
            }
        });
        
        // Browse button click - prevent event bubbling and directly trigger file input
        browseButton.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            fileInput.click();
        });
        
        // File input events
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Action buttons
        if (clearDataButton) {
            clearDataButton.addEventListener('click', () => this.clearAllData());
        }
        if (uploadNewButton) {
            uploadNewButton.addEventListener('click', () => this.showUploadSection());
        }
        
        console.log('Event listeners attached successfully');
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.classList.add('drag-over');
    }
    
    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.classList.remove('drag-over');
    }
    
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }
    
    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }
    
    processFile(file) {
        console.log('Processing file:', file.name);
        
        if (!file.name.toLowerCase().endsWith('.csv')) {
            this.showError('Please select a CSV file');
            return;
        }
        
        this.showProcessing();
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csvData = e.target.result;
                this.parseCSV(csvData);
            } catch (error) {
                console.error('Error processing file:', error);
                this.showError('Error processing file: ' + error.message);
            }
        };
        
        reader.onerror = () => {
            this.showError('Error reading file');
        };
        
        reader.readAsText(file);
    }
    
    parseCSV(csvData) {
        console.log('Parsing CSV data...');
        
        const lines = csvData.trim().split('\n');
        if (lines.length < 2) {
            this.showError('CSV file appears to be empty or invalid');
            return;
        }
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        console.log('CSV Headers:', headers);
        
        // Detect CSV format
        const isNewFormat = headers.includes('Input Currency') && headers.includes('Output Currency');
        console.log('CSV Format:', isNewFormat ? 'New Format' : 'Old Format');
        
        const transactions = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length < headers.length - 2) continue; // Skip incomplete lines
            
            const transaction = {};
            headers.forEach((header, index) => {
                transaction[header] = values[index] || '';
            });
            
            // Validate required fields
            if (transaction['Transaction'] && transaction['Type'] && transaction['Date / Time']) {
                transactions.push(transaction);
            }
        }
        
        if (transactions.length === 0) {
            this.showError('No valid transactions found in CSV');
            return;
        }
        
        console.log(`Parsed ${transactions.length} transactions`);
        this.transactions = transactions;
        this.calculateHoldings();
        this.saveData();
        this.showSuccess(transactions.length);
        this.displayPortfolio();
        this.startPriceUpdates();
    }
    
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current.trim());
        return values;
    }
    
    calculateHoldings() {
        console.log('Calculating holdings...');
        this.holdings = {};
        
        this.transactions.forEach(tx => {
            const type = tx.Type;
            const currency = tx.Currency;
            const amount = parseFloat(tx.Amount) || 0;
            
            // Handle new format with Input/Output currencies
            const inputCurrency = tx['Input Currency'];
            const inputAmount = parseFloat(tx['Input Amount']) || 0;
            const outputCurrency = tx['Output Currency'];
            const outputAmount = parseFloat(tx['Output Amount']) || 0;
            
            if (type === 'Exchange' && inputCurrency && outputCurrency) {
                // New format exchange
                this.updateHolding(inputCurrency, inputAmount);
                this.updateHolding(outputCurrency, outputAmount);
            } else if (currency && amount !== 0) {
                // Old format or simple transaction
                this.updateHolding(currency, amount);
            }
        });
        
        // Remove holdings with zero or negative amounts
        Object.keys(this.holdings).forEach(currency => {
            if (this.holdings[currency] <= 0.00000001) {
                delete this.holdings[currency];
            }
        });
        
        console.log('Holdings calculated:', this.holdings);
    }
    
    updateHolding(currency, amount) {
        if (!currency || isNaN(amount)) return;
        
        if (!this.holdings[currency]) {
            this.holdings[currency] = 0;
        }
        this.holdings[currency] += amount;
    }
    
    async fetchPrices() {
        console.log('Fetching current prices...');
        
        const currencies = Object.keys(this.holdings);
        const coinIds = currencies
            .map(currency => this.currencyMap[currency])
            .filter(id => id);
        
        if (coinIds.length === 0) {
            console.log('No supported currencies found for price fetching');
            return;
        }
        
        try {
            const response = await fetch(
                `${this.coinGeckoAPI}?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_change=true`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Prices fetched:', data);
            
            // Map back to our currency symbols
            currencies.forEach(currency => {
                const coinId = this.currencyMap[currency];
                if (coinId && data[coinId]) {
                    this.prices[currency] = {
                        usd: data[coinId].usd,
                        usd_24h_change: data[coinId].usd_24h_change || 0
                    };
                }
            });
            
            this.updatePortfolioDisplay();
            
        } catch (error) {
            console.error('Error fetching prices:', error);
        }
    }
    
    displayPortfolio() {
        console.log('Displaying portfolio...');
        
        // Show portfolio section
        document.getElementById('portfolioSection').classList.remove('hidden');
        document.getElementById('portfolioSection').classList.add('fade-in');
        
        // Hide upload section
        document.getElementById('uploadContainer').style.display = 'none';
        
        // Update holdings table
        this.updateHoldingsTable();
        
        // Update transactions table
        this.updateTransactionsTable();
        
        // Create allocation chart
        this.createAllocationChart();
        
        // Fetch initial prices
        this.fetchPrices();
    }
    
    updatePortfolioDisplay() {
        console.log('Updating portfolio display with current prices...');
        
        let totalValue = 0;
        let totalInvested = 0;
        
        // Calculate totals
        Object.keys(this.holdings).forEach(currency => {
            const amount = this.holdings[currency];
            const price = this.prices[currency]?.usd || 0;
            totalValue += amount * price;
            
            // Calculate invested amount from deposits
            const invested = this.calculateInvestedAmount(currency);
            totalInvested += invested;
        });
        
        const totalPnL = totalValue - totalInvested;
        const pnlPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
        
        // Update summary cards
        document.getElementById('totalValue').textContent = `$${totalValue.toFixed(2)}`;
        document.getElementById('totalPnL').textContent = `$${totalPnL.toFixed(2)}`;
        document.getElementById('pnlPercentage').textContent = `${pnlPercentage.toFixed(2)}%`;
        document.getElementById('totalAssets').textContent = Object.keys(this.holdings).length;
        
        // Update PnL color
        const pnlElement = document.getElementById('totalPnL');
        pnlElement.className = totalPnL >= 0 ? 'metric-value text-success' : 'metric-value text-error';
        
        // Update holdings table
        this.updateHoldingsTable();
    }
    
    calculateInvestedAmount(currency) {
        let invested = 0;
        this.transactions.forEach(tx => {
            if ((tx.Currency === currency || tx['Output Currency'] === currency) && 
                (tx.Type === 'Deposit' || tx.Type === 'Exchange')) {
                const usdValue = parseFloat(tx['USD Equivalent']) || 0;
                if (usdValue > 0) invested += usdValue;
            }
        });
        return invested;
    }
    
    updateHoldingsTable() {
        const tbody = document.getElementById('holdingsTableBody');
        tbody.innerHTML = '';
        
        Object.keys(this.holdings).forEach(currency => {
            const amount = this.holdings[currency];
            const priceData = this.prices[currency];
            const currentPrice = priceData?.usd || 0;
            const change24h = priceData?.usd_24h_change || 0;
            const value = amount * currentPrice;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="asset-cell">${currency}</td>
                <td>${amount.toFixed(8)}</td>
                <td>$${currentPrice.toFixed(4)}</td>
                <td>$${value.toFixed(2)}</td>
                <td>
                    <span class="price-change ${change24h >= 0 ? 'positive' : 'negative'}">
                        ${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%
                    </span>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    updateTransactionsTable() {
        const tbody = document.getElementById('transactionsTableBody');
        tbody.innerHTML = '';
        
        // Show last 10 transactions
        const recentTransactions = this.transactions
            .sort((a, b) => new Date(b['Date / Time']) - new Date(a['Date / Time']))
            .slice(0, 10);
        
        recentTransactions.forEach(tx => {
            const date = new Date(tx['Date / Time']).toLocaleDateString();
            const type = tx.Type;
            const currency = tx.Currency || `${tx['Input Currency']} → ${tx['Output Currency']}`;
            const amount = tx.Amount || `${tx['Input Amount']} → ${tx['Output Amount']}`;
            const usdValue = parseFloat(tx['USD Equivalent']) || 0;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${date}</td>
                <td><span class="transaction-type ${type.toLowerCase()}">${type}</span></td>
                <td>${currency}</td>
                <td>${amount}</td>
                <td>$${usdValue.toFixed(2)}</td>
            `;
            tbody.appendChild(row);
        });
    }
    
    createAllocationChart() {
        const ctx = document.getElementById('allocationChart').getContext('2d');
        
        if (this.allocationChart) {
            this.allocationChart.destroy();
        }
        
        const currencies = Object.keys(this.holdings);
        const values = currencies.map(currency => {
            const amount = this.holdings[currency];
            const price = this.prices[currency]?.usd || 0;
            return amount * price;
        });
        
        const colors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325', '#944454', '#13343B'];
        
        this.allocationChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: currencies,
                datasets: [{
                    data: values,
                    backgroundColor: colors.slice(0, currencies.length),
                    borderWidth: 2,
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--color-surface')
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            color: getComputedStyle(document.documentElement).getPropertyValue('--color-text')
                        }
                    }
                }
            }
        });
    }
    
    startPriceUpdates() {
        // Clear existing interval
        if (this.priceUpdateInterval) {
            clearInterval(this.priceUpdateInterval);
        }
        
        // Start new interval
        this.priceUpdateInterval = setInterval(() => {
            this.fetchPrices();
        }, this.updateInterval);
        
        console.log('Started price updates every 30 seconds');
    }
    
    showProcessing() {
        document.getElementById('uploadArea').style.display = 'none';
        document.getElementById('uploadStatus').classList.remove('hidden');
        document.getElementById('uploadSuccess').classList.add('hidden');
        
        // Remove any existing error
        const errorDiv = document.getElementById('uploadError');
        if (errorDiv) {
            errorDiv.classList.add('hidden');
        }
    }
    
    showSuccess(transactionCount) {
        document.getElementById('uploadStatus').classList.add('hidden');
        document.getElementById('uploadSuccess').classList.remove('hidden');
        document.getElementById('transactionCount').textContent = transactionCount;
        
        // Remove any existing error
        const errorDiv = document.getElementById('uploadError');
        if (errorDiv) {
            errorDiv.classList.add('hidden');
        }
    }
    
    showError(message) {
        document.getElementById('uploadStatus').classList.add('hidden');
        document.getElementById('uploadSuccess').classList.add('hidden');
        
        // Create or update error display
        let errorDiv = document.getElementById('uploadError');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'uploadError';
            errorDiv.className = 'upload-error';
            document.getElementById('uploadContainer').appendChild(errorDiv);
        }
        
        errorDiv.innerHTML = `
            <div class="error-icon">❌</div>
            <p class="error-message">${message}</p>
            <button class="btn btn--secondary" onclick="window.portfolioDashboard.resetUpload()">Try Again</button>
        `;
        errorDiv.classList.remove('hidden');
    }
    
    resetUpload() {
        document.getElementById('uploadArea').style.display = 'flex';
        document.getElementById('uploadStatus').classList.add('hidden');
        document.getElementById('uploadSuccess').classList.add('hidden');
        
        const errorDiv = document.getElementById('uploadError');
        if (errorDiv) {
            errorDiv.classList.add('hidden');
        }
        
        // Clear file input
        document.getElementById('csvFileInput').value = '';
    }
    
    saveData() {
        try {
            const data = {
                transactions: this.transactions,
                holdings: this.holdings,
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem('nexoPortfolioData', JSON.stringify(data));
            console.log('Data saved to localStorage');
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }
    
    loadSavedData() {
        try {
            const savedData = localStorage.getItem('nexoPortfolioData');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.transactions = data.transactions || [];
                this.holdings = data.holdings || {};
                
                if (this.transactions.length > 0) {
                    console.log(`Loaded ${this.transactions.length} transactions from localStorage`);
                    this.displayPortfolio();
                    this.startPriceUpdates();
                }
            }
        } catch (error) {
            console.error('Error loading saved data:', error);
        }
    }
    
    clearAllData() {
        if (confirm('Are you sure you want to clear all portfolio data? This cannot be undone.')) {
            localStorage.removeItem('nexoPortfolioData');
            location.reload();
        }
    }
    
    showUploadSection() {
        document.getElementById('portfolioSection').classList.add('hidden');
        document.getElementById('uploadContainer').style.display = 'block';
        
        // Reset upload area
        this.resetUpload();
    }
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Nexo Portfolio Dashboard...');
    window.portfolioDashboard = new NexoPortfolioDashboard();
});