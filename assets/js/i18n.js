// ===== Internationalization (i18n) System =====
class I18n {
    constructor() {
        this.currentLang = 'ar';
        this.translations = {};
        this.initialized = false;
    }

    // Initialize the translation system
    async init(lang = null) {
        if (lang) {
            this.currentLang = lang;
        } else {
            // Get saved language preference
            this.currentLang = localStorage.getItem('hasenha-lang') || 'ar';
        }

        // Load translations
        await this.loadTranslations(this.currentLang);
        
        // Update HTML attributes
        document.documentElement.lang = this.currentLang;
        document.documentElement.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';
        
        this.initialized = true;
        this.updatePage();
        
        // Dispatch event for other scripts
        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: this.currentLang }
        }));
    }

    // Load translations from JSON file
    async loadTranslations(lang) {
        try {
            const response = await fetch(`assets/lang/${lang}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.translations = await response.json();
        } catch (error) {
            console.error('Failed to load translations:', error);
            // Fallback to empty translations
            this.translations = {};
            
            // Try to load from backup path
            try {
                const backupResponse = await fetch(`/assets/lang/${lang}.json`);
                if (backupResponse.ok) {
                    this.translations = await backupResponse.json();
                }
            } catch (backupError) {
                console.error('Backup translation load failed:', backupError);
            }
        }
    }

    // Get translation for a key with nested structure support
    t(key, params = {}) {
        // Support nested keys like "common.nav_home"
        const keys = key.split('.');
        let translation = this.translations;
        
        for (const k of keys) {
            translation = translation?.[k];
            if (translation === undefined) break;
        }
        
        if (!translation || typeof translation !== 'string') {
            console.warn(`Translation missing for key: ${key}`);
            // Return the key itself or a fallback
            return this.getFallbackTranslation(key);
        }

        // Replace parameters in translation
        Object.keys(params).forEach(param => {
            translation = translation.replace(`{{${param}}}`, params[param]);
        });

        return translation;
    }

    // Get fallback translation
    getFallbackTranslation(key) {
        const fallbacks = {
            'common.nav_home': 'الرئيسية',
            'common.footer_bandar': 'بندر الجميلي',
            'common.toast_copied': 'تم النسخ بنجاح!',
            'meta.page_title_landing': 'حصّنها | Hasenha',
            'landing.hero_title': 'مولد كلمات المرور الاحترافي',
            'generator.title': 'مولد كلمات المرور',
            'privacy.title': 'سياسة الخصوصية',
            'faq.title': 'الأسئلة الشائعة',
            'about.hero_title': 'بندر الجميلي'
        };
        
        return fallbacks[key] || key;
    }

    // Change language
    async changeLanguage(lang) {
        if (lang === this.currentLang) return;
        
        this.currentLang = lang;
        localStorage.setItem('hasenha-lang', lang);
        
        await this.loadTranslations(lang);
        
        // Update HTML attributes
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        
        this.updatePage();
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: lang }
        }));
    }

    // Update all elements on the page with nested key support
    updatePage() {
        // Update elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else if (element.tagName === 'IMG' && element.hasAttribute('data-i18n-alt')) {
                element.alt = translation;
            } else {
                element.textContent = translation;
            }
        });

        // Update elements with data-i18n-html attribute (for HTML content)
        document.querySelectorAll('[data-i18n-html]').forEach(element => {
            const key = element.getAttribute('data-i18n-html');
            element.innerHTML = this.t(key);
        });

        // Update elements with data-i18n-title attribute
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });

        // Update elements with data-i18n-aria-label attribute
        document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
            const key = element.getAttribute('data-i18n-aria-label');
            element.setAttribute('aria-label', this.t(key));
        });

        // Update elements with data-i18n-placeholder attribute
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.t(key);
        });

        // Update page title and meta descriptions
        this.updateMetaTags();
        
        // Special handling for footer
        this.updateFooter();
    }

    // Update meta tags
    updateMetaTags() {
        const pageTitle = document.querySelector('title[data-i18n]');
        if (pageTitle) {
            const key = pageTitle.getAttribute('data-i18n');
            document.title = this.t(key);
        }

        // Update meta description
        const metaDescription = document.querySelector('meta[name="description"][data-i18n]');
        if (metaDescription) {
            const key = metaDescription.getAttribute('data-i18n');
            metaDescription.content = this.t(key);
        }

        // Update OG tags
        const ogTitle = document.querySelector('meta[property="og:title"][data-i18n]');
        if (ogTitle) {
            const key = ogTitle.getAttribute('data-i18n');
            ogTitle.content = this.t(key);
        }

        const ogDescription = document.querySelector('meta[property="og:description"][data-i18n]');
        if (ogDescription) {
            const key = ogDescription.getAttribute('data-i18n');
            ogDescription.content = this.t(key);
        }
    }

    // Update footer specifically
    updateFooter() {
        const footerLinks = document.querySelectorAll('.footer-link[data-i18n="common.footer_bandar"]');
        footerLinks.forEach(link => {
            link.textContent = this.t('common.footer_bandar');
        });
    }

    // Get current language
    getCurrentLanguage() {
        return this.currentLang;
    }

    // Check if system is initialized
    isInitialized() {
        return this.initialized;
    }
}

// Create global instance
window.i18n = new I18n();