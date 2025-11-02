// Landing Page Specific JavaScript

class LiveStatsManager {
    constructor() {
        this.stats = {
            generated: 0,
            checked: 0
        };
        this.isAnimating = false;
        this.init();
    }

    init() {
        this.loadStats();
        this.setupAutoRefresh();
        this.bindEvents();
    }

    async loadStats() {
        try {
            const response = await fetch('/api/stats');
            const data = await response.json();
            
            if (data.success && data.stats) {
                this.stats = {
                    generated: data.stats.total_generated || 0,
                    checked: data.stats.total_checked || 0
                };
                this.updateDisplay();
            } else {
                // إذا لم تكن البيانات متوفرة، استخدم القيم الافتراضية
                this.showFallbackStats();
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
            this.showFallbackStats();
        }
    }

    updateDisplay() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        
        // استخدام setTimeout لفصل العمليات ومنع التضارب
        setTimeout(() => {
            this.animateCounter('generatedCount', this.stats.generated);
        }, 100);
        
        setTimeout(() => {
            this.animateCounter('checkedCount', this.stats.checked);
            this.isAnimating = false;
        }, 300);
        
        this.updateLastRefreshTime();
    }

    animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;

        // تنظيف أي رسوم متحركة سابقة
        element.style.animation = 'none';
        
        const currentText = element.textContent.replace(/[^0-9]/g, '');
        const currentValue = currentText ? parseInt(currentText) : 0;
        
        if (currentValue === targetValue) return;

        const duration = 1500; // 1.5 second
        const stepTime = 30; // زيادة الوقت بين الخطوات
        const steps = duration / stepTime;
        const increment = (targetValue - currentValue) / steps;
        let currentStep = 0;

        // إلغاء أي timer سابق
        if (element.timer) {
            clearInterval(element.timer);
        }

        element.timer = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;
            
            // استخدام دالة ease-out لحركة أكثر سلاسة
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const newValue = Math.floor(currentValue + (increment * steps * easeOut));
            
            if (currentStep >= steps || newValue >= targetValue) {
                element.textContent = this.formatNumber(targetValue);
                clearInterval(element.timer);
                delete element.timer;
                
                // إضافة تأثير بسيط عند اكتمال العد
                element.classList.add('pulse');
                setTimeout(() => element.classList.remove('pulse'), 600);
            } else {
                element.textContent = this.formatNumber(newValue);
            }
        }, stepTime);
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    setupAutoRefresh() {
        // تحديث الإحصائيات كل 30 ثانية
        setInterval(() => {
            if (!this.isAnimating) {
                this.loadStats();
            }
        }, 30000);

        // تحديث أولي بعد 5 ثواني
        setTimeout(() => {
            this.loadStats();
        }, 5000);
    }

    updateLastRefreshTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        console.log('🔄 Stats updated at:', timeString);
    }

    showFallbackStats() {
        // قيم افتراضية إذا فشل جلب البيانات
        this.stats = {
            generated: 1250,
            checked: 890
        };
        this.updateDisplay();
    }

    bindEvents() {
        const updateInfo = document.querySelector('.stats-update-info');
        if (updateInfo) {
            updateInfo.addEventListener('click', () => {
                if (!this.isAnimating) {
                    this.loadStats();
                    this.showRefreshFeedback();
                }
            });
            
            // جعل المؤشر يتغير عند التمرير فوقه
            updateInfo.style.cursor = 'pointer';
        }
    }

    showRefreshFeedback() {
        const icon = document.querySelector('.stats-update-info i');
        if (icon) {
            // إعادة تعيين الحركة
            icon.style.animation = 'none';
            void icon.offsetWidth; // trigger reflow
            icon.style.animation = 'spin 1s ease-in-out';
            
            // إزالة الحركة بعد اكتمالها
            setTimeout(() => {
                icon.style.animation = '';
            }, 1000);
        }
    }
}

// إضافة CSS ديناميكي للحركات
function addDynamicStyles() {
    const styles = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .live-stat-number.pulse {
            animation: pulse 0.6s ease-in-out;
        }
        
        .stats-update-info i {
            transition: color 0.3s ease;
        }
        
        .stats-update-info:hover i {
            color: #00d9ff;
        }
        
        .live-stat-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .live-stat-card:hover {
            transform: translateY(-5px);
        }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}

// Initialize landing page
document.addEventListener('DOMContentLoaded', () => {
  // إضافة الأنماط الديناميكية أولاً
  addDynamicStyles();
  
  // Initialize live stats
  window.statsManager = new LiveStatsManager();

  // Add smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Add scroll animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // Observe elements for scroll animations
  document.querySelectorAll('.feature-card, .stat-card, .live-stat-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
  });

  // Add particle interaction
  const particles = document.querySelector('.floating-particles');
  if (particles) {
    document.addEventListener('mousemove', (e) => {
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth) * 100;
      const y = (clientY / window.innerHeight) * 100;
      
      particles.style.backgroundPosition = `${x}% ${y}%`;
    });
  }

  // Add hover effects to live stats cards
  const liveStatsCards = document.querySelectorAll('.live-stat-card');
  liveStatsCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      const number = card.querySelector('.live-stat-number');
      if (number) {
        number.style.transform = 'scale(1.05)';
      }
    });
    
    card.addEventListener('mouseleave', () => {
      const number = card.querySelector('.live-stat-number');
      if (number) {
        number.style.transform = 'scale(1)';
      }
    });
  });

  const opensourceFeatures = document.querySelectorAll('.opensource-feature');
  opensourceFeatures.forEach(feature => {
    feature.addEventListener('mouseenter', () => {
      const icon = feature.querySelector('i');
      if (icon) {
        icon.style.transform = 'scale(1.2)';
        icon.style.color = '#00d9ff';
      }
    });
    
    feature.addEventListener('mouseleave', () => {
      const icon = feature.querySelector('i');
      if (icon) {
        icon.style.transform = 'scale(1)';
        icon.style.color = '';
      }
    });
  });
});

// Listen for language changes
window.addEventListener('languageChanged', (e) => {
  console.log('Language changed to:', e.detail.language);
  
  // إعادة تحميل الإحصائيات بعد تغيير اللغة
  setTimeout(() => {
    if (window.statsManager) {
      window.statsManager.loadStats();
    }
  }, 1000);
});

// تحسين الأداء
window.addEventListener('load', () => {
  if ('performance' in window) {
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    console.log(`🚀 Page loaded in ${loadTime}ms`);
  }
});