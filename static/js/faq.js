// ===== FAQ Page Specific JavaScript =====

// Initialize FAQ page
document.addEventListener('DOMContentLoaded', () => {
  // Initialize accordion functionality
  initializeAccordion();
  
  // Initialize category filtering
  initializeCategoryFilter();
  
  // Initialize search functionality
  initializeSearch();
  
  // Add scroll animations
  initializeAnimations();
  
  // Add interactive effects
  addInteractiveEffects();
});

// Initialize accordion functionality
function initializeAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    
    question.addEventListener('click', () => {
      // Close all other items
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
        }
      });
      
      // Toggle current item
      item.classList.toggle('active');
    });
  });
}

// Initialize category filtering
function initializeCategoryFilter() {
  const categoryButtons = document.querySelectorAll('.category-btn');
  const faqCategories = document.querySelectorAll('.faq-category');
  
  categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
      const category = button.dataset.category;
      
      // Update active button
      categoryButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Show/hide categories
      faqCategories.forEach(categoryElement => {
        if (category === 'all' || categoryElement.dataset.category === category) {
          categoryElement.style.display = 'block';
          // Re-initialize animations for visible items
          setTimeout(() => {
            AOS.refresh();
          }, 300);
        } else {
          categoryElement.style.display = 'none';
        }
      });
    });
  });
}

// Initialize search functionality
function initializeSearch() {
  const searchInput = document.getElementById('faqSearch');
  const searchButton = document.querySelector('.search-btn');
  const faqItems = document.querySelectorAll('.faq-item');
  
  function performSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
      // Show all items if search is empty
      faqItems.forEach(item => {
        item.style.display = 'flex';
      });
      return;
    }
    
    let foundResults = false;
    
    faqItems.forEach(item => {
      const question = item.querySelector('.question-text').textContent.toLowerCase();
      const answer = item.querySelector('.faq-answer').textContent.toLowerCase();
      
      if (question.includes(searchTerm) || answer.includes(searchTerm)) {
        item.style.display = 'flex';
        foundResults = true;
        
        // Highlight search term
        highlightText(item, searchTerm);
      } else {
        item.style.display = 'none';
      }
    });
    
    // Show no results message
    showNoResultsMessage(!foundResults, searchTerm);
  }
  
  searchInput.addEventListener('input', debounce(performSearch, 300));
  searchButton.addEventListener('click', performSearch);
  
  // Search on Enter key
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
}

// Highlight search terms in text
function highlightText(element, searchTerm) {
  const questionElement = element.querySelector('.question-text');
  const answerElement = element.querySelector('.faq-answer');
  
  [questionElement, answerElement].forEach(el => {
    if (el) {
      const text = el.textContent;
      const regex = new RegExp(`(${searchTerm})`, 'gi');
      const highlighted = text.replace(regex, '<mark>$1</mark>');
      el.innerHTML = highlighted;
    }
  });
}

// Show no results message
function showNoResultsMessage(show, searchTerm) {
  let noResultsMsg = document.getElementById('noResultsMessage');
  
  if (show && !noResultsMsg) {
    noResultsMsg = document.createElement('div');
    noResultsMsg.id = 'noResultsMessage';
    noResultsMsg.className = 'no-results-message';
    noResultsMsg.innerHTML = `
      <i class="fas fa-search"></i>
      <h4 data-i18n="no_results_title">لم نعثر على نتائج</h4>
      <p data-i18n="no_results_desc">جرب استخدام كلمات بحث مختلفة أو تصفح التصنيفات</p>
    `;
    
    const faqContent = document.querySelector('.faq-content');
    faqContent.appendChild(noResultsMsg);
    
    // Update translations for the new element
    i18n.updatePage();
  } else if (!show && noResultsMsg) {
    noResultsMsg.remove();
  }
}

// Initialize animations
function initializeAnimations() {
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

  // Observe FAQ items for scroll animations
  document.querySelectorAll('.faq-item').forEach(item => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(30px)';
    item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(item);
  });
}

// Add interactive effects
function addInteractiveEffects() {
  // Add hover effects to category buttons
  const categoryButtons = document.querySelectorAll('.category-btn');
  
  categoryButtons.forEach(button => {
    button.addEventListener('mouseenter', function() {
      if (!this.classList.contains('active')) {
        this.style.transform = 'scale(1.05)';
      }
    });
    
    button.addEventListener('mouseleave', function() {
      this.style.transform = '';
    });
  });

  // Add click effects to stat cards
  const statCards = document.querySelectorAll('.stat-card');
  
  statCards.forEach(card => {
    card.addEventListener('click', () => {
      card.style.transform = 'scale(0.95)';
      setTimeout(() => {
        card.style.transform = '';
      }, 150);
    });
  });
}

// Export FAQ content
function exportFAQ() {
  const faqData = [];
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    const question = item.querySelector('.question-text').textContent;
    const answer = item.querySelector('.faq-answer').textContent;
    
    faqData.push({
      question,
      answer: answer.trim()
    });
  });
  
  const dataStr = JSON.stringify({
    faqs: faqData,
    exportedAt: new Date().toISOString(),
    tool: 'Hasenha FAQ'
  });
  
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  const exportFileDefaultName = `hasenha_faq_${Date.now()}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
  
  showToast(i18n.t('export_success'), 'success');
}

// Print FAQ
function printFAQ() {
  window.print();
}

// Listen for language changes
window.addEventListener('languageChanged', (e) => {
  // Re-initialize search to update highlighted text
  const searchInput = document.getElementById('faqSearch');
  if (searchInput.value) {
    setTimeout(() => {
      const searchButton = document.querySelector('.search-btn');
      searchButton.click();
    }, 100);
  }
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + F - Focus search
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    const searchInput = document.getElementById('faqSearch');
    searchInput.focus();
  }
  
  // Ctrl/Cmd + E - Export FAQ
  if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
    e.preventDefault();
    exportFAQ();
  }
  
  // Ctrl/Cmd + P - Print FAQ
  if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
    e.preventDefault();
    printFAQ();
  }
});

// Add CSS for search highlights and no results message
const faqStyles = `
.mark {
  background: linear-gradient(135deg, var(--cyber-blue), var(--cyber-red));
  color: white;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-weight: 600;
}

.no-results-message {
  text-align: center;
  padding: 3rem 2rem;
  background: var(--card-bg);
  border: 2px solid var(--border-glow);
  border-radius: 12px;
  margin: 2rem 0;
}

.no-results-message i {
  font-size: 3rem;
  color: var(--text-dim);
  margin-bottom: 1rem;
}

.no-results-message h4 {
  color: var(--text-light);
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

.no-results-message p {
  color: var(--text-dim);
  margin: 0;
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = faqStyles;
document.head.appendChild(styleSheet);