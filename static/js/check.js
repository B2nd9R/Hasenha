// ===== Password Strength Checker =====

class PasswordChecker {
    constructor() {
        this.init();
    }

    init() {
        this.elements = {
            passwordInput: document.getElementById('passwordInput'),
            toggleVisibility: document.getElementById('toggleVisibility'),
            analyzeBtn: document.getElementById('analyzeBtn'),
            resultsSection: document.getElementById('resultsSection'),
            strengthBadge: document.getElementById('strengthBadge'),
            strengthText: document.getElementById('strengthText'),
            meterFill: document.getElementById('meterFill'),
            crackTimeText: document.getElementById('crackTimeText'),
            scoreBreakdown: document.getElementById('scoreBreakdown'),
            tipsList: document.getElementById('tipsList'),
            warningsCard: document.getElementById('warningsCard'),
            warningsList: document.getElementById('warningsList'),
            clearAnalysis: document.getElementById('clearAnalysis')
        };

        this.bindEvents();
        this.setupLanguageSupport();
    }

    bindEvents() {
        // Toggle password visibility
        this.elements.toggleVisibility.addEventListener('click', () => this.toggleVisibility());

        // Analyze password
        this.elements.analyzeBtn.addEventListener('click', () => this.analyzePassword());

        // Clear analysis
        this.elements.clearAnalysis.addEventListener('click', () => this.clearAnalysis());

        // Analyze on Enter key
        this.elements.passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.analyzePassword();
            }
        });
    }

    setupLanguageSupport() {
        // Listen for language changes
        window.addEventListener('languageChanged', () => {
            // Re-analyze current password if there is one
            const password = this.elements.passwordInput.value.trim();
            if (password && this.elements.resultsSection.style.display !== 'none') {
                const analysis = this.analyzePasswordLogic(password);
                this.displayResults(analysis);
            }
        });
    }

    toggleVisibility() {
        const type = this.elements.passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        this.elements.passwordInput.setAttribute('type', type);
        this.elements.toggleVisibility.innerHTML = type === 'password' ? 
            '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    }

    analyzePassword() {
        const password = this.elements.passwordInput.value.trim();
        
        if (!password) {
            this.showToast(this.t('check.please_enter_password') || 'الرجاء إدخال كلمة مرور', 'error');
            return;
        }

        const analysis = this.analyzePasswordLogic(password);
        this.displayResults(analysis);
        this.elements.resultsSection.style.display = 'block';
        
        // Scroll to results
        this.elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    analyzePasswordLogic(password) {
        let score = 0;
        const feedback = {
            hasLength: false,
            hasUppercase: false,
            hasLowercase: false,
            hasNumbers: false,
            hasSymbols: false,
            hasNoRepeats: false,
            hasNoCommon: false
        };

        // Length check
        if (password.length >= 8) {
            score += 1;
            feedback.hasLength = true;
        }
        if (password.length >= 12) {
            score += 1;
        }
        if (password.length >= 16) {
            score += 1;
        }

        // Character variety
        if (/[A-Z]/.test(password)) {
            score += 1;
            feedback.hasUppercase = true;
        }
        if (/[a-z]/.test(password)) {
            score += 1;
            feedback.hasLowercase = true;
        }
        if (/[0-9]/.test(password)) {
            score += 1;
            feedback.hasNumbers = true;
        }
        if (/[^A-Za-z0-9]/.test(password)) {
            score += 1;
            feedback.hasSymbols = true;
        }

        // Pattern checks
        if (!/(.)\1{2,}/.test(password)) {
            score += 1;
            feedback.hasNoRepeats = true;
        }

        // Common password check (basic)
        const commonPasswords = ['123456', 'password', '12345678', 'qwerty', '123456789'];
        if (!commonPasswords.includes(password.toLowerCase())) {
            score += 1;
            feedback.hasNoCommon = true;
        }

        // Calculate strength
        let strength = 'very-weak';
        let strengthKey = 'strength_very_weak';
        
        if (score >= 8) {
            strength = 'very-strong';
            strengthKey = 'check.strength_very_strong';
        } else if (score >= 6) {
            strength = 'strong';
            strengthKey = 'check.strength_strong';
        } else if (score >= 4) {
            strength = 'medium';
            strengthKey = 'check.strength_medium';
        } else if (score >= 2) {
            strength = 'weak';
            strengthKey = 'check.strength_weak';
        }

        // Estimate crack time
        const crackTime = this.estimateCrackTime(password, score);

        // Generate tips
        const tips = this.generateTips(feedback, password.length);
        
        // Generate warnings
        const warnings = this.generateWarnings(feedback, password);

        return {
            score,
            strength,
            strengthKey,
            crackTime,
            feedback,
            tips,
            warnings,
            length: password.length
        };
    }

    estimateCrackTime(password, score) {
        const baseTime = Math.pow(72, password.length) / 1000000000;
        
        if (score >= 8) return this.t('check.crack_centuries') || 'قرون من الزمن';
        if (score >= 6) return this.t('check.crack_years') || 'آلاف السنين';
        if (score >= 4) return this.t('check.crack_months') || 'شهور إلى سنوات';
        if (score >= 2) return this.t('check.crack_days') || 'أيام إلى أسابيع';
        return this.t('check.crack_instant') || 'ثواني إلى دقائق';
    }

    generateTips(feedback, length) {
        const tips = [];

        if (!feedback.hasLength || length < 12) {
            tips.push(this.t('check.tip_length'));
        }
        if (!feedback.hasUppercase) {
            tips.push(this.t('check.tip_uppercase'));
        }
        if (!feedback.hasLowercase) {
            tips.push(this.t('check.tip_lowercase'));
        }
        if (!feedback.hasNumbers) {
            tips.push(this.t('check.tip_numbers'));
        }
        if (!feedback.hasSymbols) {
            tips.push(this.t('check.tip_symbols'));
        }
        if (!feedback.hasNoRepeats) {
            tips.push(this.t('check.tip_no_repeats'));
        }
        if (length >= 12 && feedback.hasUppercase && feedback.hasLowercase && feedback.hasNumbers && feedback.hasSymbols) {
            tips.push(this.t('check.tip_excellent'));
        }

        return tips.length > 0 ? tips : [this.t('check.tip_excellent') || 'كلمة المرور قوية جداً! حافظ عليها 🔒'];
    }

    generateWarnings(feedback, password) {
        const warnings = [];

        if (password.length < 8) {
            warnings.push(this.t('check.warning_short'));
        }
        if (!feedback.hasUppercase && !feedback.hasLowercase) {
            warnings.push(this.t('check.warning_simple'));
        }
        if (!feedback.hasNumbers && !feedback.hasSymbols) {
            warnings.push(this.t('check.warning_no_complexity'));
        }
        if (/(.)\1{3,}/.test(password)) {
            warnings.push(this.t('check.warning_repeats'));
        }
        if (/^(123456|password|qwerty)/i.test(password)) {
            warnings.push(this.t('check.warning_common'));
        }

        return warnings;
    }

    displayResults(analysis) {
        // Update strength badge and meter
        this.elements.strengthBadge.className = `strength-badge ${analysis.strength}`;
        this.elements.strengthText.textContent = this.t(analysis.strengthKey);
        this.elements.meterFill.className = `meter-fill ${analysis.strength}`;

        // Update crack time
        this.elements.crackTimeText.textContent = analysis.crackTime;

        // Update score breakdown
        this.elements.scoreBreakdown.innerHTML = this.generateScoreHTML(analysis);

        // Update tips
        this.elements.tipsList.innerHTML = analysis.tips.map(tip => `
            <div class="tip-item">
                <i class="fas fa-lightbulb"></i>
                <span>${tip}</span>
            </div>
        `).join('');

        // Update warnings
        if (analysis.warnings.length > 0) {
            this.elements.warningsCard.style.display = 'block';
            this.elements.warningsList.innerHTML = analysis.warnings.map(warning => `
                <div class="warning-item">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>${warning}</span>
                </div>
            `).join('');
        } else {
            this.elements.warningsCard.style.display = 'none';
        }
    }

    generateScoreHTML(analysis) {
        const { feedback, length } = analysis;
        
        const getScoreText = (condition) => {
            if (condition) return this.t('check.score_excellent') || 'ممتاز';
            return this.t('check.score_weak') || 'ضعيف';
        };

        const getScoreClass = (condition) => {
            return condition ? 'positive' : 'negative';
        };

        return `
            <div class="score-item">
                <div class="score-label">
                    <i class="fas fa-ruler-horizontal"></i>
                    <span>${this.t('check.score_length')} (${length} ${this.t('check.characters') || 'حرف'})</span>
                </div>
                <div class="score-value ${length >= 12 ? 'positive' : length >= 8 ? 'neutral' : 'negative'}">
                    ${length >= 12 ? this.t('check.score_excellent') : length >= 8 ? this.t('check.score_good') : this.t('check.score_weak')}
                </div>
            </div>
            <div class="score-item">
                <div class="score-label">
                    <i class="fas fa-font-case"></i>
                    <span>${this.t('check.score_uppercase')}</span>
                </div>
                <div class="score-value ${feedback.hasUppercase ? 'positive' : 'negative'}">
                    ${feedback.hasUppercase ? '✓' : '✗'}
                </div>
            </div>
            <div class="score-item">
                <div class="score-label">
                    <i class="fas fa-font"></i>
                    <span>${this.t('check.score_lowercase')}</span>
                </div>
                <div class="score-value ${feedback.hasLowercase ? 'positive' : 'negative'}">
                    ${feedback.hasLowercase ? '✓' : '✗'}
                </div>
            </div>
            <div class="score-item">
                <div class="score-label">
                    <i class="fas fa-hashtag"></i>
                    <span>${this.t('check.score_numbers')}</span>
                </div>
                <div class="score-value ${feedback.hasNumbers ? 'positive' : 'negative'}">
                    ${feedback.hasNumbers ? '✓' : '✗'}
                </div>
            </div>
            <div class="score-item">
                <div class="score-label">
                    <i class="fas fa-asterisk"></i>
                    <span>${this.t('check.score_symbols')}</span>
                </div>
                <div class="score-value ${feedback.hasSymbols ? 'positive' : 'negative'}">
                    ${feedback.hasSymbols ? '✓' : '✗'}
                </div>
            </div>
            <div class="score-item">
                <div class="score-label">
                    <i class="fas fa-shield-alt"></i>
                    <span>${this.t('check.score_final')}</span>
                </div>
                <div class="score-value ${analysis.strength.includes('strong') ? 'positive' : analysis.strength.includes('medium') ? 'neutral' : 'negative'}">
                    ${this.t(analysis.strengthKey)}
                </div>
            </div>
        `;
    }

    clearAnalysis() {
        this.elements.passwordInput.value = '';
        this.elements.resultsSection.style.display = 'none';
        this.elements.passwordInput.focus();
    }

    showToast(message, type = 'success') {
        // Create toast if it doesn't exist
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'toast';
            toast.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <span id="toastMessage">${message}</span>
            `;
            document.body.appendChild(toast);
        }
        
        const toastMessage = document.getElementById('toastMessage');
        if (toastMessage) {
            toastMessage.textContent = message;
        }
        
        toast.className = `toast show ${type}`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Translation helper
    t(key) {
        if (window.i18n && window.i18n.t) {
            return window.i18n.t(key);
        }
        return key;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.passwordChecker = new PasswordChecker();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PasswordChecker;
}