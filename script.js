const API_BASE_URL = 'http://localhost:8080/api';
        let authToken = localStorage.getItem('authToken');
        let currentUser = null;
        let userAccounts = [];

        // Initialize the application
        document.addEventListener('DOMContentLoaded', function() {
            if (authToken) {
                showDashboard();
                loadUserData();
            } else {
                showAuthContainer();
            }
        });

        // Authentication Functions
        function toggleForm(formType) {
            const loginForm = document.getElementById('loginForm');
            const registerForm = document.getElementById('registerForm');
            
            if (formType === 'register') {
                loginForm.classList.remove('active');
                registerForm.classList.add('active');
            } else {
                registerForm.classList.remove('active');
                loginForm.classList.add('active');
            }
        }

        async function login(event) {
            event.preventDefault();
            
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            
            showLoading(true);
            
            try {
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    authToken = data.token;
                    localStorage.setItem('authToken', authToken);
                    currentUser = data.user;
                    showAlert('Login successful!', 'success');
                    setTimeout(() => {
                        showDashboard();
                        loadUserData();
                    }, 1000);
                } else {
                    showAlert(data.message || 'Login failed', 'error');
                }
            } catch (error) {
                showAlert('Network error. Please try again.', 'error');
            } finally {
                showLoading(false);
            }
        }

        async function register(event) {
            event.preventDefault();
            
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const username = document.getElementById('registerUsername').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (password !== confirmPassword) {
                showAlert('Passwords do not match', 'error');
                return;
            }
            
            showLoading(true);
            
            try {
                const response = await fetch(`${API_BASE_URL}/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        firstName,
                        lastName,
                        username,
                        email,
                        phone,
                        password
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showAlert('Registration successful! Please login.', 'success');
                    setTimeout(() => {
                        toggleForm('login');
                        document.getElementById('registerForm').reset();
                    }, 1000);
                } else {
                    showAlert(data.message || 'Registration failed', 'error');
                }
            } catch (error) {
                showAlert('Network error. Please try again.', 'error');
            } finally {
                showLoading(false);
            }
        }

        function logout() {
            authToken = null;
            currentUser = null;
            userAccounts = [];
            localStorage.removeItem('authToken');
            showAuthContainer();
            showAlert('Logged out successfully', 'success');
        }

        // UI Functions
        function showAuthContainer() {
            document.getElementById('authContainer').style.display = 'block';
            document.getElementById('dashboard').classList.remove('active');
            document.getElementById('userInfo').classList.remove('active');
        }

        function showDashboard() {
            document.getElementById('authContainer').style.display = 'none';
            document.getElementById('dashboard').classList.add('active');
            document.getElementById('userInfo').classList.add('active');
        }

        function showAlert(message, type) {
            const alert = document.getElementById('alert');
            const alertMessage = document.getElementById('alertMessage');
            
            alertMessage.textContent = message;
            alert.className = `alert ${type} show`;
            
            setTimeout(() => {
                alert.classList.remove('show');
            }, 5000);
        }

        function showLoading(show) {
            document.getElementById('loading').style.display = show ? 'block' : 'none';
        }

        function showTransactionForm(type) {
            // Hide all forms
            document.querySelectorAll('.transaction-form').forEach(form => {
                form.classList.remove('active');
            });
            
            // Remove active class from all tabs
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show selected form and activate tab
            document.getElementById(`${type}Form`).classList.add('active');
            event.target.classList.add('active');
        }

        // Data Loading Functions
        async function loadUserData() {
            if (!currentUser) {
                try {
                    const response = await fetch(`${API_BASE_URL}/user/profile`, {
                        headers: {
                            'Authorization': `Bearer ${authToken}`
                        }
                    });
                    
                    if (response.ok) {
                        currentUser = await response.json();
                    }
                } catch (error) {
                    console.error('Error loading user data:', error);
                }
            }
            
            if (currentUser) {
                document.getElementById('username').textContent = currentUser.username;
            }
            
            await loadAccounts();
            await loadTransactions();
        }

        async function loadAccounts() {
            try {
                const response = await fetch(`${API_BASE_URL}/accounts`, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });
                
                if (response.ok) {
                    userAccounts = await response.json();
                    displayAccounts();
                    populateAccountDropdowns();
                }
            } catch (error) {
                console.error('Error loading accounts:', error);
            }
        }

        function displayAccounts() {
            const accountsList = document.getElementById('accountsList');
            
            if (userAccounts.length === 0) {
                accountsList.innerHTML = '<p>No accounts found. Create your first account!</p>';
                return;
            }
            
            accountsList.innerHTML = userAccounts.map(account => `
                <div style="margin-bottom: 15px; padding: 15px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <div class="account-balance">$${parseFloat(account.balance).toFixed(2)}</div>
                    <div class="account-number">${account.accountType} - ${account.accountNumber}</div>
                </div>
            `).join('');
        }

        function populateAccountDropdowns() {
            const dropdowns = [
                'depositAccount',
                'withdrawAccount',
                'transferFromAccount'
            ];
            
            dropdowns.forEach(dropdownId => {
                const dropdown = document.getElementById(dropdownId);
                dropdown.innerHTML = '<option value="">Select Account</option>';
                
                userAccounts.forEach(account => {
                    const option = document.createElement('option');
                    option.value = account.accountNumber;
                    option.textContent = `${account.accountType} - ${account.accountNumber} ($${parseFloat(account.balance).toFixed(2)})`;
                    dropdown.appendChild(option);
                });
            });
        }

        async function loadTransactions() {
            try {
                const response = await fetch(`${API_BASE_URL}/transactions`, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });
                
                if (response.ok) {
                    const transactions = await response.json();
                    displayTransactions(transactions);
                }
            } catch (error) {
                console.error('Error loading transactions:', error);
            }
        }

        function displayTransactions(transactions) {
            const transactionsList = document.getElementById('transactionsList');
            
            if (transactions.length === 0) {
                transactionsList.innerHTML = '<p>No transactions found.</p>';
                return;
            }
            
            transactionsList.innerHTML = transactions.map(transaction => {
                const isCredit = transaction.transactionType === 'DEPOSIT' || 
                               (transaction.transactionType === 'TRANSFER' && transaction.toAccount);
                const amount = parseFloat(transaction.amount);
                
                return `
                    <div class="transaction-item">
                        <div class="transaction-info">
                            <div class="transaction-icon ${transaction.transactionType.toLowerCase()}">
                                <i class="fas fa-${getTransactionIcon(transaction.transactionType)}"></i>
                            </div>
                            <div class="transaction-details">
                                <h4>${transaction.transactionType}</h4>
                                <p>${transaction.description || 'No description'}</p>
                                <p>${new Date(transaction.transactionDate).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div class="transaction-amount ${isCredit ? 'positive' : 'negative'}">
                            ${isCredit ? '+' : '-'}$${amount.toFixed(2)}
                        </div>
                    </div>
                `;
            }).join('');
        }

        function getTransactionIcon(type) {
            switch (type) {
                case 'DEPOSIT': return 'plus-circle';
                case 'WITHDRAWAL': return 'minus-circle';
                case 'TRANSFER': return 'exchange-alt';
                default: return 'circle';
            }
        }

        // Transaction Functions
        async function createAccount() {
            const accountType = prompt('Enter account type (SAVINGS, CHECKING, CREDIT):');
            if (!accountType) return;
            
            showLoading(true);
            
            try {
                const response = await fetch(`${API_BASE_URL}/accounts`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ accountType: accountType.toUpperCase() })
                });
                
                if (response.ok) {
                    const newAccount = await response.json();
                    showAlert('Account created successfully!', 'success');
                    await loadAccounts();
                } else {
                    const error = await response.json();
                    showAlert(error.message || 'Failed to create account', 'error');
                }
            } catch (error) {
                showAlert('Network error. Please try again.', 'error');
            } finally {
                showLoading(false);
            }
        }

        async function deposit(event) {
            event.preventDefault();
            
            const accountNumber = document.getElementById('depositAccount').value;
            const amount = parseFloat(document.getElementById('depositAmount').value);
            const description = document.getElementById('depositDescription').value;
            
            showLoading(true);
            
            try {
                const response = await fetch(`${API_BASE_URL}/transactions/deposit`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({
                        accountNumber,
                        amount,
                        description
                    })
                });
                
                if (response.ok) {
                    const transaction = await response.json();
                    showAlert(`Deposit of ${amount.toFixed(2)} initiated successfully!`, 'success');
                    document.getElementById('depositForm').querySelector('form').reset();
                    await loadAccounts();
                    await loadTransactions();
                } else {
                    const error = await response.json();
                    showAlert(error.message || 'Deposit failed', 'error');
                }
            } catch (error) {
                showAlert('Network error. Please try again.', 'error');
            } finally {
                showLoading(false);
            }
        }

        async function withdraw(event) {
            event.preventDefault();
            
            const accountNumber = document.getElementById('withdrawAccount').value;
            const amount = parseFloat(document.getElementById('withdrawAmount').value);
            const description = document.getElementById('withdrawDescription').value;
            
            showLoading(true);
            
            try {
                const response = await fetch(`${API_BASE_URL}/transactions/withdraw`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({
                        accountNumber,
                        amount,
                        description
                    })
                });
                
                if (response.ok) {
                    const transaction = await response.json();
                    showAlert(`Withdrawal of ${amount.toFixed(2)} initiated successfully!`, 'success');
                    document.getElementById('withdrawForm').querySelector('form').reset();
                    await loadAccounts();
                    await loadTransactions();
                } else {
                    const error = await response.json();
                    showAlert(error.message || 'Withdrawal failed', 'error');
                }
            } catch (error) {
                showAlert('Network error. Please try again.', 'error');
            } finally {
                showLoading(false);
            }
        }

        async function transfer(event) {
            event.preventDefault();
            
            const fromAccountNumber = document.getElementById('transferFromAccount').value;
            const toAccountNumber = document.getElementById('transferToAccount').value;
            const amount = parseFloat(document.getElementById('transferAmount').value);
            const description = document.getElementById('transferDescription').value;
            
            showLoading(true);
            
            try {
                const response = await fetch(`${API_BASE_URL}/transactions/transfer`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({
                        fromAccountNumber,
                        toAccountNumber,
                        amount,
                        description
                    })
                });
                
                if (response.ok) {
                    const transaction = await response.json();
                    showAlert(`Transfer of ${amount.toFixed(2)} initiated successfully!`, 'success');
                    document.getElementById('transferForm').querySelector('form').reset();
                    await loadAccounts();
                    await loadTransactions();
                } else {
                    const error = await response.json();
                    showAlert(error.message || 'Transfer failed', 'error');
                }
            } catch (error) {
                showAlert('Network error. Please try again.', 'error');
            } finally {
                showLoading(false);
            }
        }

        // Utility Functions
        function formatCurrency(amount) {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(amount);
        }

        function formatDate(dateString) {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // Auto-refresh data every 30 seconds when dashboard is active
        setInterval(() => {
            if (authToken && document.getElementById('dashboard').classList.contains('active')) {
                loadAccounts();
                loadTransactions();
            }
        }, 30000);

        // Handle browser back/forward buttons
        window.addEventListener('popstate', function(event) {
            if (authToken) {
                showDashboard();
            } else {
                showAuthContainer();
            }
        });

        // Prevent form submission on Enter key in certain fields
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' && event.target.tagName !== 'BUTTON' && event.target.type !== 'submit') {
                const form = event.target.closest('form');
                if (form) {
                    event.preventDefault();
                    const submitBtn = form.querySelector('button[type="submit"]');
                    if (submitBtn) {
                        submitBtn.click();
                    }
                }
            }
        });

        // Add input validation for amount fields
        document.addEventListener('input', function(event) {
            if (event.target.type === 'number' && event.target.step === '0.01') {
                const value = parseFloat(event.target.value);
                if (value < 0) {
                    event.target.value = '';
                    showAlert('Amount cannot be negative', 'error');
                }
                if (value > 999999.99) {
                    event.target.value = '999999.99';
                    showAlert('Amount cannot exceed $999,999.99', 'error');
                }
            }
        });

        // Add real-time balance checking for withdrawals and transfers
        document.getElementById('withdrawAccount').addEventListener('change', function() {
            updateAvailableBalance('withdraw');
        });

        document.getElementById('transferFromAccount').addEventListener('change', function() {
            updateAvailableBalance('transfer');
        });

        function updateAvailableBalance(type) {
            const accountSelect = document.getElementById(`${type === 'withdraw' ? 'withdraw' : 'transferFrom'}Account`);
            const selectedAccountNumber = accountSelect.value;
            
            if (selectedAccountNumber) {
                const account = userAccounts.find(acc => acc.accountNumber === selectedAccountNumber);
                if (account) {
                    const balanceInfo = document.createElement('small');
                    balanceInfo.style.color = '#666';
                    balanceInfo.style.display = 'block';
                    balanceInfo.textContent = `Available balance: ${parseFloat(account.balance).toFixed(2)}`;
                    
                    // Remove existing balance info
                    const existingInfo = accountSelect.parentNode.querySelector('small');
                    if (existingInfo) {
                        existingInfo.remove();
                    }
                    
                    accountSelect.parentNode.appendChild(balanceInfo);
                }
            }
        }

        // Add account number formatting
        document.getElementById('transferToAccount').addEventListener('input', function(event) {
            let value = event.target.value.replace(/\D/g, '');
            if (value.length > 10) {
                value = value.substring(0, 10);
            }
            event.target.value = value;
        });

        // Add password strength indicator for registration
        document.getElementById('registerPassword').addEventListener('input', function(event) {
            const password = event.target.value;
            const strengthIndicator = document.getElementById('passwordStrength') || createPasswordStrengthIndicator();
            
            const strength = calculatePasswordStrength(password);
            strengthIndicator.textContent = `Password strength: ${strength.text}`;
            strengthIndicator.style.color = strength.color;
        });

        function createPasswordStrengthIndicator() {
            const indicator = document.createElement('small');
            indicator.id = 'passwordStrength';
            indicator.style.display = 'block';
            indicator.style.marginTop = '5px';
            document.getElementById('registerPassword').parentNode.appendChild(indicator);
            return indicator;
        }

        function calculatePasswordStrength(password) {
            let score = 0;
            if (password.length >= 8) score++;
            if (/[a-z]/.test(password)) score++;
            if (/[A-Z]/.test(password)) score++;
            if (/[0-9]/.test(password)) score++;
            if (/[^A-Za-z0-9]/.test(password)) score++;
            
            switch (score) {
                case 0:
                case 1:
                    return { text: 'Very Weak', color: '#e74c3c' };
                case 2:
                    return { text: 'Weak', color: '#f39c12' };
                case 3:
                    return { text: 'Fair', color: '#f1c40f' };
                case 4:
                    return { text: 'Good', color: '#2ecc71' };
                case 5:
                    return { text: 'Strong', color: '#27ae60' };
                default:
                    return { text: 'Very Weak', color: '#e74c3c' };
            }
        }

        // Add confirmation for large transactions
        const originalTransfer = transfer;
        const originalWithdraw = withdraw;

        window.transfer = async function(event) {
            event.preventDefault();
            const amount = parseFloat(document.getElementById('transferAmount').value);
            
            if (amount > 1000) {
                if (!confirm(`Are you sure you want to transfer ${amount.toFixed(2)}? This is a large amount.`)) {
                    return;
                }
            }
            
            return originalTransfer(event);
        };

        window.withdraw = async function(event) {
            event.preventDefault();
            const amount = parseFloat(document.getElementById('withdrawAmount').value);
            
            if (amount > 1000) {
                if (!confirm(`Are you sure you want to withdraw ${amount.toFixed(2)}? This is a large amount.`)) {
                    return;
                }
            }
            
            return originalWithdraw(event);
        };

        // Add keyboard shortcuts
        document.addEventListener('keydown', function(event) {
            if (event.ctrlKey || event.metaKey) {
                switch (event.key) {
                    case 'd':
                        event.preventDefault();
                        if (document.getElementById('dashboard').classList.contains('active')) {
                            showTransactionForm('deposit');
                            document.getElementById('depositAmount').focus();
                        }
                        break;
                    case 'w':
                        event.preventDefault();
                        if (document.getElementById('dashboard').classList.contains('active')) {
                            showTransactionForm('withdraw');
                            document.getElementById('withdrawAmount').focus();
                        }
                        break;
                    case 't':
                        event.preventDefault();
                        if (document.getElementById('dashboard').classList.contains('active')) {
                            showTransactionForm('transfer');
                            document.getElementById('transferAmount').focus();
                        }
                        break;
                }
            }
        });

        // Add touch gestures for mobile
        let touchStartX = 0;
        let touchEndX = 0;

        document.addEventListener('touchstart', function(event) {
            touchStartX = event.changedTouches[0].screenX;
        });

        document.addEventListener('touchend', function(event) {
            touchEndX = event.changedTouches[0].screenX;
            handleSwipe();
        });

        function handleSwipe() {
            const swipeThreshold = 50;
            const swipeDistance = touchEndX - touchStartX;
            
            if (Math.abs(swipeDistance) > swipeThreshold) {
                const activeForm = document.querySelector('.transaction-form.active');
                if (activeForm) {
                    if (swipeDistance > 0) {
                        // Swipe right - previous form
                        if (activeForm.id === 'withdrawForm') {
                            showTransactionForm('deposit');
                        } else if (activeForm.id === 'transferForm') {
                            showTransactionForm('withdraw');
                        }
                    } else {
                        // Swipe left - next form
                        if (activeForm.id === 'depositForm') {
                            showTransactionForm('withdraw');
                        } else if (activeForm.id === 'withdrawForm') {
                            showTransactionForm('transfer');
                        }
                    }
                }
            }
        }

        // Add form auto-save functionality
        function setupAutoSave() {
            const formFields = document.querySelectorAll('input, select, textarea');
            
            formFields.forEach(field => {
                field.addEventListener('input', function() {
                    if (authToken) {
                        const formData = {};
                        const form = this.closest('form');
                        if (form) {
                            const formElements = form.querySelectorAll('input, select, textarea');
                            formElements.forEach(element => {
                                if (element.type !== 'password') {
                                    formData[element.id] = element.value;
                                }
                            });
                            localStorage.setItem('formAutoSave', JSON.stringify(formData));
                        }
                    }
                });
            });
        }

        function restoreAutoSavedData() {
            const savedData = localStorage.getItem('formAutoSave');
            if (savedData) {
                try {
                    const formData = JSON.parse(savedData);
                    Object.keys(formData).forEach(fieldId => {
                        const field = document.getElementById(fieldId);
                        if (field && field.type !== 'password') {
                            field.value = formData[fieldId];
                        }
                    });
                } catch (error) {
                    console.error('Error restoring auto-saved data:', error);
                }
            }
        }

        // Initialize auto-save after DOM is loaded
        document.addEventListener('DOMContentLoaded', function() {
            setupAutoSave();
            if (authToken) {
                restoreAutoSavedData();
            }
        });

        // Clear auto-saved data on successful transaction
        function clearAutoSavedData() {
            localStorage.removeItem('formAutoSave');
        }

        // Add session timeout warning
        let sessionTimeoutWarning;
        let sessionTimeout;

        function resetSessionTimeout() {
            clearTimeout(sessionTimeoutWarning);
            clearTimeout(sessionTimeout);
            
            if (authToken) {
                // Warn user 5 minutes before session expires
                sessionTimeoutWarning = setTimeout(() => {
                    if (confirm('Your session will expire in 5 minutes. Would you like to extend it?')) {
                        // Refresh token or make an API call to extend session
                        loadUserData();
                    }
                }, 55 * 60 * 1000); // 55 minutes
                
                // Auto logout after 1 hour
                sessionTimeout = setTimeout(() => {
                    showAlert('Session expired. Please log in again.', 'error');
                    logout();
                }, 60 * 60 * 1000); // 60 minutes
            }
        }

        // Reset timeout on user activity
        document.addEventListener('click', resetSessionTimeout);
        document.addEventListener('keypress', resetSessionTimeout);
        document.addEventListener('scroll', resetSessionTimeout);

        // Initialize session timeout when user logs in
        if (authToken) {
            resetSessionTimeout();
        }