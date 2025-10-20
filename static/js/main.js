// ===== Initialize AOS =====
AOS.init({
  duration: 800,
  easing: 'ease-out-cubic',
  once: true,
  offset: 50
});

// ===== State =====
let currentTheme = 'dark';

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
}

// ===== Language Toggle =====
function toggleLanguage() {
  const currentLang = i18n.getCurrentLanguage();
  const newLang = currentLang === 'ar' ? 'en' : 'ar';
  i18n.changeLanguage(newLang);
  
  // Update language toggle button text
  const langText = document.querySelector('#langToggle .lang-text');
  if (langText) {
    langText.textContent = newLang === 'ar' ? 'EN' : 'ع';
  }
}

// ===== Toast Notification =====
function showToast(message, type = 'success') {
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
  const themeIcon = document.querySelector('#themeToggle i');
  if (themeIcon) {
    themeIcon.className = currentTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
  }
  
  const langText = document.querySelector('#langToggle .lang-text');
  if (langText) {
    const currentLang = i18n.getCurrentLanguage();
    langText.textContent = currentLang === 'ar' ? 'EN' : 'ع';
  }
}

// ===== Event Listeners =====
document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  // Language Toggle
  const langToggle = document.getElementById('langToggle');
  if (langToggle) {
    langToggle.addEventListener('click', toggleLanguage);
  }
  
  // Initialize app
  initializeApp();
});

// ===== Update Footer =====
function updateFooter() {
  const footerBandar = document.querySelector('.main-footer a[data-i18n="footer_bandar"]');
  if (footerBandar) {
    footerBandar.textContent = i18n.t('footer_bandar');
  }
}

// في دالة initializeApp
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
  const themeIcon = document.querySelector('#themeToggle i');
  if (themeIcon) {
    themeIcon.className = currentTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
  }
  
  const langText = document.querySelector('#langToggle .lang-text');
  if (langText) {
    const currentLang = i18n.getCurrentLanguage();
    langText.textContent = currentLang === 'ar' ? 'EN' : 'ع';
  }
  
  // Update footer
  updateFooter();
}

// في حدث تغيير اللغة
window.addEventListener('languageChanged', (e) => {
  // Update footer on language change
  updateFooter();
});

// في حدث تغيير اللغة
window.addEventListener('languageChanged', (e) => {
  // Update footer on language change
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