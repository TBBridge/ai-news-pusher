// AI News Pusher - Frontend Application

class AINewsPusher {
    constructor() {
        this.apiBase = '';
        this.init();
    }

    // Initialize the application
    init() {
        this.cacheDOM();
        this.bindEvents();
        this.loadInitialData();
    }

    // Cache DOM elements
    cacheDOM() {
        // Subscribe form elements
        this.subscribeForm = document.getElementById('subscribeForm');
        this.phoneInput = document.getElementById('phoneInput');
        this.subscribeBtn = document.getElementById('subscribeBtn');
        this.subscribeMessage = document.getElementById('subscribeMessage');

        // Unsubscribe form elements
        this.unsubscribeForm = document.getElementById('unsubscribeForm');
        this.unsubPhoneInput = document.getElementById('unsubPhoneInput');
        this.unsubscribeBtn = document.getElementById('unsubscribeBtn');
        this.unsubscribeMessage = document.getElementById('unsubscribeMessage');

        // Status elements
        this.serverStatus = document.getElementById('serverStatus');
        this.subscriberCount = document.getElementById('subscriberCount');
        this.nextPush = document.getElementById('nextPush');

        // News elements
        this.newsList = document.getElementById('newsList');
    }

    // Bind event listeners
    bindEvents() {
        // Subscribe form submission
        if (this.subscribeForm) {
            this.subscribeForm.addEventListener('submit', (e) => this.handleSubscribe(e));
        }

        // Unsubscribe form submission
        if (this.unsubscribeForm) {
            this.unsubscribeForm.addEventListener('submit', (e) => this.handleUnsubscribe(e));
        }

        // Phone input formatting
        if (this.phoneInput) {
            this.phoneInput.addEventListener('input', (e) => this.formatPhoneInput(e));
        }

        if (this.unsubPhoneInput) {
            this.unsubPhoneInput.addEventListener('input', (e) => this.formatPhoneInput(e));
        }
    }

    // Load initial data
    async loadInitialData() {
        await Promise.all([
            this.checkServerStatus(),
            this.loadSubscribers(),
            this.loadLatestNews(),
            this.updateNextPushTime()
        ]);
    }

    // Check server health
    async checkServerStatus() {
        try {
            const response = await fetch(`${this.apiBase}/api/health`);
            const data = await response.json();
            
            if (data.status === 'ok') {
                this.serverStatus.textContent = '● Online';
                this.serverStatus.style.color = '#4CAF50';
            } else {
                throw new Error('Server returned unexpected status');
            }
        } catch (error) {
            this.serverStatus.textContent = '● Offline';
            this.serverStatus.style.color = '#f44336';
        }
    }

    // Load subscriber count
    async loadSubscribers() {
        try {
            const response = await fetch(`${this.apiBase}/api/subscribers/count`);
            const data = await response.json();
            this.subscriberCount.textContent = data.count;
        } catch (error) {
            console.error('Error loading subscribers:', error);
            this.subscriberCount.textContent = 'N/A';
        }
    }

    // Update next push time
    updateNextPushTime() {
        const now = new Date();
        const nextPush = new Date(now);
        
        nextPush.setHours(8, 0, 0, 0);
        
        if (nextPush <= now) {
            nextPush.setDate(nextPush.getDate() + 1);
        }

        const options = { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        };
        this.nextPush.textContent = nextPush.toLocaleTimeString('en-US', options);
    }

    // Load latest news
    async loadLatestNews() {
        try {
            const response = await fetch(`${this.apiBase}/api/news`);
            const data = await response.json();

            if (data.success && data.news.length > 0) {
                this.renderNews(data.news.slice(0, 10));
            } else {
                this.renderEmptyState();
            }
        } catch (error) {
            console.error('Error loading news:', error);
            this.renderErrorState();
        }
    }

    // Render news items
    renderNews(news) {
        const html = news.map((article, index) => {
            const publishedDate = new Date(article.publishedAt);
            const timeAgo = this.getTimeAgo(publishedDate);
            const sourceIcon = this.getSourceIcon(article.source);

            return `
                <article class="news-item">
                    <div class="news-header">
                        <span class="news-number">${index + 1}</span>
                        <h4 class="news-title">${this.escapeHtml(article.title)}</h4>
                    </div>
                    <div class="news-meta">
                        <span class="news-source">${sourceIcon} ${this.escapeHtml(article.source)}</span>
                        <span class="news-time">${timeAgo}</span>
                    </div>
                    ${article.description ? `<p class="news-description">${this.escapeHtml(article.description)}</p>` : ''}
                    <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="news-link">
                        Read more →
                    </a>
                </article>
            `;
        }).join('');

        this.newsList.innerHTML = html;
    }

    // Render empty state
    renderEmptyState() {
        this.newsList.innerHTML = `
            <div class="loading-spinner">
                <p>No recent AI news found. Check back soon!</p>
            </div>
        `;
    }

    // Render error state
    renderErrorState() {
        this.newsList.innerHTML = `
            <div class="loading-spinner">
                <p>Unable to load news at the moment. Please try again later.</p>
            </div>
        `;
    }

    // Handle subscribe form submission
    async handleSubscribe(e) {
        e.preventDefault();

        const phone = '+' + this.phoneInput.value.trim();
        
        if (!this.validatePhone(phone)) {
            this.showMessage('subscribeMessage', 'Please enter a valid phone number', 'error');
            return;
        }

        this.setLoadingState(this.subscribeBtn, true);
        this.hideMessage('subscribeMessage');

        try {
            const response = await fetch(`${this.apiBase}/api/subscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone })
            });

            const data = await response.json();

            if (data.success) {
                this.showMessage('subscribeMessage', 
                    \`✓ \${data.message}. You will receive AI news tomorrow at 8 AM!\`, 
                    'success'
                );
                this.phoneInput.value = '';
                await this.loadSubscribers();
            } else {
                this.showMessage('subscribeMessage', \`✗ \${data.error}\`, 'error');
            }
        } catch (error) {
            this.showMessage('subscribeMessage', 
                '✗ An error occurred. Please try again later.', 
                'error'
            );
        } finally {
            this.setLoadingState(this.subscribeBtn, false);
        }
    }

    // Handle unsubscribe form submission
    async handleUnsubscribe(e) {
        e.preventDefault();

        const phone = '+' + this.unsubPhoneInput.value.trim();
        
        if (!this.validatePhone(phone)) {
            this.showMessage('unsubscribeMessage', 'Please enter a valid phone number', 'error');
            return;
        }

        this.setLoadingState(this.unsubscribeBtn, true);
        this.hideMessage('unsubscribeMessage');

        try {
            const response = await fetch(`${this.apiBase}/api/unsubscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone })
            });

            const data = await response.json();

            if (data.success) {
                this.showMessage('unsubscribeMessage', \`✓ \${data.message}\`, 'success');
                this.unsubPhoneInput.value = '';
                await this.loadSubscribers();
            } else {
                this.showMessage('unsubscribeMessage', \`✗ \${data.error}\`, 'error');
            }
        } catch (error) {
            this.showMessage('unsubscribeMessage', 
                '✗ An error occurred. Please try again later.', 
                'error'
            );
        } finally {
            this.setLoadingState(this.unsubscribeBtn, false);
        }
    }

    // Format phone input
    formatPhoneInput(e) {
        const input = e.target;
        let value = input.value.replace(/\D/g, '');
        
        if (value.length > 15) {
            value = value.substring(0, 15);
        }
        
        input.value = value;
    }

    // Validate phone number
    validatePhone(phone) {
        const e164Regex = /^\+[1-9]\d{1,14}$/;
        return e164Regex.test(phone);
    }

    // Show message
    showMessage(elementId, text, type) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
            element.className = \`message \${type}\`;
            element.style.display = 'block';
        }
    }

    // Hide message
    hideMessage(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'none';
        }
    }

    // Set loading state
    setLoadingState(button, isLoading) {
        if (button) {
            const textEl = button.querySelector('.btn-text');
            const loadingEl = button.querySelector('.btn-loading');
            
            if (isLoading) {
                button.disabled = true;
                if (textEl) textEl.style.display = 'none';
                if (loadingEl) loadingEl.style.display = 'inline-flex';
            } else {
                button.disabled = false;
                if (textEl) textEl.style.display = 'inline';
                if (loadingEl) loadingEl.style.display = 'none';
            }
        }
    }

    // Get time ago string
    getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return \`\${minutes} min\${minutes > 1 ? 's' : ''} ago\`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return \`\${hours} hour\${hours > 1 ? 's' : ''} ago\`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return \`\${days} day\${days > 1 ? 's' : ''} ago\`;
        }
    }

    // Get source icon
    getSourceIcon(source) {
        const icons = {
            'TechCrunch': '📰',
            'MIT Technology Review': '🔬',
            'VentureBeat': '💻',
            'NewsAPI': '📡'
        };
        return icons[source] || '📄';
    }

    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AINewsPusher();
});