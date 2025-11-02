// ===== Generator Specific JavaScript =====

// ===== State =====
let currentType = 'strong';
let passwordHistory = [];

// ===== Statistics Tracking =====
async function updateStats(action) {
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

// ===== Character Sets =====
const charSets = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  similar: '0Ol1'
};

// ===== Word List =====
const wordList = [
  'apple', 'brave', 'castle', 'dolphin', 'energy', 'falcon', 'garden', 'honey',
  'island', 'jungle', 'king', 'lion', 'music', 'night', 'ocean', 'puzzle',
  'queen', 'rocket', 'silver', 'tiger', 'unique', 'violet', 'water', 'yellow',
  'zebra', 'aurora', 'breeze', 'cascade', 'desert', 'eclipse', 'flame', 'galaxy',
  'horizon', 'infinity', 'jupiter', 'karma', 'lagoon', 'mystic', 'nebula', 'oasis',
  'phoenix', 'quartz', 'rainbow', 'sapphire', 'tornado', 'unicorn', 'volcano', 'whisper',
  'xenon', 'yearning', 'zephyr', 'amber', 'blaze', 'crystal', 'diamond', 'emerald',
  'frost', 'glory', 'harmony', 'illusion', 'jade', 'knight', 'liberty', 'miracle',
  'noble', 'omega', 'prism', 'quest', 'radiant', 'serenity', 'thunder', 'unity',
  'victory', 'wisdom', 'zenith', 'arrow', 'beacon', 'comet', 'dream', 'echo'
];

// ===== Password Generators =====
function generateStrongPassword() {
  const length = parseInt(document.getElementById('strongLength').value);
  const includeUpper = document.getElementById('includeUppercase').checked;
  const includeLower = document.getElementById('includeLowercase').checked;
  const includeNums = document.getElementById('includeNumbers').checked;
  const includeSyms = document.getElementById('includeSymbols').checked;
  const excludeSim = document.getElementById('excludeSimilar').checked;
  
  if (!includeUpper && !includeLower && !includeNums && !includeSyms) {
    showToast(i18n.t('toast_select_option'), 'error');
    return null;
  }
  
  let charset = '';
  if (includeUpper) charset += charSets.uppercase;
  if (includeLower) charset += charSets.lowercase;
  if (includeNums) charset += charSets.numbers;
  if (includeSyms) charset += charSets.symbols;
  
  if (excludeSim) {
    charset = charset.split('').filter(char => !charSets.similar.includes(char)).join('');
  }
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  return password;
}

function generateMemorablePassword() {
  const wordCount = parseInt(document.getElementById('wordCount').value);
  const separator = document.getElementById('separatorSelect').value;
  const capitalize = document.getElementById('capitalizeWords').checked;
  const addNums = document.getElementById('addNumbers').checked;
  
  let words = [];
  for (let i = 0; i < wordCount; i++) {
    let word = wordList[Math.floor(Math.random() * wordList.length)];
    if (capitalize) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
    }
    if (addNums) {
      word += Math.floor(Math.random() * 100);
    }
    words.push(word);
  }
  
  return words.join(separator);
}

function generatePIN() {
  const length = parseInt(document.querySelector('.pin-btn.active').dataset.length);
  let pin = '';
  for (let i = 0; i < length; i++) {
    pin += Math.floor(Math.random() * 10);
  }
  return pin;
}

function generateCustomPassword() {
  const chars = document.getElementById('customChars').value;
  const length = parseInt(document.getElementById('customLength').value);
  
  if (chars.length < 4) {
    showToast(i18n.t('toast_min_chars'), 'error');
    return null;
  }
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  
  return password;
}

// ===== Password Strength =====
function analyzeStrength(password) {
  if (!password) return { score: 0, strength: 'weak' };
  
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  let strength = 'weak';
  if (score >= 4) strength = 'medium';
  if (score >= 6) strength = 'strong';
  
  return { score, strength };
}

function updateStrengthDisplay(password) {
  const { score, strength } = analyzeStrength(password);
  const strengthBar = document.getElementById('strengthBar');
  const strengthValue = document.getElementById('strengthValue');
  
  strengthBar.className = `strength-bar ${strength}`;
  strengthValue.className = `strength-value ${strength}`;
  strengthValue.textContent = i18n.t(`strength_${strength}`);
}

// ===== History Management =====
function addToHistory(password) {
  if (!password) return;
  
  passwordHistory.unshift({
    password,
    timestamp: Date.now()
  });
  
  if (passwordHistory.length > 10) {
    passwordHistory = passwordHistory.slice(0, 10);
  }
  
  updateHistoryDisplay();
}

function updateHistoryDisplay() {
  const historyList = document.getElementById('historyList');
  
  if (passwordHistory.length === 0) {
    historyList.innerHTML = `<p class="empty-message" data-i18n="empty_history">${i18n.t('empty_history')}</p>`;
    return;
  }
  
  historyList.innerHTML = passwordHistory.map((item, index) => `
    <div class="history-item" data-aos="fade-left" data-aos-delay="${index * 50}">
      <span class="history-password">${item.password}</span>
      <div class="history-actions">
        <button class="history-btn" onclick="copyFromHistory('${item.password}')">
          <i class="fas fa-copy"></i>
        </button>
      </div>
    </div>
  `).join('');
  
  AOS.refresh();
}

function copyFromHistory(password) {
  copyToClipboard(password);
}

function clearHistory() {
  passwordHistory = [];
  updateHistoryDisplay();
  showToast(i18n.t('history_cleared'), 'success');
}

// ===== Clipboard =====
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast(i18n.t('toast_copied'), 'success');
  }).catch(() => {
    showToast(i18n.t('toast_error'), 'error');
  });
}

// ===== Type Selection =====
function switchType(type) {
  currentType = type;
  
  document.querySelectorAll('.type-card').forEach(card => {
    card.classList.remove('active');
  });
  
  document.querySelector(`[data-type="${type}"]`).classList.add('active');
  
  document.querySelectorAll('.options-content').forEach(content => {
    content.classList.remove('active');
  });
  
  document.getElementById(`${type}Options`).classList.add('active');
}

// ===== Generate Password =====
async function generatePassword() {
  let password = null;
  
  switch (currentType) {
    case 'strong':
      password = generateStrongPassword();
      break;
    case 'memorable':
      password = generateMemorablePassword();
      break;
    case 'pin':
      password = generatePIN();
      break;
    case 'custom':
      password = generateCustomPassword();
      break;
  }
  
  if (password) {
    document.getElementById('passwordOutput').value = password;
    updateStrengthDisplay(password);
    addToHistory(password);
    
    // 🔄 تحديث الإحصاءات في قاعدة البيانات
    await updateStats('generate');
    
    document.querySelector('.password-display-section').scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
  }
}

// ===== Quick Actions =====
function exportPasswords() {
  if (passwordHistory.length === 0) {
    showToast(i18n.t('no_passwords_to_export'), 'error');
    return;
  }
  
  const dataStr = JSON.stringify({
    passwords: passwordHistory,
    exportedAt: Date.now(),
    tool: 'Hasenha Password Generator'
  });
  
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  const exportFileDefaultName = `hasenha_passwords_${Date.now()}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
  
  showToast(i18n.t('export_success'), 'success');
}

function saveSettings() {
  const settings = {
    currentType,
    strongLength: document.getElementById('strongLength').value,
    includeUppercase: document.getElementById('includeUppercase').checked,
    includeLowercase: document.getElementById('includeLowercase').checked,
    includeNumbers: document.getElementById('includeNumbers').checked,
    includeSymbols: document.getElementById('includeSymbols').checked,
    excludeSimilar: document.getElementById('excludeSimilar').checked,
    wordCount: document.getElementById('wordCount').value,
    separatorSelect: document.getElementById('separatorSelect').value,
    capitalizeWords: document.getElementById('capitalizeWords').checked,
    addNumbers: document.getElementById('addNumbers').checked,
    customLength: document.getElementById('customLength').value
  };
  
  localStorage.setItem('hasenha-settings', JSON.stringify(settings));
  showToast(i18n.t('settings_saved'), 'success');
}

function loadSettings() {
  const savedSettings = localStorage.getItem('hasenha-settings');
  if (savedSettings) {
    const settings = JSON.parse(savedSettings);
    
    // Apply settings
    switchType(settings.currentType);
    document.getElementById('strongLength').value = settings.strongLength;
    document.getElementById('strongLengthValue').textContent = settings.strongLength;
    document.getElementById('includeUppercase').checked = settings.includeUppercase;
    document.getElementById('includeLowercase').checked = settings.includeLowercase;
    document.getElementById('includeNumbers').checked = settings.includeNumbers;
    document.getElementById('includeSymbols').checked = settings.includeSymbols;
    document.getElementById('excludeSimilar').checked = settings.excludeSimilar;
    document.getElementById('wordCount').value = settings.wordCount;
    document.getElementById('wordCountValue').textContent = settings.wordCount;
    document.getElementById('separatorSelect').value = settings.separatorSelect;
    document.getElementById('capitalizeWords').checked = settings.capitalizeWords;
    document.getElementById('addNumbers').checked = settings.addNumbers;
    document.getElementById('customLength').value = settings.customLength;
    document.getElementById('customLengthValue').textContent = settings.customLength;
  }
}

function showKeyboardShortcuts() {
  const currentLang = i18n.getCurrentLanguage();
  const shortcuts = currentLang === 'ar' ? 
    `${i18n.t('keyboard_shortcuts')}:
    
    Ctrl+G - ${i18n.t('shortcut_generate')}
    Ctrl+C - ${i18n.t('shortcut_copy')}
    Ctrl+Shift+L - ${i18n.t('shortcut_language')}
    Ctrl+Shift+T - ${i18n.t('shortcut_theme')}
    Ctrl+S - ${i18n.t('shortcut_save')}` :
    `${i18n.t('keyboard_shortcuts')}:
    
    Ctrl+G - ${i18n.t('shortcut_generate')}
    Ctrl+C - ${i18n.t('shortcut_copy')}
    Ctrl+Shift+L - ${i18n.t('shortcut_language')}
    Ctrl+Shift+T - ${i18n.t('shortcut_theme')}
    Ctrl+S - ${i18n.t('shortcut_save')}`;
  
  alert(shortcuts);
}

// ===== Event Listeners =====
document.addEventListener('DOMContentLoaded', () => {
  
  // Type Selection
  document.querySelectorAll('.type-card').forEach(card => {
    card.addEventListener('click', () => {
      switchType(card.dataset.type);
    });
  });
  
  // Generate Button
  document.getElementById('generateBtn').addEventListener('click', generatePassword);
  
  // Refresh Button
  document.getElementById('refreshBtn').addEventListener('click', generatePassword);
  
  // Copy Button
  document.getElementById('copyBtn').addEventListener('click', () => {
    const password = document.getElementById('passwordOutput').value;
    if (password) {
      copyToClipboard(password);
    } else {
      showToast(i18n.t('no_password_to_copy'), 'error');
    }
  });
  
  // Clear History
  document.getElementById('clearHistory').addEventListener('click', clearHistory);
  
  // Slider Value Updates
  document.getElementById('strongLength').addEventListener('input', (e) => {
    document.getElementById('strongLengthValue').textContent = e.target.value;
  });
  
  document.getElementById('wordCount').addEventListener('input', (e) => {
    document.getElementById('wordCountValue').textContent = e.target.value;
  });
  
  document.getElementById('customLength').addEventListener('input', (e) => {
    document.getElementById('customLengthValue').textContent = e.target.value;
  });
  
  // PIN Length Selection
  document.querySelectorAll('.pin-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pin-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  
  // Password Input Change
  document.getElementById('passwordOutput').addEventListener('input', (e) => {
    updateStrengthDisplay(e.target.value);
  });
  
  // Quick Actions
  document.getElementById('exportPasswords').addEventListener('click', exportPasswords);
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
  document.getElementById('keyboardShortcuts').addEventListener('click', showKeyboardShortcuts);
  
  // Auto-generate on settings change
  const autoGenerateElements = [
    'strongLength', 'includeUppercase', 'includeLowercase', 'includeNumbers', 
    'includeSymbols', 'excludeSimilar', 'wordCount', 'separatorSelect',
    'capitalizeWords', 'addNumbers', 'customLength', 'customChars'
  ];
  
  autoGenerateElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('change', () => {
        if (currentType === 'custom' && id === 'customChars') {
          const chars = document.getElementById('customChars').value;
          if (chars.length >= 4) {
            setTimeout(generatePassword, 300);
          }
        } else {
          setTimeout(generatePassword, 300);
        }
      });
    }
  });
  
  // PIN buttons auto-generate
  document.querySelectorAll('.pin-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (currentType === 'pin') {
        setTimeout(generatePassword, 300);
      }
    });
  });
  
  // Load saved settings
  loadSettings();
  
  // Generate initial password
  setTimeout(generatePassword, 500);
});

// ===== Keyboard Shortcuts =====
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + G - Generate
  if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
    e.preventDefault();
    generatePassword();
  }
  
  // Ctrl/Cmd + C when password field is focused
  if ((e.ctrlKey || e.metaKey) && e.key === 'c' && 
      document.activeElement === document.getElementById('passwordOutput')) {
    const password = document.getElementById('passwordOutput').value;
    if (password) {
      copyToClipboard(password);
    }
  }
  
  // Ctrl/Cmd + S - Save settings
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveSettings();
  }
});

// ===== Enhanced Animations =====
document.querySelectorAll('.type-card').forEach(card => {
  card.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(-10px) scale(1.02)';
  });
  
  card.addEventListener('mouseleave', function() {
    this.style.transform = '';
  });
});

document.querySelector('.generate-btn').addEventListener('mouseenter', function() {
  this.style.transform = 'translateY(-5px) scale(1.02)';
});

document.querySelector('.generate-btn').addEventListener('mouseleave', function() {
  this.style.transform = '';
});

// Listen for language changes
window.addEventListener('languageChanged', (e) => {
  // Update strength display if password exists
  const password = document.getElementById('passwordOutput').value;
  if (password) {
    updateStrengthDisplay(password);
  }
  
  // Update history display
  updateHistoryDisplay();
});