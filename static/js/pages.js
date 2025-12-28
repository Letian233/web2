// Page-specific JavaScript

// Initialize page data from backend
(function() {
  'use strict';

  function safeJsonParse(str, label) {
    if (str == null || str === '') return undefined;
    try {
      return JSON.parse(str);
    } catch (e) {
      console.error(`Error parsing ${label}:`, e);
      return undefined;
    }
  }

  // IMPORTANT: this must run BEFORE data.js (which reads window.MENU_ITEMS_FROM_DB at load time)
  // Use <html data-*> so it is available while scripts run in <head>.
  (function initTemplateDataNow() {
    const root = document.documentElement; // <html>
    const fallbackBody = document.body; // may be null while parsing <head>

    const getAttr = (name) =>
      (root && root.getAttribute && root.getAttribute(name)) ||
      (fallbackBody && fallbackBody.getAttribute && fallbackBody.getAttribute(name)) ||
      null;

    const menuItemsRaw = getAttr('data-menu-items');
    const currentUserRaw = getAttr('data-current-user');
    const initialReviewsRaw = getAttr('data-initial-reviews');

    // DEBUG: Log raw data
    console.log('[pages.js] currentUserRaw:', currentUserRaw);

    const menuItems = safeJsonParse(menuItemsRaw, 'menu items');
    const initialReviews = safeJsonParse(initialReviewsRaw, 'initial reviews');

    // Parse currentUser specially - null is a valid value (means not logged in)
    let currentUser = undefined;
    if (currentUserRaw !== null && currentUserRaw !== '') {
      try {
        currentUser = JSON.parse(currentUserRaw);
        // null is valid (not logged in), object is valid (logged in)
        window.CURRENT_USER = currentUser;
        console.log('[pages.js] Parsed currentUser:', currentUser);
      } catch (e) {
        console.error('[pages.js] Error parsing current user:', e);
        console.error('[pages.js] Raw string was:', currentUserRaw);
      }
    } else {
      console.log('[pages.js] currentUserRaw is null or empty, not setting window.CURRENT_USER');
    }

    // Set window variables
    if (Array.isArray(menuItems)) window.MENU_ITEMS_FROM_DB = menuItems;
    if (Array.isArray(initialReviews)) window.INITIAL_REVIEWS_FROM_DB = initialReviews;
  })();

  // Initialize Bootstrap Carousel (for index.html)
  document.addEventListener('DOMContentLoaded', function() {
    const carouselElement = document.querySelector('#heroCarousel');
    if (carouselElement) {
      // Bootstrap 5 should auto-initialize with data-bs-ride="carousel"
      // But we can manually initialize if needed
      if (typeof bootstrap !== 'undefined') {
        const carousel = new bootstrap.Carousel(carouselElement, {
          interval: 5000,
          wrap: true,
          keyboard: true
        });
        console.log('Carousel initialized:', carousel);
      }
    }
  });

  // Contact form handlers (for contact.html)
  function saveFormData() {
    const formData = {
      name: document.getElementById('name')?.value || '',
      subject: document.getElementById('subject')?.value || '',
      email: document.getElementById('email')?.value || '',
      gender: document.getElementById('gender')?.value || '',
      satisfaction: document.getElementById('satisfaction')?.value || '',
      textarea: document.getElementById('textarea')?.value || '',
      textarea1: document.getElementById('textarea1')?.value || ''
    };
    localStorage.setItem('contactFormData', JSON.stringify(formData));
    alert('Form data saved successfully!');
  }

  function getFormData() {
    const savedData = localStorage.getItem('contactFormData');
    if (savedData) {
      const formData = JSON.parse(savedData);
      if (document.getElementById('name')) document.getElementById('name').value = formData.name || '';
      if (document.getElementById('subject')) document.getElementById('subject').value = formData.subject || '';
      if (document.getElementById('email')) document.getElementById('email').value = formData.email || '';
      if (document.getElementById('gender')) document.getElementById('gender').value = formData.gender || '';
      if (document.getElementById('satisfaction')) document.getElementById('satisfaction').value = formData.satisfaction || '';
      if (document.getElementById('textarea')) document.getElementById('textarea').value = formData.textarea || '';
      if (document.getElementById('textarea1')) document.getElementById('textarea1').value = formData.textarea1 || '';
      alert('Form data loaded successfully!');
    } else {
      alert('No saved form data found.');
    }
  }

  // Bind contact form buttons
  document.addEventListener('DOMContentLoaded', function() {
    const saveBtn = document.getElementById('saveFormDataBtn');
    const getBtn = document.getElementById('getFormDataBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', saveFormData);
    }
    if (getBtn) {
      getBtn.addEventListener('click', getFormData);
    }

    // Newsletter form handler (for about.html)
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
      newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 获取邮箱输入框
        const emailInput = newsletterForm.querySelector('.newsletter-email-input');
        const email = emailInput ? emailInput.value : '';
        
        // 显示自定义主题提示
        showCustomNotification('Thank you for subscribing!', 'success');
        
        // 清空输入框
        if (emailInput) {
          emailInput.value = '';
        }
        
        return false;
      });
    }
    
    /**
     * 显示自定义主题样式的通知提示
     * @param {string} message - 提示消息
     * @param {string} type - 提示类型：'success', 'error', 'info'
     */
    function showCustomNotification(message, type = 'success') {
      // 创建提示容器
      const notification = document.createElement('div');
      notification.className = 'custom-notification custom-notification-' + type;
      notification.innerHTML = '<span class="notification-message">' + escapeHtml(message) + '</span>';
      
      // 添加到页面
      document.body.appendChild(notification);
      
      // 触发动画
      setTimeout(function() {
        notification.classList.add('show');
      }, 10);
      
      // 3秒后自动消失
      setTimeout(function() {
        notification.classList.remove('show');
        setTimeout(function() {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, 3000);
    }
    
    /**
     * HTML 转义函数，防止 XSS
     */
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  });
})();

