// ===== Privacy Page Specific JavaScript =====

// Initialize privacy page
document.addEventListener('DOMContentLoaded', () => {
  // Update last updated date
  updateLastUpdatedDate();
  
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

  // Add scroll animations for privacy articles
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

  // Observe privacy articles for scroll animations
  document.querySelectorAll('.privacy-article').forEach(article => {
    article.style.opacity = '0';
    article.style.transform = 'translateY(30px)';
    article.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(article);
  });

  // Add highlight effect when navigating to specific sections
  highlightCurrentSection();

  // Add copy email functionality
  setupEmailCopy();
});

// Update last updated date
function updateLastUpdatedDate() {
  const lastUpdatedElement = document.querySelector('.last-updated');
  if (lastUpdatedElement) {
    const updateDate = new Date('2024-01-15');
    const formattedDate = updateDate.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Use i18n for the date if available, otherwise use the formatted date
    const currentLang = i18n.getCurrentLanguage();
    const translation = i18n.t('last_updated', { date: formattedDate });
    lastUpdatedElement.textContent = translation;
  }
}

// Highlight current section in navigation
function highlightCurrentSection() {
  const sections = document.querySelectorAll('.privacy-article');
  const navLinks = document.querySelectorAll('.nav-links a');
  
  const observerOptions = {
    threshold: 0.3,
    rootMargin: '-20% 0px -20% 0px'
  };

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Remove active class from all links
        navLinks.forEach(link => link.classList.remove('active'));
        
        // Add active class to corresponding link
        const id = entry.target.id;
        const correspondingLink = document.querySelector(`.nav-links a[href="#${id}"]`);
        if (correspondingLink) {
          correspondingLink.classList.add('active');
          correspondingLink.style.background = 'linear-gradient(135deg, var(--cyber-blue), var(--cyber-red))';
          correspondingLink.style.color = 'white';
        }
      }
    });
  }, observerOptions);

  sections.forEach(section => {
    sectionObserver.observe(section);
  });
}

// Setup email copy functionality
function setupEmailCopy() {
  const emailLink = document.querySelector('.contact-method a[href^="mailto:"]');
  if (emailLink) {
    emailLink.addEventListener('click', function(e) {
      // Copy email to clipboard
      const email = this.textContent;
      navigator.clipboard.writeText(email).then(() => {
        showToast(i18n.t('email_copied'), 'success');
      }).catch(() => {
        // Fallback - open email client
        // Let the default mailto: behavior happen
      });
    });
  }
}

// Add interactive effects to privacy points
function addInteractiveEffects() {
  // Add hover effects to privacy points
  const privacyPoints = document.querySelectorAll('.privacy-point');
  
  privacyPoints.forEach(point => {
    point.addEventListener('mouseenter', () => {
      const icon = point.querySelector('i');
      if (icon) {
        icon.style.transform = 'scale(1.2)';
        icon.style.transition = 'transform 0.3s ease';
      }
    });
    
    point.addEventListener('mouseleave', () => {
      const icon = point.querySelector('i');
      if (icon) {
        icon.style.transform = 'scale(1)';
      }
    });
  });

  // Add click effects to service cards
  const serviceCards = document.querySelectorAll('.service-card');
  
  serviceCards.forEach(card => {
    card.addEventListener('click', () => {
      card.style.transform = 'scale(0.95)';
      setTimeout(() => {
        card.style.transform = '';
      }, 150);
    });
  });
}

// Print privacy policy
function printPrivacyPolicy() {
  window.print();
}

// Share privacy policy
function sharePrivacyPolicy() {
  if (navigator.share) {
    navigator.share({
      title: document.title,
      text: i18n.t('share_text'),
      url: window.location.href
    }).catch(error => {
      console.log('Error sharing:', error);
    });
  } else {
    // Fallback - copy URL to clipboard
    navigator.clipboard.writeText(window.location.href).then(() => {
      showToast(i18n.t('url_copied'), 'success');
    });
  }
}

// Listen for language changes
window.addEventListener('languageChanged', (e) => {
  // Update last updated date with new language
  updateLastUpdatedDate();
  
  // Update any dynamic content that depends on language
  console.log('Privacy page language changed to:', e.detail.language);
});

// Call interactive effects after page load
window.addEventListener('load', addInteractiveEffects);

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + P - Print privacy policy
  if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
    e.preventDefault();
    printPrivacyPolicy();
  }
  
  // Ctrl/Cmd + Shift + S - Share privacy policy
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
    e.preventDefault();
    sharePrivacyPolicy();
  }
});