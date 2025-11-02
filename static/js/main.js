// ===== Initialize AOS =====
AOS.init({
  duration: 800,
  easing: 'ease-out-cubic',
  once: true,
  offset: 50
});

// ===== State =====
let currentTheme = 'dark';

// ===== Language Modal =====
function openLanguageModal() {
  const modal = document.getElementById('languageModal');
  if (modal) {
    modal.classList.add('show');
    
    // Set active language
    const currentLang = i18n.getCurrentLanguage();
    const activeOption = modal.querySelector(`[data-lang="${currentLang}"]`);
    if (activeOption) {
      document.querySelectorAll('.lang-option').forEach(option => {
        option.classList.remove('active');
      });
      activeOption.classList.add('active');
    }
  }
}

function closeLanguageModal() {
  const modal = document.getElementById('languageModal');
  if (modal) {
    modal.classList.remove('show');
  }
}

async function changeLanguage(lang) {
  if (lang === i18n.getCurrentLanguage()) {
    closeLanguageModal();
    return;
  }

  // Add loading state
  document.body.classList.add('language-changing');
  
  try {
    await i18n.changeLanguage(lang);
    
    // Update language toggle button
    const langText = document.querySelector('#langToggle .lang-text');
    if (langText) {
      const langMap = {
        'ar': 'ع',
        'en': 'EN', 
        'fr': 'FR',
        'de': 'DE',
        'es': 'ES'
      };
      langText.textContent = langMap[lang] || lang.toUpperCase();
    }
    
    showToast(`${i18n.t('common.language_changed')} ${getLanguageName(lang)}`, 'success');
    
  } catch (error) {
    console.error('Language change failed:', error);
    showToast(i18n.t('common.language_error'), 'error');
  } finally {
    document.body.classList.remove('language-changing');
    closeLanguageModal();
  }
}

function getLanguageName(langCode) {
  const languages = {
    'ar': 'العربية',
    'en': 'English',
    'fr': 'Français', 
    'de': 'Deutsch',
    'es': 'Español'
  };
  return languages[langCode] || langCode;
}

// ===== Theme Toggle =====
function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.body.classList.toggle('light-theme');
  
  const icon = document.querySelector('#themeToggle i');
  if (icon) {
    icon.className = currentTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
  }
  
  // Save theme preference
  localStorage.setItem('hasenha-theme', currentTheme);
  
  // Show theme change notification
  const themeName = currentTheme === 'dark' ? i18n.t('common.theme_dark') : i18n.t('common.theme_light');
  showToast(`${i18n.t('common.theme_changed')} ${themeName}`, 'info');
}

// ===== Toast Notification =====
function showToast(message, type = 'success') {
  // Remove existing toasts
  const existingToasts = document.querySelectorAll('.toast');
  existingToasts.forEach(toast => toast.remove());

  // Create new toast
  const toast = document.createElement('div');
  toast.className = `toast show ${type}`;
  
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle', 
    info: 'fa-info-circle',
    warning: 'fa-exclamation-triangle'
  };
  
  toast.innerHTML = `
    <i class="fas ${icons[type] || 'fa-check-circle'}"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(toast);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

// ===== Initialize =====
async function initializeApp() {
  // Initialize i18n first
  await i18n.init();
  
  // Load saved theme
  const savedTheme = localStorage.getItem('hasenha-theme');
  if (savedTheme) {
    currentTheme = savedTheme;
    if (currentTheme === 'light') {
      document.body.classList.add('light-theme');
    }
  }
  
  // Update UI based on preferences
  updateUI();
  
  // Add modal event listeners
  setupModalEvents();
}

function updateUI() {
  // Update theme icon
  const themeIcon = document.querySelector('#themeToggle i');
  if (themeIcon) {
    themeIcon.className = currentTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
  }
  
  // Update language toggle text
  const langText = document.querySelector('#langToggle .lang-text');
  if (langText) {
    const currentLang = i18n.getCurrentLanguage();
    const langMap = {
      'ar': 'ع',
      'en': 'EN',
      'fr': 'FR',
      'de': 'DE', 
      'es': 'ES'
    };
    langText.textContent = langMap[currentLang] || currentLang.toUpperCase();
  }
}

function setupModalEvents() {
  const modal = document.getElementById('languageModal');
  const closeBtn = modal?.querySelector('.close-btn');
  
  // Close modal when clicking outside
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeLanguageModal();
      }
    });
  }
  
  // Close button
  if (closeBtn) {
    closeBtn.addEventListener('click', closeLanguageModal);
  }
  
  // Language options
  document.querySelectorAll('.lang-option').forEach(option => {
    option.addEventListener('click', () => {
      const lang = option.getAttribute('data-lang');
      changeLanguage(lang);
    });
  });
  
  // Escape key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLanguageModal();
    }
  });
}

// ===== Event Listeners =====
document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  // Language Toggle - Open Modal
  const langToggle = document.getElementById('langToggle');
  if (langToggle) {
    langToggle.addEventListener('click', openLanguageModal);
  }
  
  // Initialize app
  initializeApp();
});

// ===== Update Footer =====
function updateFooter() {
  const footerBandar = document.querySelector('.main-footer a[data-i18n="common.footer_bandar"]');
  if (footerBandar) {
    footerBandar.textContent = i18n.t('common.footer_bandar');
  }
}

// Listen for language changes
window.addEventListener('languageChanged', (e) => {
  updateUI();
  updateFooter();
});

// ===== Performance: Debounce Function =====
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ===== Console Easter Egg =====
console.log('%c🔐 حصّنها | Hasenha', 'color: #00d9ff; font-size: 24px; font-weight: bold;');
console.log('%cPassword Generator v1.0', 'color: #ff0055; font-size: 16px;');
console.log('%cDeveloped with ❤️ for security', 'color: #8892b0; font-size: 12px;');
console.log('%c🌍 Multi-language support: AR, EN, FR, DE, ES', 'color: #00d9ff; font-size: 14px;');