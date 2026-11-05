/**
 * 心灵港湾 - 全局JavaScript
 * Mental Health Platform Global Scripts
 */

// ===================================
// Configuration
// ===================================
const CONFIG = {
    API_BASE: '',
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 300,
    TOAST_DURATION: 3000,
    MAX_MESSAGE_LENGTH: 2000,
    CRISIS_KEYWORDS: ['自杀', '想死', '不想活', 'suicide', 'kill myself', 'self harm', '自残', '割腕']
};

// ===================================
// Utility Functions
// ===================================
const Utils = {
    // Debounce function
    debounce(func, wait = CONFIG.DEBOUNCE_DELAY) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Format date to relative time
    formatRelativeTime(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days < 7) return `${days}天前`;
        return new Date(date).toLocaleDateString('zh-CN');
    },

    // Format number with animation
    animateNumber(element, start, end, duration = 1000) {
        const range = end - start;
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            const current = Math.floor(start + range * easeProgress);
            element.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    },

    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Generate unique ID
    generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9);
    },

    // Check if element is in viewport
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    // Smooth scroll to element
    scrollToElement(element, offset = 0) {
        const y = element.getBoundingClientRect().top + window.pageYOffset + offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
    },

    // Check for crisis content
    containsCrisisKeywords(text) {
        const lowerText = text.toLowerCase();
        return CONFIG.CRISIS_KEYWORDS.some(keyword => lowerText.includes(keyword.toLowerCase()));
    },

    // Copy to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Failed to copy:', err);
            return false;
        }
    },

    // Local storage helpers
    storage: {
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch {
                return defaultValue;
            }
        },
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch {
                return false;
            }
        },
        remove(key) {
            localStorage.removeItem(key);
        }
    }
};

// ===================================
// Toast Notifications
// ===================================
const Toast = {
    container: null,

    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.style.cssText = `
                position: fixed;
                bottom: 2rem;
                right: 2rem;
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                z-index: 9999;
                pointer-events: none;
            `;
            document.body.appendChild(this.container);
        }
    },

    show(message, type = 'info', duration = CONFIG.TOAST_DURATION) {
        this.init();
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            padding: 1rem 1.5rem;
            border-radius: 12px;
            background: white;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 0.75rem;
            transform: translateX(120%);
            transition: transform 0.3s ease;
            pointer-events: auto;
            max-width: 400px;
        `;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        toast.innerHTML = `
            <span style="font-size: 1.25rem;">${icons[type]}</span>
            <span style="color: #1e293b; flex: 1;">${Utils.escapeHtml(message)}</span>
        `;
        toast.style.borderLeft = `4px solid ${colors[type]}`;
        
        this.container.appendChild(toast);
        
        // Trigger animation
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
        });
        
        // Auto remove
        setTimeout(() => {
            toast.style.transform = 'translateX(120%)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
        
        // Click to dismiss
        toast.addEventListener('click', () => {
            toast.style.transform = 'translateX(120%)';
            setTimeout(() => toast.remove(), 300);
        });
    },

    success(message) { this.show(message, 'success'); },
    error(message) { this.show(message, 'error'); },
    warning(message) { this.show(message, 'warning'); },
    info(message) { this.show(message, 'info'); }
};

// ===================================
// Modal Manager
// ===================================
const Modal = {
    activeModals: [],

    create(options = {}) {
        const {
            title = '',
            content = '',
            showClose = true,
            onClose = null,
            className = ''
        } = options;

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-content ${className}">
                ${title || showClose ? `
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                        ${showClose ? '<button class="modal-close" aria-label="关闭">✕</button>' : ''}
                    </div>
                ` : ''}
                <div class="modal-body">${content}</div>
            </div>
        `;

        // Close handlers
        const close = () => {
            overlay.classList.remove('active');
            setTimeout(() => {
                overlay.remove();
                this.activeModals = this.activeModals.filter(m => m !== overlay);
                if (onClose) onClose();
            }, 300);
        };

        if (showClose) {
            overlay.querySelector('.modal-close').addEventListener('click', close);
        }
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });

        document.body.appendChild(overlay);
        this.activeModals.push(overlay);

        // Trigger animation
        requestAnimationFrame(() => overlay.classList.add('active'));

        return { overlay, close };
    },

    confirm(message, onConfirm, onCancel = null) {
        const { overlay, close } = this.create({
            title: '确认',
            content: `
                <p style="margin-bottom: 1.5rem; color: #64748b;">${Utils.escapeHtml(message)}</p>
                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button class="btn btn-secondary modal-cancel">取消</button>
                    <button class="btn btn-primary modal-confirm">确认</button>
                </div>
            `,
            showClose: false
        });

        overlay.querySelector('.modal-cancel').addEventListener('click', () => {
            close();
            if (onCancel) onCancel();
        });

        overlay.querySelector('.modal-confirm').addEventListener('click', () => {
            close();
            if (onConfirm) onConfirm();
        });
    },

    alert(message, title = '提示') {
        const { overlay, close } = this.create({
            title,
            content: `
                <p style="margin-bottom: 1.5rem; color: #64748b;">${Utils.escapeHtml(message)}</p>
                <div style="display: flex; justify-content: flex-end;">
                    <button class="btn btn-primary modal-ok">确定</button>
                </div>
            `,
            showClose: true
        });

        overlay.querySelector('.modal-ok').addEventListener('click', close);
    },

    closeAll() {
        this.activeModals.forEach(modal => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        });
        this.activeModals = [];
    }
};

// ===================================
// API Client
// ===================================
const API = {
    async request(url, options = {}) {
        const defaults = {
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        try {
            const response = await fetch(CONFIG.API_BASE + url, { ...defaults, ...options });
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    get(url) {
        return this.request(url);
    },

    post(url, data) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
};

// ===================================
// Crisis Detection & Response
// ===================================
const CrisisHandler = {
    resources: {
        hotlines: [
            { name: '全国心理援助热线', number: '400-161-9995' },
            { name: '北京心理危机中心', number: '010-82951332' },
            { name: '生命热线', number: '400-821-1215' }
        ]
    },

    check(text) {
        return Utils.containsCrisisKeywords(text);
    },

    showModal() {
        Modal.create({
            title: '💚 我们在这里陪伴你',
            content: `
                <div style="background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%); padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem;">
                    <p style="color: #991b1b; margin-bottom: 1rem;">
                        我们注意到你可能正在经历一段困难的时期。请记住，你并不孤单，专业的帮助随时可用。
                    </p>
                </div>
                <h4 style="margin-bottom: 1rem; color: #1e293b;">24小时心理援助热线</h4>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${this.resources.hotlines.map(h => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #f8fafc; border-radius: 10px;">
                            <span style="color: #64748b;">${h.name}</span>
                            <a href="tel:${h.number}" style="color: #a855f7; font-weight: 600;">${h.number}</a>
                        </div>
                    `).join('')}
                </div>
                <p style="margin-top: 1.5rem; color: #94a3b8; font-size: 0.9rem; text-align: center;">
                    💜 无论发生什么，你的生命都是宝贵的
                </p>
            `,
            className: 'crisis-modal'
        });
    }
};

// ===================================
// Form Validation
// ===================================
const FormValidator = {
    rules: {
        required: (value) => value.trim().length > 0,
        minLength: (value, min) => value.trim().length >= min,
        maxLength: (value, max) => value.trim().length <= max,
        email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        phone: (value) => /^1[3-9]\d{9}$/.test(value)
    },

    messages: {
        required: '此项为必填项',
        minLength: (min) => `至少需要${min}个字符`,
        maxLength: (max) => `最多允许${max}个字符`,
        email: '请输入有效的邮箱地址',
        phone: '请输入有效的手机号码'
    },

    validate(value, rules) {
        const errors = [];
        
        for (const rule of rules) {
            if (typeof rule === 'string') {
                if (!this.rules[rule](value)) {
                    errors.push(this.messages[rule]);
                }
            } else if (typeof rule === 'object') {
                const [ruleName, param] = Object.entries(rule)[0];
                if (!this.rules[ruleName](value, param)) {
                    errors.push(typeof this.messages[ruleName] === 'function' 
                        ? this.messages[ruleName](param) 
                        : this.messages[ruleName]);
                }
            }
        }
        
        return errors;
    }
};

// ===================================
// Intersection Observer for Animations
// ===================================
const AnimationObserver = {
    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });
    }
};

// ===================================
// Keyboard Navigation
// ===================================
const KeyboardNav = {
    init() {
        document.addEventListener('keydown', (e) => {
            // Escape to close modals
            if (e.key === 'Escape') {
                Modal.closeAll();
            }
            
            // Tab trap in modals
            if (e.key === 'Tab' && Modal.activeModals.length > 0) {
                const modal = Modal.activeModals[Modal.activeModals.length - 1];
                const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        });
    }
};

// ===================================
// Initialize on DOM Ready
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    AnimationObserver.init();
    KeyboardNav.init();
    
    // Add loading state handler
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function() {
            const submitBtn = this.querySelector('[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.dataset.originalText = submitBtn.textContent;
                submitBtn.textContent = '处理中...';
            }
        });
    });
});

// ===================================
// Export for global use
// ===================================
window.MentalHealth = {
    Utils,
    Toast,
    Modal,
    API,
    CrisisHandler,
    FormValidator,
    CONFIG
};
