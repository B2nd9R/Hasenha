class PasswordChecker {
    constructor() {
        this.init();
    }

    init() {
        this.elements = {
            passwordInput: document.getElementById('passwordInput'),
            toggleVisibility: document.getElementById('toggleVisibility'),
            analyzeBtn: document.getElementById('analyzeBtn'),
            breachResult: document.getElementById('breachResult'),
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

        // Analyze password on button click
        this.elements.analyzeBtn.addEventListener('click', () => this.analyzePassword());

        // Analyze on Enter key
        this.elements.passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.analyzePassword();
            }
        });

        // Clear analysis
        this.elements.clearAnalysis.addEventListener('click', () => this.clearAnalysis());

        // Real-time strength analysis
        this.elements.passwordInput.addEventListener('input', () => {
            const password = this.elements.passwordInput.value;
            if (password.length > 0) {
                this.showRealTimeStrength(password);
            } else {
                this.hideRealTimeStrength();
            }
        });
    }

    async updateStats(action) {
        try {
            const response = await fetch('/api/stats/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: action })
            });

            const data = await response.json();
            
            if (!data.success) {
                console.warn('Failed to update stats:', data.error);
            }
        } catch (error) {
            console.error('Error updating stats:', error);
            // تجاهل الخطأ حتى لا يؤثر على تجربة المستخدم
        }
    }

    async analyzePassword() {
        const password = this.elements.passwordInput.value.trim();
        
        if (!password) {
            this.showToast(this.t('check.please_enter_password') || 'الرجاء إدخال كلمة مرور', 'error');
            return;
        }

        // إظهار حالة التحميل
        this.showLoadingState();

        try {
            // 1. Client-side strength analysis
            const analysis = this.analyzePasswordLogic(password);
            this.displayResults(analysis);
            this.elements.resultsSection.style.display = 'block';
            
            // 2. Server-side breach check
            await this.checkBreach(password);

            // 🔄 تحديث الإحصاءات في قاعدة البيانات
            await this.updateStats('check');

        } catch (error) {
            console.error('Analysis error:', error);
            this.showToast(this.t('check.analysis_error') || 'حدث خطأ أثناء التحليل', 'error');
        } finally {
            this.hideLoadingState();
        }

        // Scroll to results
        this.elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    async checkBreach(password) {
        this.elements.breachResult.innerHTML = `<div class="breach-loading">
            <i class="fas fa-spinner fa-spin"></i> 
            <span>${this.t('check.breach_checking') || 'جاري التحقق من التسريب...'}</span>
        </div>`;
        this.elements.breachResult.className = 'breach-result neutral';

        try {
            const response = await fetch('/api/password/check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password: password })
            });

            const data = await response.json();

            if (data.success) {
                if (data.breached) {
                    const breachMessage = this.t('check.breach_found_count').replace('{count}', data.count.toLocaleString());
                    this.elements.breachResult.innerHTML = `
                        <div class="breach-warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            <div class="breach-content">
                                <strong>${this.t('check.breach_warning') || 'تحذير أمني!'}</strong>
                                <span>${breachMessage}</span>
                            </div>
                        </div>
                    `;
                    this.elements.breachResult.className = 'breach-result negative';
                    
                    // إضافة تحذير إضافي في قسم التحذيرات
                    this.addBreachWarning(data.count);
                } else {
                    this.elements.breachResult.innerHTML = `
                        <div class="breach-safe">
                            <i class="fas fa-check-circle"></i>
                            <div class="breach-content">
                                <strong>${this.t('check.breach_safe_title') || 'آمنة'}</strong>
                                <span>${this.t('check.breach_safe') || 'لم يتم العثور على كلمة المرور في أي تسريب معروف.'}</span>
                            </div>
                        </div>
                    `;
                    this.elements.breachResult.className = 'breach-result positive';
                }
            } else {
                this.elements.breachResult.innerHTML = `
                    <div class="breach-error">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>${data.error || this.t('check.breach_error') || 'حدث خطأ أثناء التحقق.'}</span>
                    </div>
                `;
                this.elements.breachResult.className = 'breach-result neutral';
            }

        } catch (error) {
            console.error('Breach check failed:', error);
            this.elements.breachResult.innerHTML = `
                <div class="breach-error">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>${this.t('check.breach_connection_error') || 'تعذر الاتصال بخادم التحقق.'}</span>
                </div>
            `;
            this.elements.breachResult.className = 'breach-result neutral';
        }
    }

    addBreachWarning(count) {
        const warningElement = document.createElement('div');
        warningElement.className = 'warning-item breach-warning-item';
        warningElement.innerHTML = `
            <i class="fas fa-database"></i>
            <div class="warning-content">
                <strong>${this.t('check.breach_warning') || 'كلمة المرور مسربة!'}</strong>
                <span>${this.t('check.breach_found_count').replace('{count}', count.toLocaleString())}</span>
                <small>${this.t('check.breach_recommendation') || 'يجب تغيير هذه كلمة المرور فوراً.'}</small>
            </div>
        `;
        this.elements.warningsList.appendChild(warningElement);
    }

    clearAnalysis() {
        this.elements.passwordInput.value = '';
        this.elements.resultsSection.style.display = 'none';
        this.elements.breachResult.innerHTML = '';
        this.elements.breachResult.className = 'breach-result';
        this.hideRealTimeStrength();
    }

    setupLanguageSupport() {
        // Listen for language changes
        window.addEventListener('languageChanged', () => {
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
        this.elements.toggleVisibility.setAttribute('title', 
            type === 'password' ? 
            (this.t('common.show_password') || 'إظهار كلمة المرور') : 
            (this.t('common.hide_password') || 'إخفاء كلمة المرور')
        );
    }

    showRealTimeStrength(password) {
        // إظهار مؤشر القوة أثناء الكتابة
        const analysis = this.analyzePasswordLogic(password);
        this.updateStrengthMeter(analysis.strength, analysis.score);
    }

    hideRealTimeStrength() {
        // إخفاء مؤشر القوة عندما يكون الحقل فارغاً
        this.elements.meterFill.className = 'meter-fill';
        this.elements.meterFill.style.width = '0%';
    }

    updateStrengthMeter(strength, score) {
        const percentages = {
            'very-weak': '20%',
            'weak': '40%',
            'medium': '60%',
            'strong': '80%',
            'very-strong': '100%'
        };
        
        this.elements.meterFill.className = `meter-fill ${strength}`;
        this.elements.meterFill.style.width = percentages[strength] || '0%';
    }

    showLoadingState() {
        this.elements.analyzeBtn.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            <span>${this.t('check.analyzing') || 'جاري التحليل...'}</span>
        `;
        this.elements.analyzeBtn.disabled = true;
    }

    hideLoadingState() {
        this.elements.analyzeBtn.innerHTML = `
            <i class="fas fa-search"></i>
            <span>${this.t('check.analyze_btn') || 'فحص القوة'}</span>
        `;
        this.elements.analyzeBtn.disabled = false;
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
            hasNoCommon: false,
            hasNoSequential: false,
            hasNoPersonal: false
        };

        // Length check (أهم عامل)
        if (password.length >= 8) {
            score += 2;
            feedback.hasLength = true;
        }
        if (password.length >= 12) {
            score += 2;
        }
        if (password.length >= 16) {
            score += 2;
        }
        if (password.length >= 20) {
            score += 2;
        }

        // Character variety
        if (/[A-Z]/.test(password)) {
            score += 2;
            feedback.hasUppercase = true;
        }
        if (/[a-z]/.test(password)) {
            score += 2;
            feedback.hasLowercase = true;
        }
        if (/[0-9]/.test(password)) {
            score += 2;
            feedback.hasNumbers = true;
        }
        if (/[^A-Za-z0-9]/.test(password)) {
            score += 3;
            feedback.hasSymbols = true;
        }

        // Pattern checks
        if (!/(.)\1{2,}/.test(password)) {
            score += 2;
            feedback.hasNoRepeats = true;
        }

        // Sequential characters check
        if (!/(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
            score += 2;
            feedback.hasNoSequential = true;
        }

        // Common password check (extended list)
        const commonPasswords = [
            '123456', 'password', '12345678', 'qwerty', '123456789', '12345', 
            '1234', '111111', '1234567', 'dragon', '123123', 'baseball', 
            'abc123', 'football', 'monkey', 'letmein', '696969', 'shadow', 
            'master', '666666', 'qwertyuiop', '123321', 'mustang', '1234567890',
            'michael', '654321', 'superman', '1qaz2wsx', '7777777', 'fuckyou',
            '121212', '000000', 'qazwsx', '123qwe', 'killer', 'trustno1', 'jordan',
            'jennifer', 'zxcvbnm', 'asdfgh', 'hunter', 'buster', 'soccer',
            'harley', 'batman', 'andrew', 'tigger', 'sunshine', 'iloveyou',
            'fuckme', '2000', 'charlie', 'robert', 'thomas', 'hockey', 'ranger',
            'daniel', 'starwars', 'klaster', '112233', 'george', 'asshole',
            'computer', 'michelle', 'jessica', 'pepper', '1111', 'zxcvbn',
            '555555', '11111111', '131313', 'freedom', '777777', 'pass',
            'fuck', 'maggie', '159753', 'aaaaaa', 'ginger', 'princess',
            'joshua', 'cheese', 'amanda', 'summer', 'love', 'ashley',
            '6969', 'nicole', 'chelsea', 'biteme', 'matthew', 'access',
            'yankees', '987654321', 'dallas', 'austin', 'thunder', 'taylor',
            'matrix', 'minecraft'
        ];
        
        if (!commonPasswords.includes(password.toLowerCase())) {
            score += 3;
            feedback.hasNoCommon = true;
        }

        // Personal information check (basic)
        const currentYear = new Date().getFullYear();
        if (!password.includes(currentYear.toString()) && 
            !password.includes((currentYear - 1).toString())) {
            feedback.hasNoPersonal = true;
            score += 1;
        }

        // Calculate strength
        let strength = 'very-weak';
        let strengthKey = 'check.strength_very_weak';
        
        if (score >= 20) {
            strength = 'very-strong';
            strengthKey = 'check.strength_very_strong';
        } else if (score >= 15) {
            strength = 'strong';
            strengthKey = 'check.strength_strong';
        } else if (score >= 10) {
            strength = 'medium';
            strengthKey = 'check.strength_medium';
        } else if (score >= 5) {
            strength = 'weak';
            strengthKey = 'check.strength_weak';
        }

        // Estimate crack time (محسّن)
        const crackTime = this.estimateCrackTime(password, score);
        
        // Generate tips
        const tips = this.generateTips(feedback, password.length, score);
        
        // Generate warnings
        const warnings = this.generateWarnings(feedback, password, score);

        return {
            score: Math.min(score, 25), // حد أقصى 25 نقطة
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
        // تقدير أكثر دقة بناءً على القوة والطول
        const length = password.length;
        const charsetSize = this.calculateCharsetSize(password);
        const combinations = Math.pow(charsetSize, length);
        
        // افتراض 10 مليار محاولة في الثانية (كمبيوتر قوي)
        const attemptsPerSecond = 10000000000;
        const seconds = combinations / attemptsPerSecond;

        if (seconds < 60) return this.t('check.crack_seconds') || 'ثواني';
        if (seconds < 3600) return this.t('check.crack_minutes') || 'دقائق';
        if (seconds < 86400) return this.t('check.crack_hours') || 'ساعات';
        if (seconds < 2592000) return this.t('check.crack_days') || 'أيام';
        if (seconds < 31536000) return this.t('check.crack_months') || 'شهور';
        if (seconds < 315360000) return this.t('check.crack_years') || 'سنوات';
        return this.t('check.crack_centuries') || 'قرون';
    }

    calculateCharsetSize(password) {
        let size = 0;
        if (/[a-z]/.test(password)) size += 26;
        if (/[A-Z]/.test(password)) size += 26;
        if (/[0-9]/.test(password)) size += 10;
        if (/[^A-Za-z0-9]/.test(password)) size += 32; // الرموز الشائعة
        return size || 1; // تجنب القسمة على صفر
    }

    generateTips(feedback, length, score) {
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
        if (!feedback.hasNoSequential) {
            tips.push(this.t('check.tip_no_sequential'));
        }
        if (score >= 20) {
            tips.push(this.t('check.tip_excellent'));
        } else if (score >= 15) {
            tips.push(this.t('check.tip_very_good'));
        }

        return tips.length > 0 ? tips : [this.t('check.tip_excellent') || 'كلمة المرور قوية جداً! حافظ عليها 🔒'];
    }

    generateWarnings(feedback, password, score) {
        const warnings = [];
        const commonPasswords = ['123456', 'password', '12345678', 'qwerty', '123456789'];

        if (password.length < 8) {
            warnings.push(this.t('check.warning_short'));
        }
        if (password.length < 12 && score < 15) {
            warnings.push(this.t('check.warning_medium_length'));
        }
        if (!feedback.hasUppercase || !feedback.hasLowercase) {
            warnings.push(this.t('check.warning_no_mixed_case'));
        }
        if (!feedback.hasNumbers) {
            warnings.push(this.t('check.warning_no_numbers'));
        }
        if (!feedback.hasSymbols) {
            warnings.push(this.t('check.warning_no_symbols'));
        }
        if (/(.)\1{2,}/.test(password)) {
            warnings.push(this.t('check.warning_repeats'));
        }
        if (commonPasswords.includes(password.toLowerCase())) {
            warnings.push(this.t('check.warning_common'));
        }
        if (password.length > 50) {
            warnings.push(this.t('check.warning_too_long'));
        }

        return warnings;
    }

    displayResults(analysis) {
        // Strength Badge and Meter
        this.elements.strengthText.textContent = this.t(analysis.strengthKey) || analysis.strength;
        this.elements.strengthBadge.className = `strength-badge ${analysis.strength}`;
        
        // تحديث عداد القوة
        this.updateStrengthMeter(analysis.strength, analysis.score);

        // Crack Time
        this.elements.crackTimeText.textContent = analysis.crackTime;

        // Score Breakdown
        this.elements.scoreBreakdown.innerHTML = '';
        const scoreItems = [
            { 
                key: 'check.score_length', 
                value: `${analysis.length} ${this.t('check.score_characters')}`,
                condition: analysis.feedback.hasLength,
                weight: analysis.length >= 12 ? 'high' : analysis.length >= 8 ? 'medium' : 'low'
            },
            { 
                key: 'check.score_uppercase', 
                condition: analysis.feedback.hasUppercase,
                weight: 'medium'
            },
            { 
                key: 'check.score_lowercase', 
                condition: analysis.feedback.hasLowercase,
                weight: 'medium'
            },
            { 
                key: 'check.score_numbers', 
                condition: analysis.feedback.hasNumbers,
                weight: 'medium'
            },
            { 
                key: 'check.score_symbols', 
                condition: analysis.feedback.hasSymbols,
                weight: 'high'
            },
            { 
                key: 'check.score_no_repeats', 
                condition: analysis.feedback.hasNoRepeats,
                weight: 'medium'
            },
            { 
                key: 'check.score_no_sequential', 
                condition: analysis.feedback.hasNoSequential,
                weight: 'low'
            },
            { 
                key: 'check.score_not_common', 
                condition: analysis.feedback.hasNoCommon,
                weight: 'high'
            }
        ];

        scoreItems.forEach(item => {
            const icon = item.condition ? 
                '<i class="fas fa-check-circle positive"></i>' : 
                '<i class="fas fa-times-circle negative"></i>';
            const text = item.value ? 
                `${this.t(item.key)} (${item.value})` : 
                this.t(item.key);
            const weightClass = `weight-${item.weight}`;
            
            this.elements.scoreBreakdown.innerHTML += `
                <div class="score-item ${weightClass}">
                    ${icon} 
                    <span class="score-text">${text}</span>
                </div>
            `;
        });

        // Improvement Tips
        this.elements.tipsList.innerHTML = '';
        analysis.tips.forEach(tip => {
            this.elements.tipsList.innerHTML += `
                <div class="tip-item">
                    <i class="fas fa-lightbulb"></i>
                    <span class="tip-text">${tip}</span>
                </div>
            `;
        });

        // Security Warnings
        if (analysis.warnings.length > 0) {
            this.elements.warningsList.innerHTML = '';
            analysis.warnings.forEach(warning => {
                this.elements.warningsList.innerHTML += `
                    <div class="warning-item">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span class="warning-text">${warning}</span>
                    </div>
                `;
            });
            this.elements.warningsCard.style.display = 'block';
        } else {
            this.elements.warningsCard.style.display = 'none';
        }

        // إضافة نتيجة النقاط الإجمالية
        this.displayTotalScore(analysis.score);
    }

    displayTotalScore(score) {
        // إضافة عرض النقاط الإجمالية إذا لم يكن موجوداً
        let scoreDisplay = document.getElementById('totalScoreDisplay');
        if (!scoreDisplay) {
            scoreDisplay = document.createElement('div');
            scoreDisplay.id = 'totalScoreDisplay';
            scoreDisplay.className = 'total-score';
            this.elements.strengthBadge.parentNode.appendChild(scoreDisplay);
        }
        
        const maxScore = 25;
        const percentage = (score / maxScore) * 100;
        scoreDisplay.innerHTML = `
            <div class="score-progress">
                <div class="score-fill" style="width: ${percentage}%"></div>
            </div>
            <span class="score-text">${score}/${maxScore}</span>
        `;
    }

    showToast(message, type = 'info') {
        // إزالة أي toast سابق
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    document.body.removeChild(toast);
                }
            }, 500);
        }, 4000);
    }

    getToastIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    t(key) {
        if (window.translations && window.translations[key]) {
            return window.translations[key];
        }
        // Fallback to a default value or the key itself
        const fallback = {
            'check.please_enter_password': 'الرجاء إدخال كلمة مرور',
            'check.breach_checking': 'جاري التحقق من التسريب...',
            'check.breach_found_count': 'تم العثور على كلمة المرور هذه في {count} تسريب معروف.',
            'check.breach_warning': 'تحذير أمني!',
            'check.breach_safe_title': 'آمنة',
            'check.breach_safe': 'لم يتم العثور على كلمة المرور في أي تسريب معروف.',
            'check.breach_error': 'حدث خطأ أثناء التحقق.',
            'check.breach_connection_error': 'تعذر الاتصال بخادم التحقق.',
            'check.breach_recommendation': 'يجب تغيير هذه كلمة المرور فوراً.',
            'check.strength_very_weak': 'ضعيفة جداً',
            'check.strength_weak': 'ضعيفة',
            'check.strength_medium': 'متوسطة',
            'check.strength_strong': 'قوية',
            'check.strength_very_strong': 'قوية جداً',
            'check.crack_seconds': 'ثواني',
            'check.crack_minutes': 'دقائق',
            'check.crack_hours': 'ساعات',
            'check.crack_days': 'أيام',
            'check.crack_months': 'شهور',
            'check.crack_years': 'سنوات',
            'check.crack_centuries': 'قرون',
            'check.tip_length': 'استخدم 12 حرفًا على الأقل لزيادة الأمان.',
            'check.tip_uppercase': 'أضف حروفًا كبيرة (A-Z) لتعزيز القوة.',
            'check.tip_lowercase': 'أضف حروفًا صغيرة (a-z) للتنوع.',
            'check.tip_numbers': 'أضف أرقامًا (0-9) لزيادة التعقيد.',
            'check.tip_symbols': 'أضف رموزًا (!@#$%) لتعظيم الأمان.',
            'check.tip_no_repeats': 'تجنب تكرار الحروف المتتالية.',
            'check.tip_no_sequential': 'تجنب التسلسلات الرقمية أو الأبجدية.',
            'check.tip_excellent': 'ممتاز! كلمة المرور قوية جداً. 🔒',
            'check.tip_very_good': 'جيدة جداً! يمكنك تحسينها أكثر بإضافة الرموز.',
            'check.warning_short': 'كلمة المرور قصيرة جدًا (أقل من 8 أحرف).',
            'check.warning_medium_length': 'يفضل استخدام 12 حرفًا على الأقل.',
            'check.warning_no_mixed_case': 'ينقصها مزيج من الحروف الكبيرة والصغيرة.',
            'check.warning_no_numbers': 'ينقصها الأرقام.',
            'check.warning_no_symbols': 'ينقصها الرموز الخاصة.',
            'check.warning_repeats': 'تحتوي على حروف مكررة بشكل متتالي.',
            'check.warning_common': 'كلمة مرور شائعة وسهلة التخمين.',
            'check.warning_too_long': 'كلمة المرور طويلة جداً وقد يصعب تذكرها.',
            'check.score_length': 'الطول',
            'check.score_characters': 'حرف',
            'check.score_uppercase': 'حروف كبيرة',
            'check.score_lowercase': 'حروف صغيرة',
            'check.score_numbers': 'أرقام',
            'check.score_symbols': 'رموز',
            'check.score_no_repeats': 'خالية من التكرار',
            'check.score_no_sequential': 'خالية من التسلسل',
            'check.score_not_common': 'غير شائعة',
            'check.analyzing': 'جاري التحليل...',
            'check.analysis_error': 'حدث خطأ أثناء التحليل',
            'common.show_password': 'إظهار كلمة المرور',
            'common.hide_password': 'إخفاء كلمة المرور'
        };
        return fallback[key] || key;
    }
}

// تهيئة المحلل عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    new PasswordChecker();
    
    // إضافة تأثيرات إضافية
    const passwordInput = document.getElementById('passwordInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    
    // تأثير التركيز على حقل الإدخال
    passwordInput.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });
    
    passwordInput.addEventListener('blur', function() {
        if (!this.value) {
            this.parentElement.classList.remove('focused');
        }
    });
    
    // تأثير الزر عند الضغط
    analyzeBtn.addEventListener('mousedown', function() {
        this.style.transform = 'scale(0.95)';
    });
    
    analyzeBtn.addEventListener('mouseup', function() {
        this.style.transform = 'scale(1)';
    });
    
    analyzeBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
});