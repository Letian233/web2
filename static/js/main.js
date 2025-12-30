// ==================== Entry File ====================
// Dependencies: data.js, cart.js, menu.js
// Responsible for initialization and binding global event listeners

// Check if browser supports localStorage
if (typeof(Storage) === "undefined") {
  document.write("Sorry, your browser does not support Web Storage.");
} else {
  // ==================== User Menu Management ====================
  const UserMenu = {
    // Check if user object represents logged in user (backend may return {id: null, username: null, ...})
    isLoggedIn: function(user) {
      return user && (user.id || user.username);
    },

    // Get current user
    getCurrentUser: function() {
      // Priority: use window.CURRENT_USER (set by pages.js from <html data-current-user>)
      if (window.CURRENT_USER !== undefined) {
        return window.CURRENT_USER;
      }

      // Read from <html data-current-user="..."> (pages.js may not have executed yet)
      try {
        const html = document.documentElement;
        if (html && html.getAttribute) {
          const htmlData = html.getAttribute('data-current-user');
          if (htmlData !== null && htmlData !== '') {
            const parsed = JSON.parse(htmlData);
            window.CURRENT_USER = parsed;
            return parsed;
          }
        }
      } catch (e) {
        console.error('Failed to parse html data-current-user:', e);
      }

      // Read from <body data-current-user="..."> (compatibility with old templates)
      try {
        const body = document.body;
        if (body && body.dataset && body.dataset.currentUser) {
          const parsed = JSON.parse(body.dataset.currentUser);
          window.CURRENT_USER = parsed;
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse body data-current-user:', e);
      }

      // Finally, compatibility with old localStorage simulated login data
      try {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
          const parsed = JSON.parse(userData);
          if (this.isLoggedIn(parsed)) {
            return parsed;
          }
        }
      } catch (e) {
        console.error('Failed to parse localStorage currentUser:', e);
      }

      return null;
    },

    // Set current user
    setCurrentUser: function(userData) {
      window.CURRENT_USER = userData;
      this.render();
    },

    // Clear current user (logout)
    clearCurrentUser: function() {
      window.CURRENT_USER = null;
      localStorage.removeItem('currentUser');
      this.render();
    },

    // Check login status, redirect to login page if not logged in
    requireLogin: function() {
      const currentUser = this.getCurrentUser();
      if (!this.isLoggedIn(currentUser)) {
        // Not logged in, redirect to login page
        window.location.href = '/login';
        return false;
      }
      return true;
    },

    // Render user menu
    render: function() {
      const container = document.getElementById('userMenuContainer');
      if (!container) return;

      // Use requestAnimationFrame to avoid flickering
      requestAnimationFrame(() => {
        const currentUser = this.getCurrentUser();

        // Check if truly logged in (backend may return {id: null, username: null, ...})
        if (this.isLoggedIn(currentUser)) {
          // Logged in: show avatar dropdown menu
          container.innerHTML = `
            <div class="dropdown user-dropdown-wrapper">
              <button 
                class="user-dropdown-toggle" 
                type="button" 
                id="userDropdownToggle"
                data-bs-toggle="dropdown" 
                data-bs-auto-close="true"
                aria-expanded="false"
                aria-label="User menu"
                aria-haspopup="true"
              >
                ${(currentUser.avatar_url || currentUser.avatar) ? 
                  `<img src="${currentUser.avatar_url || currentUser.avatar}" alt="User avatar" class="user-avatar">` :
                  `<div class="user-avatar-placeholder">${currentUser.username ? currentUser.username.charAt(0).toUpperCase() : 'U'}</div>`
                }
              </button>
              <ul class="dropdown-menu user-dropdown-menu dropdown-menu-end" aria-labelledby="userDropdownToggle">
                <li class="user-dropdown-header">Signed in as <strong>${currentUser.username || 'User'}</strong></li>
                <li><a class="user-dropdown-item" href="/profile" id="profileLink">Profile</a></li>
                <li><a class="user-dropdown-item" href="/menu" id="orderHistoryLink">Order History</a></li>
                ${currentUser.is_admin ? `
                <li><hr class="user-dropdown-divider"></li>
                <li><a class="user-dropdown-item" href="/admin" id="adminPanelLink">Admin Panel</a></li>
                ` : ''}
                <li><hr class="user-dropdown-divider"></li>
                <li><button class="user-dropdown-item logout" id="logoutBtn" type="button">Logout</button></li>
              </ul>
            </div>
          `;

          // Bind logout button
          const logoutBtn = document.getElementById('logoutBtn');
          if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
              this.logout();
            });
          }

          // Profile link uses standard href="/profile", no additional handling needed here

          // Bind Order History link (open cart modal and switch to order history tab)
          const orderHistoryLink = document.getElementById('orderHistoryLink');
          if (orderHistoryLink) {
            orderHistoryLink.addEventListener('click', (e) => {
              // If currently on /menu page, open cart and switch to order history
              if (window.location.pathname === '/menu') {
                e.preventDefault();
                Cart.showModal();
                setTimeout(() => {
                  Cart.switchTab('history');
                }, 100);
              }
            });
          }
        } else {
          // Not logged in: show login and register buttons
          container.innerHTML = `
            <div class="user-auth-buttons">
              <a class="button user-login-btn" href="/login">Login</a>
              <a class="button user-register-btn" href="/register">Register</a>
            </div>
          `;
        }
      });
    },

    // Initialize
    init: function() {
      this.render();
    },

    // Logout
    logout: function() {
      // Call backend logout API, clear server-side session
      fetch('/logout', { method: 'GET', credentials: 'same-origin' })
        .finally(() => {
          this.clearCurrentUser();
          // Refresh to homepage to ensure navigation and user info are updated
          window.location.href = '/';
        });
    }
  };

  // Expose for other scripts (profile.js)
  window.UserMenu = UserMenu;

  // ==================== Global Keyboard Shortcuts ====================
  function initHotkeys() {
    const currentUser = (window.UserMenu && typeof UserMenu.getCurrentUser === 'function')
      ? UserMenu.getCurrentUser()
      : null;
    const isAdmin = !!(currentUser && currentUser.is_admin);

    const routes = {
      h: '/',
      m: '/menu',
      r: '/reviews',
      a: '/about',
      p: '/profile',
      c: '/cart'
    };
    if (isAdmin) {
      routes.d = '/admin';
    }
    let gPressedAt = 0;
    const gTimeout = 800; // ms

    const isTyping = (el) => {
      if (!el) return false;
      const tag = el.tagName && el.tagName.toLowerCase();
      const editable = el.getAttribute && el.getAttribute('contenteditable');
      return ['input', 'textarea', 'select'].includes(tag) || editable === 'true';
    };

    const buildHotkeyUI = () => {
      let modal = document.getElementById('hotkey-modal');
      let backdrop = document.getElementById('hotkey-backdrop');
      if (modal && backdrop) return { modal, backdrop };

      backdrop = document.createElement('div');
      backdrop.id = 'hotkey-backdrop';
      backdrop.className = 'hotkey-backdrop';
      backdrop.setAttribute('aria-hidden', 'true');

      modal = document.createElement('div');
      modal.id = 'hotkey-modal';
      modal.className = 'hotkey-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'hotkey-title');
      modal.setAttribute('aria-hidden', 'true');
      modal.setAttribute('tabindex', '-1');
      const adminItem = isAdmin ? `<li><kbd>g</kbd> <kbd>d</kbd> Go to Admin</li>` : '';
      modal.innerHTML = `
        <div class="hotkey-modal-header">
          <h2 id="hotkey-title">Keyboard Shortcuts</h2>
          <button type="button" class="hotkey-close" aria-label="Close">×</button>
        </div>
        <div class="hotkey-modal-body">
          <ul class="hotkey-list">
            <li><kbd>?</kbd> Toggle shortcuts help</li>
            <li><kbd>Esc</kbd> Close shortcuts help</li>
            <li><kbd>/</kbd> Focus search</li>
            <li><kbd>n</kbd> Focus review input</li>
            <li><kbd>g</kbd> <kbd>h</kbd> Go to Home</li>
            <li><kbd>g</kbd> <kbd>m</kbd> Go to Menu</li>
            <li><kbd>g</kbd> <kbd>r</kbd> Go to Reviews</li>
            <li><kbd>g</kbd> <kbd>a</kbd> Go to About</li>
            <li><kbd>g</kbd> <kbd>p</kbd> Go to Profile</li>
            <li><kbd>g</kbd> <kbd>c</kbd> Open Cart</li>
            ${adminItem}
          </ul>
        </div>
      `;

      document.body.appendChild(backdrop);
      document.body.appendChild(modal);
      return { modal, backdrop };
    };

    const focusSearch = () => {
      const el = document.querySelector('#search-input') || document.querySelector('#searchInput');
      if (el) {
        el.focus();
        if (el.select) el.select();
      }
    };

    const focusReview = () => {
      const el = document.querySelector('#review-text');
      if (el) {
        el.focus();
        if (el.scrollIntoView) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    };

    const { modal, backdrop } = buildHotkeyUI();
    const closeBtn = modal.querySelector('.hotkey-close');

    const openModal = () => {
      modal.classList.add('show');
      backdrop.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
      backdrop.setAttribute('aria-hidden', 'false');
      modal.focus();
    };

    const closeModal = () => {
      modal.classList.remove('show');
      backdrop.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
      backdrop.setAttribute('aria-hidden', 'true');
    };

    closeBtn?.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
      const target = e.target;
      const typing = isTyping(target);
      const hasModifier = e.ctrlKey || e.metaKey || e.altKey;

      // Toggle help: ? or Shift+/
      if (!typing && (e.key === '?' || (e.key === '/' && e.shiftKey))) {
        e.preventDefault();
        if (modal.classList.contains('show')) {
          closeModal();
        } else {
          openModal();
        }
        return;
      }

      // Esc to close
      if (e.key === 'Escape') {
        if (modal.classList.contains('show')) {
          e.preventDefault();
          closeModal();
        }
        return;
      }

      // Ignore other shortcuts while typing
      if (typing) return;

      // "/" to focus search
      if (e.key === '/' && !e.shiftKey && !hasModifier) {
        e.preventDefault();
        focusSearch();
        return;
      }

      // "n" to focus review input box
      if (e.key === 'n' && !hasModifier && !e.shiftKey) {
        e.preventDefault();
        focusReview();
        return;
      }

      const now = Date.now();
      // g prefix
      if (e.key === 'g' && !hasModifier && !e.shiftKey) {
        gPressedAt = now;
        return;
      }

      // g + [h/m/r/a/p/c]
      if (gPressedAt && now - gPressedAt <= gTimeout && routes[e.key]) {
        gPressedAt = 0;
        e.preventDefault();
        window.location.href = routes[e.key];
        return;
      }

      if (gPressedAt && now - gPressedAt > gTimeout) {
        gPressedAt = 0;
      }
    });
  }

  // ==================== Initialization ====================
  document.addEventListener('DOMContentLoaded', function() {
    // Bind click events for all "Order Now" buttons (including recommended section)
    const orderButtons = document.querySelectorAll('[data-pizza-type]');
    
    orderButtons.forEach(function(button) {
      button.addEventListener('click', handleOrderClick);
    });

    // Bind view cart button (sidebar)
    const viewCartBtn = document.getElementById('viewCartBtn');
    if (viewCartBtn) {
      viewCartBtn.addEventListener('click', function(e) {
        e.preventDefault();
        Cart.showModal();
      });
    }

    // Bind floating cart button (menu page)
    const viewCartBtnFixed = document.getElementById('viewCartBtnFixed');
    if (viewCartBtnFixed) {
      viewCartBtnFixed.addEventListener('click', function(e) {
        e.preventDefault();
        Cart.showModal();
      });
    }

    // Bind close modal button
    const cartModalClose = document.getElementById('cartModalClose');
    if (cartModalClose) {
      cartModalClose.addEventListener('click', function() {
        Cart.hideModal();
      });
    }

    // Click overlay to close modal
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
      const overlay = cartModal.querySelector('.cart-modal-overlay');
      if (overlay) {
        overlay.addEventListener('click', function() {
          Cart.hideModal();
        });
      }
    }

    // Bind checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', function() {
        // Check login status
        if (!UserMenu.requireLogin()) {
          return; // Not logged in, already redirected to login page
        }
        
        const cartItems = Cart.get();
        if (cartItems.length === 0) {
          Toast.show('Your cart is empty');
          return;
        }

        // Construct order data to send to backend
        const payload = {
          items: cartItems.map(item => ({
            id: item.id,
            quantity: item.quantity
          }))
        };

        fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(payload)
        })
          .then(res => res.json().then(data => ({ ok: res.ok, data })))
          .then(result => {
            if (!result.ok) {
              const msg = (result.data && result.data.error) || 'Failed to place order';
              Toast.show(msg);
              return;
            }

            // Order successful: clear cart, local storage, and show success message
            localStorage.removeItem('cart');
            Cart.updateCartUI();
            Cart.renderCartModal();
            Toast.show('Order placed successfully!');

            // Automatically switch to order history tab and refresh order history
            Cart.switchTab('history');
          })
          .catch(() => {
            Toast.show('Network error, please try again later.');
          });
      });
    }

    // Bind tab switch buttons
    const tabCurrent = document.getElementById('tabCurrent');
    const tabHistory = document.getElementById('tabHistory');
    
    if (tabCurrent) {
      tabCurrent.addEventListener('click', function() {
        Cart.switchTab('current');
      });
    }
    
    if (tabHistory) {
      tabHistory.addEventListener('click', function() {
        Cart.switchTab('history');
      });
    }

    // Initialize cart UI
    Cart.updateCartUI();

    // Initialize user menu
    UserMenu.init();

    // Initialize menu controller (if on menu page)
    if (document.querySelector('.menu-page') || document.getElementById('menu-container')) {
      if (typeof MenuController !== 'undefined') {
        MenuController.init();
      }
    }

    // Initialize global shortcuts
    initHotkeys();
  });
}

