// ===== About Page Specific JavaScript =====

// Initialize about page
document.addEventListener('DOMContentLoaded', () => {
  // Initialize animations
  initializeAnimations();
  
  // Add interactive effects
  addInteractiveEffects();
  
  // Initialize contact form functionality
  initializeContact();
  
  // Initialize skill animations
  initializeSkillAnimations();
  
  // Ensure icons are visible
  ensureIconsVisible();
  
  // Add smooth scroll behavior
  initializeSmoothScroll();
});

// Ensure all icons are visible
function ensureIconsVisible() {
  // Force icons to be visible
  const allIcons = document.querySelectorAll('.spec-icon i, .timeline-marker i, .project-image i');
  allIcons.forEach(icon => {
    icon.style.display = 'inline-block';
    icon.style.opacity = '1';
    icon.style.visibility = 'visible';
  });
  
  // Double check after a short delay
  setTimeout(() => {
    allIcons.forEach(icon => {
      if (icon.style.display === 'none' || icon.style.opacity === '0') {
        icon.style.display = 'inline-block';
        icon.style.opacity = '1';
        icon.style.visibility = 'visible';
      }
    });
  }, 100);
}

// Initialize animations
function initializeAnimations() {
  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -80px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        entry.target.classList.add('animated');
      }
    });
  }, observerOptions);

  // Observe elements for scroll animations
  const animatedElements = document.querySelectorAll(
    '.specialization-card, .project-card, .timeline-item, .mission-card, .contact-section'
  );
  
  animatedElements.forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(40px)';
    element.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
    observer.observe(element);
  });
  
  // Animate stats on load
  animateStats();
}

// Animate statistics numbers
function animateStats() {
  const stats = document.querySelectorAll('.stat-number');
  
  stats.forEach(stat => {
    const target = parseInt(stat.textContent);
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;
    
    const updateCount = () => {
      current += increment;
      if (current < target) {
        stat.textContent = Math.ceil(current) + '+';
        requestAnimationFrame(updateCount);
      } else {
        stat.textContent = target + '+';
      }
    };
    
    // Start animation when element is visible
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          updateCount();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    
    observer.observe(stat);
  });
}

// Add interactive effects
function addInteractiveEffects() {
  // Specialization cards - remove any conflicting hover handlers
  const specCards = document.querySelectorAll('.specialization-card');
  specCards.forEach(card => {
    // Let CSS handle the hover effects
    card.style.cursor = 'pointer';
  });
  
  // Project cards - add click feedback
  const projectCards = document.querySelectorAll('.project-card');
  projectCards.forEach(card => {
    card.addEventListener('click', function(e) {
      // Only if not clicking on a link
      if (!e.target.closest('.project-link')) {
        this.style.transform = 'scale(0.98) translateY(-8px)';
        setTimeout(() => {
          this.style.transform = '';
        }, 200);
      }
    });
  });
  
  // Timeline markers - add rotation on hover
  const timelineMarkers = document.querySelectorAll('.timeline-marker');
  timelineMarkers.forEach(marker => {
    marker.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.15) rotate(15deg)';
    });
    
    marker.addEventListener('mouseleave', function() {
      this.style.transform = '';
    });
  });
  
  // Profile image - no parallax effect
  // Removed parallax to keep image stable
}

// Initialize skill animations
function initializeSkillAnimations() {
  const skills = document.querySelectorAll('.skill-tag, .tech-tag');
  
  skills.forEach(skill => {
    skill.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.12) rotate(2deg)';
    });
    
    skill.addEventListener('mouseleave', function() {
      this.style.transform = '';
    });
  });
  
  // Stagger animation for skill tags
  const skillContainers = document.querySelectorAll('.spec-skills, .timeline-skills, .project-tech');
  skillContainers.forEach(container => {
    const tags = container.querySelectorAll('.skill-tag, .tech-tag');
    tags.forEach((tag, index) => {
      tag.style.opacity = '0';
      tag.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        tag.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        tag.style.opacity = '1';
        tag.style.transform = 'translateY(0)';
      }, index * 50);
    });
  });
}

// Initialize contact functionality
function initializeContact() {
  // Copy email to clipboard
  const emailLink = document.querySelector('.contact-method a[href^="mailto:"]');
  if (emailLink) {
    emailLink.addEventListener('click', function(e) {
      e.preventDefault();
      
      const email = this.textContent.trim();
      
      // Try to copy to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email)
          .then(() => {
            showToast(
              window.i18n?.t('common.toast_copied') || 'تم نسخ البريد الإلكتروني',
              'success'
            );
          })
          .catch(() => {
            // Fallback - open email client
            window.location.href = this.href;
          });
      } else {
        // Fallback for older browsers
        window.location.href = this.href;
      }
    });
  }

  // Add social media click tracking
  const socialLinks = document.querySelectorAll('.social-link');
  socialLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const platform = this.querySelector('span')?.textContent || 'Unknown';
      console.log(`🔗 Social link clicked: ${platform}`);
      
      // Add ripple effect
      createRipple(e, this);
    });
  });
  
  // Add hover effect to contact methods
  const contactMethods = document.querySelectorAll('.contact-method');
  contactMethods.forEach(method => {
    method.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-5px) scale(1.02)';
    });
    
    method.addEventListener('mouseleave', function() {
      this.style.transform = '';
    });
  });
}

// Create ripple effect
function createRipple(event, element) {
  const ripple = document.createElement('span');
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;
  
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  ripple.className = 'ripple-effect';
  
  element.style.position = 'relative';
  element.style.overflow = 'hidden';
  element.appendChild(ripple);
  
  setTimeout(() => ripple.remove(), 600);
}

// Initialize smooth scroll
function initializeSmoothScroll() {
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      
      e.preventDefault();
      const target = document.querySelector(href);
      
      if (target) {
        const offsetTop = target.offsetTop - 100;
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    });
  });
}

// Download resume/CV
function downloadResume() {
  const resumeUrl = 'assets/documents/bandar-aljameely-resume.pdf';
  const link = document.createElement('a');
  link.href = resumeUrl;
  link.download = 'Bandar-Aljameely-Resume.pdf';
  link.click();
  
  showToast(
    window.i18n?.t('about.resume_downloaded') || 'تم تنزيل السيرة الذاتية',
    'success'
  );
}

// Share profile
function shareProfile() {
  const shareData = {
    title: window.i18n?.t('about.share_profile_title') || 'بندر الجميلي - مطور ومتخصص أمن سيبراني',
    text: window.i18n?.t('about.share_profile_text') || 'تعرف على بندر الجميلي',
    url: window.location.href
  };
  
  if (navigator.share) {
    navigator.share(shareData)
      .catch(error => {
        console.log('Error sharing:', error);
        fallbackShare();
      });
  } else {
    fallbackShare();
  }
}

// Fallback share function
function fallbackShare() {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        showToast(
          window.i18n?.t('about.profile_url_copied') || 'تم نسخ رابط الصفحة',
          'success'
        );
      });
  }
}

// Listen for language changes
window.addEventListener('languageChanged', (e) => {
  console.log('📝 About page language changed to:', e.detail.language);
  
  // Re-initialize animations after language change
  setTimeout(() => {
    ensureIconsVisible();
  }, 100);
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + D - Download resume
  if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
    e.preventDefault();
    downloadResume();
  }
  
  // Ctrl/Cmd + Shift + S - Share profile
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
    e.preventDefault();
    shareProfile();
  }
  
  // Ctrl/Cmd + 1-5 - Navigate to sections
  if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '5') {
    e.preventDefault();
    const sections = [
      '.developer-hero',
      '.specializations-section',
      '.experience-section',
      '.projects-section',
      '.contact-section'
    ];
    const sectionIndex = parseInt(e.key) - 1;
    const targetSection = document.querySelector(sections[sectionIndex]);
    
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
});

// Add dynamic CSS for effects
const aboutStyles = `
/* Ripple Effect */
.ripple-effect {
  position: absolute;
  border-radius: 50%;
  background: rgba(0, 217, 255, 0.5);
  transform: scale(0);
  animation: ripple-animation 0.6s ease-out;
  pointer-events: none;
}

@keyframes ripple-animation {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

/* Project card color variations */
.project-card:nth-child(1):hover .project-image { 
  background: linear-gradient(135deg, #ff3366, #ff6688); 
}

.project-card:nth-child(2):hover .project-image { 
  background: linear-gradient(135deg, #00d9ff, #00aaff); 
}

.project-card:nth-child(3):hover .project-image { 
  background: linear-gradient(135deg, #00ff88, #44ffaa); 
}

/* Timeline marker variations */
.timeline-item:nth-child(odd) .timeline-marker { 
  background: linear-gradient(135deg, var(--cyber-blue), var(--cyber-purple)); 
}

.timeline-item:nth-child(even) .timeline-marker { 
  background: linear-gradient(135deg, var(--cyber-red), #ff3366); 
}

/* Enhanced focus states for accessibility */
.specialization-card:focus-within,
.project-card:focus-within,
.contact-method:focus-within {
  outline: 3px solid var(--cyber-blue);
  outline-offset: 2px;
}

/* Smooth transitions for all interactive elements */
.badge,
.skill-tag,
.tech-tag,
.social-link,
.project-link {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Loading animation for images */
.image-container img {
  animation: fadeIn 0.6s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Pulse animation for status indicator */
@keyframes statusPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(0, 255, 136, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(0, 255, 136, 0);
  }
}

.status-indicator {
  animation: statusPulse 2s infinite;
}

/* Animated class for revealed elements */
.animated {
  animation: slideInUp 0.6s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;

// Inject dynamic styles
const styleSheet = document.createElement('style');
styleSheet.textContent = aboutStyles;
document.head.appendChild(styleSheet);

// Performance: Lazy load images
if ('IntersectionObserver' in window) {
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      }
    });
  });
  
  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}

// Easter egg console message
console.log(
  '%c👨‍💻 بندر الجميلي',
  'color: #00d9ff; font-size: 20px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);'
);
console.log(
  '%c🔐 Cybersecurity Specialist | 💻 Full-Stack Developer',
  'color: #ff0055; font-size: 14px; font-weight: bold;'
);
console.log(
  '%c🚀 Building secure digital solutions',
  'color: #8892b0; font-size: 12px;'
);

// Export functions for external use
window.aboutPage = {
  downloadResume,
  shareProfile,
  ensureIconsVisible
};