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
        
        // Expected Nexo CSV headers
        this.expectedHeaders = [
            "Transaction", "Type", "Input Currency", "Input Amount", 
            "Output Currency", "Output Amount", "USD Equivalent", 
            "Details", "Date / Time (UTC)"
        ];
        
        // Transaction type mapping
        this.transactionTypeMapping = {
            "Interest": "Interest",
            "Fixed Term Interest": "Interest", 
            "Exchange": "Trade",
            "Exchange Cashback": "Reward",
            "Cashback": "Reward",
            "Deposit To Exchange": "Deposit",
            "Top up Crypto": "Deposit",
            "Transfer In": "Deposit",
            "Nexo Card Purchase": "Spend",
            "Manual Repayment": "Repayment",
            "Manual Sell Order": "Trade",
            "Locking Term Deposit": "Internal",
            "Unlocking Term Deposit": "Internal",
            "Exchange Deposited On": "Internal"
        };
        
        // Currency mapping for CoinGecko API
        this.currencyMap = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum',
            'ADA': 'cardano',
            'USDC': 'usd-coin',
            'USDT': 'tether',
            'EURX': 'stasis-eurs',
            'NEXO': 'nexo',
            'XLM': 'stellar',
            'GRT': 'the-graph',
            'POL': 'polygon-ecosystem-token',
            'MATIC': 'matic-network',
            'AXS': 'axie-infinity',
            'LUNA2': 'terra-luna-2',
            'LUNC': 'terra-luna',
            'ETHW': 'ethereum-pow-iou',
            'ATOM': 'cosmos',
            'AVAX': 'avalanche-2',
            'USTC': 'terrausd',
            'DOT': 'polkadot',
            'LINK': 'chainlink',
            'BNB': 'binancecoin',
            'SOL': 'solana',
            'LTC': 'litecoin',
            'XRP': 'ripple'
        };
        
        this.init();
    }
    
    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupEventListeners();
                console.log('Nexo Portfolio Dashboard initialized');
            });
        } else {
            this.setupEventListeners();
            console.log('Nexo Portfolio Dashboard initialized');
        }
    }
    
    setupEventListeners() {
        // File upload elements
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('csvFileInput');
        const browseButton = document.getElementById('browseButton');
        const clearDataButton = document.getElementById('clearDataButton');
        const uploadNewButton = document.getElementById('uploadNewButton');
        
        if (!uploadArea || !fileInput || !browseButton) {
            console.error('Required DOM elements not found');
            return;
        }
        
        // Drag and drop events
        uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Click on upload area (but not on the browse button)
        uploadArea.addEventListener('click', (e) => {
            if (e.target !== browseButton && !browseButton.contains(e.target)) {
                e.preventDefault();
                fileInput.click();
            }
        });
        
        // Browse button click - ensure it works
        browseButton.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            console.log('Browse button clicked');
            fileInput.click();
        });
        
        // File input events
        fileInput.addEventListener('change', (e) => {
            console.log('File input changed');
            this.handleFileSelect(e);
        });
        
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
            console.log('File dropped:', files[0].name);
            this.processFile(files[0]);
        }
    }
    
    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            console.log('File selected:', files[0].name);
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
        
        // Parse header line more carefully
        const headerLine = lines[0];
        const headers = this.parseCSVLine(headerLine).map(h => h.trim());
        console.log('CSV Headers found:', headers);
        console.log('Expected headers:', this.expectedHeaders);
        
        // Validate headers against expected Nexo format
        const headersMatch = this.validateNexoHeaders(headers);
        if (!headersMatch) {
            this.showError(`Invalid CSV format. Expected Nexo CSV headers:
                ${this.expectedHeaders.join(', ')}
                
                Found headers:
                ${headers.join(', ')}
                
                Please ensure you've exported the CSV from Nexo with the correct format.`);
            return;
        }
        
        console.log('Headers validated successfully');
        
        const transactions = [];
        let invalidRows = 0;
        
        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
            try {
                const values = this.parseCSVLine(lines[i]);
                if (values.length < 8) {
                    console.log(`Row ${i + 1}: Too few columns, skipping`);
                    invalidRows++;
                    continue;
                }
                
                const transaction = {};
                headers.forEach((header, index) => {
                    transaction[header] = values[index] ? values[index].trim() : '';
                });
                
                // Validate and process transaction
                const processedTransaction = this.processTransaction(transaction);
                if (processedTransaction) {
                    transactions.push(processedTransaction);
                } else {
                    invalidRows++;
                }
                
            } catch (error) {
                console.error(`Error parsing row ${i + 1}:`, error);
                invalidRows++;
            }
        }
        
        console.log(`Parsed ${transactions.length} valid transactions, ${invalidRows} invalid rows`);
        
        if (transactions.length === 0) {
            this.showError('No valid transactions found in CSV. Please check that your CSV file contains Nexo transaction data with the correct format.');
            return;
        }
        
        this.transactions = transactions;
        this.calculateHoldings();
        this.showSuccess(transactions.length);
        this.displayPortfolio();
        this.startPriceUpdates();
    }
    
    validateNexoHeaders(headers) {
        // Check if headers match expected Nexo format
        if (headers.length !== this.expectedHeaders.length) {
            return false;
        }
        
        for (let i = 0; i < this.expectedHeaders.length; i++) {
            if (headers[i] !== this.expectedHeaders[i]) {
                return false;
            }
        }
        
        return true;
    }
    
    processTransaction(rawTransaction) {
        try {
            // Extract basic fields
            const transactionId = rawTransaction['Transaction'] || '';
            const type = rawTransaction['Type'] || '';
            const dateTimeStr = rawTransaction['Date / Time (UTC)'] || '';
            
            // Validate required fields
            if (!transactionId || !type || !dateTimeStr) {
                console.log('Missing required fields:', { transactionId, type, dateTimeStr });
                return null;
            }
            
            // Parse date - handle "M/D/YYYY H:MM" format
            const parsedDate = this.parseNexoDate(dateTimeStr);
            if (!parsedDate) {
                console.log('Invalid date format:', dateTimeStr);
                return null;
            }
            
            // Parse USD equivalent - strip $ and commas
            const usdEquivalentStr = rawTransaction['USD Equivalent'] || '0';
            const usdEquivalent = this.parseUSDValue(usdEquivalentStr);
            
            // Extract currency and amount information
            const inputCurrency = rawTransaction['Input Currency'] || '';
            const inputAmountStr = rawTransaction['Input Amount'] || '0';
            const outputCurrency = rawTransaction['Output Currency'] || '';
            const outputAmountStr = rawTransaction['Output Amount'] || '0';
            
            const inputAmount = this.parseAmount(inputAmountStr);
            const outputAmount = this.parseAmount(outputAmountStr);
            
            // Map transaction type
            const mappedType = this.transactionTypeMapping[type] || type;
            
            return {
                id: transactionId,
                type: type,
                mappedType: mappedType,
                inputCurrency: inputCurrency,
                inputAmount: inputAmount,
                outputCurrency: outputCurrency,
                outputAmount: outputAmount,
                usdEquivalent: usdEquivalent,
                details: rawTransaction['Details'] || '',
                date: parsedDate,
                dateStr: dateTimeStr
            };
            
        } catch (error) {
            console.error('Error processing transaction:', error);
            return null;
        }
    }
    
    parseNexoDate(dateStr) {
        try {
            // Handle "M/D/YYYY H:MM" format
            // Example: "9/1/2025 5:00" or "12/31/2024 23:59"
            if (!dateStr || typeof dateStr !== 'string') {
                return null;
            }
            
            const cleanDateStr = dateStr.trim();
            
            // Split date and time parts
            const [datePart, timePart] = cleanDateStr.split(' ');
            if (!datePart || !timePart) {
                return null;
            }
            
            // Parse date part (M/D/YYYY)
            const [month, day, year] = datePart.split('/');
            if (!month || !day || !year) {
                return null;
            }
            
            // Parse time part (H:MM or HH:MM)
            const [hour, minute] = timePart.split(':');
            if (!hour || !minute) {
                return null;
            }
            
            // Create date object (months are 0-indexed in JavaScript)
            const date = new Date(
                parseInt(year), 
                parseInt(month) - 1, 
                parseInt(day), 
                parseInt(hour), 
                parseInt(minute)
            );
            
            // Validate the date
            if (isNaN(date.getTime())) {
                return null;
            }
            
            return date;
            
        } catch (error) {
            console.error('Error parsing date:', dateStr, error);
            return null;
        }
    }
    
    parseUSDValue(usdStr) {
        try {
            if (!usdStr || typeof usdStr !== 'string') {
                return 0;
            }
            
            // Remove $, commas, and spaces
            const cleanStr = usdStr.replace(/[$,\s]/g, '');
            const value = parseFloat(cleanStr);
            
            return isNaN(value) ? 0 : value;
        } catch (error) {
            console.error('Error parsing USD value:', usdStr, error);
            return 0;
        }
    }
    
    parseAmount(amountStr) {
        try {
            if (!amountStr || typeof amountStr !== 'string') {
                return 0;
            }
            
            // Remove commas and spaces
            const cleanStr = amountStr.replace(/[,\s]/g, '');
            const value = parseFloat(cleanStr);
            
            return isNaN(value) ? 0 : value;
        } catch (error) {
            console.error('Error parsing amount:', amountStr, error);
            return 0;
        }
    }
    
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = null;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if ((char === '"' || char === "'") && !inQuotes) {
                inQuotes = true;
                quoteChar = char;
            } else if (char === quoteChar && inQuotes) {
                // Check if this is an escaped quote
                if (i + 1 < line.length && line[i + 1] === quoteChar) {
                    current += char;
                    i++; // Skip next quote
                } else {
                    inQuotes = false;
                    quoteChar = null;
                }
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current);
        return values;
    }
    
    calculateHoldings() {
        console.log('Calculating holdings...');
        this.holdings = {};
        
        this.transactions.forEach(tx => {
            // Skip internal transfers
            if (tx.mappedType === 'Internal') {
                return;
            }
            
            const type = tx.type;
            
            // Handle different transaction types
            if (type === 'Exchange') {
                // For exchanges: subtract input, add output
                if (tx.inputCurrency && tx.inputAmount > 0) {
                    this.updateHolding(tx.inputCurrency, -tx.inputAmount);
                }
                if (tx.outputCurrency && tx.outputAmount > 0) {
                    this.updateHolding(tx.outputCurrency, tx.outputAmount);
                }
            } else if (type === 'Interest' || type === 'Fixed Term Interest' || 
                       type === 'Cashback' || type === 'Exchange Cashback') {
                // For earnings: add output amount
                if (tx.outputCurrency && tx.outputAmount > 0) {
                    this.updateHolding(tx.outputCurrency, tx.outputAmount);
                }
            } else if (type === 'Deposit To Exchange' || type === 'Top up Crypto' || 
                       type === 'Transfer In') {
                // For deposits: add output amount
                if (tx.outputCurrency && tx.outputAmount > 0) {
                    this.updateHolding(tx.outputCurrency, tx.outputAmount);
                }
            } else if (type === 'Nexo Card Purchase') {
                // For spending: subtract input amount
                if (tx.inputCurrency && tx.inputAmount > 0) {
                    this.updateHolding(tx.inputCurrency, -tx.inputAmount);
                }
            }
        });
        
        // Remove holdings with zero or negligible amounts
        Object.keys(this.holdings).forEach(currency => {
            if (Math.abs(this.holdings[currency]) < 0.00000001) {
                delete this.holdings[currency];
            }
        });
        
        console.log('Holdings calculated:', this.holdings);
    }
    
    updateHolding(currency, amount) {
        if (!currency || isNaN(amount) || amount === 0) return;
        
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
        const portfolioSection = document.getElementById('portfolioSection');
        if (portfolioSection) {
            portfolioSection.classList.remove('hidden');
            portfolioSection.classList.add('fade-in');
        }
        
        // Hide upload section
        const uploadContainer = document.getElementById('uploadContainer');
        if (uploadContainer) {
            uploadContainer.style.display = 'none';
        }
        
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
        let totalInterest = 0;
        let totalRewards = 0;
        
        // Calculate totals
        Object.keys(this.holdings).forEach(currency => {
            const amount = this.holdings[currency];
            const price = this.prices[currency]?.usd || 0;
            totalValue += amount * price;
        });
        
        // Calculate interest and rewards from transactions
        this.transactions.forEach(tx => {
            if (tx.mappedType === 'Interest') {
                totalInterest += tx.usdEquivalent;
            } else if (tx.mappedType === 'Reward') {
                totalRewards += tx.usdEquivalent;
            }
        });
        
        // Update summary cards
        const totalValueEl = document.getElementById('totalValue');
        const totalPnLEl = document.getElementById('totalPnL');
        const pnlPercentageEl = document.getElementById('pnlPercentage');
        const totalAssetsEl = document.getElementById('totalAssets');
        
        if (totalValueEl) totalValueEl.textContent = `$${totalValue.toFixed(2)}`;
        if (totalPnLEl) totalPnLEl.textContent = `$${(totalInterest + totalRewards).toFixed(2)}`;
        if (pnlPercentageEl) pnlPercentageEl.textContent = `Interest: $${totalInterest.toFixed(2)} | Rewards: $${totalRewards.toFixed(2)}`;
        if (totalAssetsEl) totalAssetsEl.textContent = Object.keys(this.holdings).length;
        
        // Update holdings table
        this.updateHoldingsTable();
    }
    
    updateHoldingsTable() {
        const tbody = document.getElementById('holdingsTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        Object.keys(this.holdings)
            .sort((a, b) => {
                const aValue = this.holdings[a] * (this.prices[a]?.usd || 0);
                const bValue = this.holdings[b] * (this.prices[b]?.usd || 0);
                return bValue - aValue;
            })
            .forEach(currency => {
                const amount = this.holdings[currency];
                const priceData = this.prices[currency];
                const currentPrice = priceData?.usd || 0;
                const change24h = priceData?.usd_24h_change || 0;
                const value = amount * currentPrice;
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="asset-cell">${currency}</td>
                    <td>${amount.toFixed(8)}</td>
                    <td>$${currentPrice.toFixed(currentPrice < 1 ? 6 : 2)}</td>
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
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        // Show last 15 transactions, sorted by date
        const recentTransactions = this.transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 15);
        
        recentTransactions.forEach(tx => {
            const date = tx.date.toLocaleDateString();
            const type = tx.type;
            let currency = '';
            let amount = '';
            
            // Format currency and amount based on transaction type
            if (tx.type === 'Exchange') {
                currency = `${tx.inputCurrency} → ${tx.outputCurrency}`;
                amount = `${tx.inputAmount} → ${tx.outputAmount}`;
            } else if (tx.outputCurrency && tx.outputAmount > 0) {
                currency = tx.outputCurrency;
                amount = tx.outputAmount.toFixed(8);
            } else if (tx.inputCurrency && tx.inputAmount > 0) {
                currency = tx.inputCurrency;
                amount = `-${tx.inputAmount.toFixed(8)}`;
            }
            
            const usdValue = tx.usdEquivalent;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${date}</td>
                <td><span class="transaction-type ${tx.mappedType.toLowerCase()}">${type}</span></td>
                <td>${currency}</td>
                <td>${amount}</td>
                <td>$${usdValue.toFixed(2)}</td>
            `;
            tbody.appendChild(row);
        });
    }
    
    createAllocationChart() {
        const ctx = document.getElementById('allocationChart');
        if (!ctx) return;
        
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
        const uploadArea = document.getElementById('uploadArea');
        const uploadStatus = document.getElementById('uploadStatus');
        const uploadSuccess = document.getElementById('uploadSuccess');
        
        if (uploadArea) uploadArea.style.display = 'none';
        if (uploadStatus) uploadStatus.classList.remove('hidden');
        if (uploadSuccess) uploadSuccess.classList.add('hidden');
        
        // Remove any existing error
        const errorDiv = document.getElementById('uploadError');
        if (errorDiv) {
            errorDiv.remove();
        }
    }
    
    showSuccess(transactionCount) {
        const uploadStatus = document.getElementById('uploadStatus');
        const uploadSuccess = document.getElementById('uploadSuccess');
        const transactionCountEl = document.getElementById('transactionCount');
        
        if (uploadStatus) uploadStatus.classList.add('hidden');
        if (uploadSuccess) uploadSuccess.classList.remove('hidden');
        if (transactionCountEl) transactionCountEl.textContent = transactionCount;
        
        // Remove any existing error
        const errorDiv = document.getElementById('uploadError');
        if (errorDiv) {
            errorDiv.remove();
        }
    }
    
    showError(message) {
        const uploadStatus = document.getElementById('uploadStatus');
        const uploadSuccess = document.getElementById('uploadSuccess');
        
        if (uploadStatus) uploadStatus.classList.add('hidden');
        if (uploadSuccess) uploadSuccess.classList.add('hidden');
        
        // Create or update error display
        let errorDiv = document.getElementById('uploadError');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'uploadError';
            errorDiv.className = 'upload-error';
            const uploadContainer = document.getElementById('uploadContainer');
            if (uploadContainer) {
                uploadContainer.appendChild(errorDiv);
            }
        }
        
        errorDiv.innerHTML = `
            <div class="error-icon">❌</div>
            <div class="error-message">${message.replace(/\n/g, '<br>')}</div>
            <button class="btn btn--secondary" onclick="window.portfolioDashboard.resetUpload()">Try Again</button>
        `;
        errorDiv.classList.remove('hidden');
    }
    
    resetUpload() {
        const uploadArea = document.getElementById('uploadArea');
        const uploadStatus = document.getElementById('uploadStatus');
        const uploadSuccess = document.getElementById('uploadSuccess');
        const csvFileInput = document.getElementById('csvFileInput');
        
        if (uploadArea) uploadArea.style.display = 'flex';
        if (uploadStatus) uploadStatus.classList.add('hidden');
        if (uploadSuccess) uploadSuccess.classList.add('hidden');
        
        const errorDiv = document.getElementById('uploadError');
        if (errorDiv) {
            errorDiv.remove();
        }
        
        // Clear file input
        if (csvFileInput) csvFileInput.value = '';
    }
    
    clearAllData() {
        if (confirm('Are you sure you want to clear all portfolio data? This cannot be undone.')) {
            this.transactions = [];
            this.holdings = {};
            this.prices = {};
            
            if (this.priceUpdateInterval) {
                clearInterval(this.priceUpdateInterval);
            }
            
            location.reload();
        }
    }
    
    showUploadSection() {
        const portfolioSection = document.getElementById('portfolioSection');
        const uploadContainer = document.getElementById('uploadContainer');
        
        if (portfolioSection) portfolioSection.classList.add('hidden');
        if (uploadContainer) uploadContainer.style.display = 'block';
        
        // Reset upload area
        this.resetUpload();
        
        // Clear price update interval
        if (this.priceUpdateInterval) {
            clearInterval(this.priceUpdateInterval);
        }
    }
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Nexo Portfolio Dashboard...');
    window.portfolioDashboard = new NexoPortfolioDashboard();
});