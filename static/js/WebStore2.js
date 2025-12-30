// Check if the browser supports localStorage
if (typeof(Storage) !== "undefined") {

  // ==================== Menu Database (compatibility object for existing cart code) ====================
  // Keep menuDatabase object format for compatibility with existing cart code
  // Note: Menu data is now provided by backend via window.MENU_ITEMS_FROM_DB (set by pages.js)
  const menuDatabase = {};
  
  // Populate menuDatabase from backend data when available
  function updateMenuDatabase() {
    const menuData = window.MENU_ITEMS_FROM_DB || [];
    menuData.forEach(item => {
      menuDatabase[item.id] = {
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image_url || item.image || '../images/blank.png'
      };
    });
  }
  
  // Initialize menuDatabase when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    updateMenuDatabase();
  });

  // ==================== Shopping Cart Object ====================
  const Cart = {
    // Read cart data from localStorage
    get: function() {
      const cartData = localStorage.getItem('cart');
      return cartData ? JSON.parse(cartData) : [];
    },

    // Save cart data to localStorage
    save: function(cartItems) {
      localStorage.setItem('cart', JSON.stringify(cartItems));
      // Update UI after saving
      this.updateCartUI();
    },

    // Add item to cart (increment quantity if already exists)
    add: function(itemId) {
      const cartItems = this.get();
      const menuItem = menuDatabase[itemId];
      
      if (!menuItem) {
        console.error('Item not found in database:', itemId);
        return false;
      }

      // Check if item already exists in cart
      const existingItem = cartItems.find(item => item.id === itemId);
      
      if (existingItem) {
        // If exists, increment quantity
        existingItem.quantity += 1;
      } else {
        // If not exists, add new item
        cartItems.push({
          id: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          image: menuItem.image,
          quantity: 1
        });
      }

      this.save(cartItems);
      return true;
    },

    // Calculate total cart price
    getTotal: function() {
      const cartItems = this.get();
      return cartItems.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
    },

    // Get total quantity of items in cart
    getTotalQuantity: function() {
      const cartItems = this.get();
      return cartItems.reduce((total, item) => {
        return total + item.quantity;
      }, 0);
    },

    // Update cart UI (update cart counter in navigation bar)
    updateCartUI: function() {
      const cartBadge = document.getElementById('cart-badge');
      if (cartBadge) {
        const totalQuantity = this.getTotalQuantity();
        cartBadge.textContent = totalQuantity;
        // Hide badge if quantity is 0
        if (totalQuantity === 0) {
          cartBadge.style.display = 'none';
        } else {
          cartBadge.style.display = 'inline-block';
        }
      }
    },

    // Update item quantity
    updateQuantity: function(itemId, change) {
      const cartItems = this.get();
      const item = cartItems.find(item => item.id === itemId);
      
      if (!item) return false;

      item.quantity += change;
      
      // If quantity is less than or equal to 0, remove the item
      if (item.quantity <= 0) {
        const index = cartItems.findIndex(item => item.id === itemId);
        if (index > -1) {
          cartItems.splice(index, 1);
        }
      }

      this.save(cartItems);
      return true;
    },

    // Render cart modal
    renderCartModal: function() {
      const cartItems = this.get();
      const cartItemsList = document.getElementById('cartItemsList');
      const cartEmptyMessage = document.getElementById('cartEmptyMessage');
      const cartTotalPrice = document.getElementById('cartTotalPrice');
      
      if (!cartItemsList || !cartEmptyMessage || !cartTotalPrice) {
        console.error('Cart modal elements not found');
        return;
      }

      // Clear list
      cartItemsList.innerHTML = '';

      if (cartItems.length === 0) {
        // Cart is empty
        cartItemsList.style.display = 'none';
        cartEmptyMessage.style.display = 'block';
        cartTotalPrice.textContent = '0.00';
      } else {
        // Show item list
        cartItemsList.style.display = 'flex';
        cartEmptyMessage.style.display = 'none';

        cartItems.forEach(item => {
          const cartItem = document.createElement('div');
          cartItem.className = 'cart-item';
          cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-info">
              <div class="cart-item-name">${item.name}</div>
              <div class="cart-item-price">$${item.price.toFixed(2)} each</div>
            </div>
            <div class="cart-item-controls">
              <div class="cart-item-quantity">
                <button class="quantity-btn" data-item-id="${item.id}" data-action="decrease">-</button>
                <span class="quantity-value">${item.quantity}</span>
                <button class="quantity-btn" data-item-id="${item.id}" data-action="increase">+</button>
              </div>
              <div class="cart-item-total">$${(item.price * item.quantity).toFixed(2)}</div>
            </div>
          `;
          cartItemsList.appendChild(cartItem);
        });

        // Bind quantity adjustment button events
        const quantityButtons = cartItemsList.querySelectorAll('.quantity-btn');
        quantityButtons.forEach(btn => {
          btn.addEventListener('click', (e) => {
            const itemId = parseInt(btn.getAttribute('data-item-id'));
            const action = btn.getAttribute('data-action');
            const change = action === 'increase' ? 1 : -1;
            
            this.updateQuantity(itemId, change);
            this.renderCartModal(); // Re-render
          });
        });
      }

      // Update total price
      const total = this.getTotal();
      cartTotalPrice.textContent = total.toFixed(2);
    },

    // Show cart modal
    showModal: function() {
      const cartModal = document.getElementById('cartModal');
      if (cartModal) {
        this.renderCartModal();
        cartModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
      }
    },

    // Hide cart modal
    hideModal: function() {
      const cartModal = document.getElementById('cartModal');
      if (cartModal) {
        cartModal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
      }
    },

    // Switch tab
    switchTab: function(tabName) {
      // Update tab button states
      const tabButtons = document.querySelectorAll('.cart-tab-btn');
      tabButtons.forEach(btn => {
        if (btn.getAttribute('data-tab') === tabName) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      // Update content area display
      const currentTab = document.getElementById('currentOrderTab');
      const historyTab = document.getElementById('orderHistoryTab');

      if (tabName === 'current') {
        if (currentTab) currentTab.classList.add('active');
        if (historyTab) historyTab.classList.remove('active');
        // Re-render current cart
        this.renderCartModal();
      } else if (tabName === 'history') {
        if (currentTab) currentTab.classList.remove('active');
        if (historyTab) historyTab.classList.add('active');
        // Render order history
        this.renderHistory();
      }
    },

    // Render order history list
    renderHistory: function() {
      const orderHistoryList = document.getElementById('orderHistoryList');
      const orderHistoryEmpty = document.getElementById('orderHistoryEmpty');

      if (!orderHistoryList || !orderHistoryEmpty) {
        console.error('Order history elements not found');
        return;
      }

      // Clear list
      orderHistoryList.innerHTML = '';

      // Order history is now fetched from backend API
      // This function should be called after fetching order history from /api/orders
      // For now, show empty state
      orderHistoryList.style.display = 'none';
      orderHistoryEmpty.style.display = 'block';
      return;
    },

    // Render order history items (called after fetching from backend)
    renderHistoryItems: function(orders) {
      const orderHistoryList = document.getElementById('orderHistoryList');
      const orderHistoryEmpty = document.getElementById('orderHistoryEmpty');

      if (!orderHistoryList || !orderHistoryEmpty) {
        console.error('Order history elements not found');
        return;
      }

      // Clear list
      orderHistoryList.innerHTML = '';

      if (!orders || orders.length === 0) {
        orderHistoryList.style.display = 'none';
        orderHistoryEmpty.style.display = 'block';
        return;
      }

      orderHistoryList.style.display = 'flex';
      orderHistoryEmpty.style.display = 'none';

      // Render each order
      orders.forEach(order => {
        const orderItem = document.createElement('div');
        orderItem.className = 'order-history-item';
        orderItem.innerHTML = `
          <div class="order-history-header" data-order-id="${order.orderId}">
            <div class="order-history-info">
              <div class="order-history-number">${order.orderId}</div>
              <div class="order-history-date">${order.date}</div>
            </div>
            <div class="order-history-total">$${order.total.toFixed(2)}</div>
            <span class="order-history-toggle">▼</span>
          </div>
          <div class="order-history-details" id="details-${order.orderId}">
            <div class="order-history-items">
              ${order.items.map(item => `
                <div class="order-history-item-detail">
                  <div class="order-history-item-name">${item.name}</div>
                  <div class="order-history-item-info">
                    <span class="order-history-item-quantity">Qty: ${item.quantity}</span>
                    <span class="order-history-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
        orderHistoryList.appendChild(orderItem);

        // Bind expand/collapse events
        const header = orderItem.querySelector('.order-history-header');
        const details = orderItem.querySelector('.order-history-details');
        
        header.addEventListener('click', function() {
          const isActive = header.classList.contains('active');
          
          // Close all other order details
          document.querySelectorAll('.order-history-header').forEach(h => {
            if (h !== header) {
              h.classList.remove('active');
              const detailId = h.getAttribute('data-order-id');
              const detailEl = document.getElementById(`details-${detailId}`);
              if (detailEl) {
                detailEl.classList.remove('active');
              }
            }
          });

          // Toggle current order details
          if (isActive) {
            header.classList.remove('active');
            details.classList.remove('active');
    } else {
            header.classList.add('active');
            details.classList.add('active');
          }
        });
      });
    }
  };

  // ==================== Toast Notification System ====================
  const Toast = {
    show: function(message, duration = 3000) {
      // Remove existing toast
      const existingToast = document.getElementById('toast-notification');
      if (existingToast) {
        existingToast.remove();
      }

      // Create toast element
      const toast = document.createElement('div');
      toast.id = 'toast-notification';
      toast.textContent = message;
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #9c5959;
        color: #f5f5f5;
        padding: 15px 25px;
        border-radius: 5px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        font-family: 'Lobster13Regular', cursive;
        font-size: 18px;
        opacity: 0;
        transform: translateX(100px);
        transition: opacity 0.3s ease, transform 0.3s ease;
      `;

      document.body.appendChild(toast);

      // Trigger animation
      setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
      }, 10);

      // Auto dismiss
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.remove();
          }
        }, 300);
      }, duration);
    }
  };

  // ==================== Find ID by item name ====================
  function findItemIdByName(itemName) {
    for (const id in menuDatabase) {
      if (menuDatabase[id].name === itemName) {
        return parseInt(id);
      }
    }
    return null;
  }

  // ==================== Handle order button click ====================
  function handleOrderClick(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const itemName = button.getAttribute('data-pizza-type');
    
    if (!itemName) {
      console.error('Item name not found');
      return;
    }

    const itemId = findItemIdByName(itemName);
    if (!itemId) {
      console.error('Item ID not found for:', itemName);
      Toast.show('Item not found, please try again later');
      return;
    }

    // Add to cart
    const success = Cart.add(itemId);
    if (success) {
      Toast.show('Added to cart!');
    } else {
      Toast.show('Failed to add, please try again later');
    }
  }

  // ==================== User Menu Management ====================
  const UserMenu = {
    // Get current user
    getCurrentUser: function() {
      const userData = localStorage.getItem('currentUser');
      return userData ? JSON.parse(userData) : null;
    },

    // Set current user
    setCurrentUser: function(userData) {
      localStorage.setItem('currentUser', JSON.stringify(userData));
      this.render();
    },

    // Clear current user (logout)
    clearCurrentUser: function() {
      localStorage.removeItem('currentUser');
      this.render();
    },

    // Render user menu
    render: function() {
      const container = document.getElementById('userMenuContainer');
      if (!container) return;

      // Use requestAnimationFrame to avoid flickering
      requestAnimationFrame(() => {
        const currentUser = this.getCurrentUser();

        if (currentUser) {
        // Logged in: show avatar dropdown menu
        container.innerHTML = `
          <div class="dropdown" style="position: relative;">
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
              ${currentUser.avatar ? 
                `<img src="${currentUser.avatar}" alt="User avatar" class="user-avatar">` :
                `<div class="user-avatar-placeholder">${currentUser.username ? currentUser.username.charAt(0).toUpperCase() : 'U'}</div>`
              }
            </button>
            <ul class="dropdown-menu user-dropdown-menu dropdown-menu-end" aria-labelledby="userDropdownToggle">
              <li class="user-dropdown-header">Signed in as <strong>${currentUser.username || 'User'}</strong></li>
              <li><a class="user-dropdown-item" href="#" id="profileLink">Profile</a></li>
              <li><a class="user-dropdown-item" href="menu.html" id="orderHistoryLink">Order History</a></li>
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

        // Bind Profile link (navigate to profile page)
        const profileLink = document.getElementById('profileLink');
        if (profileLink) {
          profileLink.addEventListener('click', (e) => {
            // If currently on profile.html, prevent navigation
            if (window.location.pathname.includes('profile.html')) {
              e.preventDefault();
              return;
            }
            // Navigate to profile page
            window.location.href = 'profile.html';
          });
        }

        // Bind Order History link (open cart modal and switch to order history tab)
        const orderHistoryLink = document.getElementById('orderHistoryLink');
        if (orderHistoryLink) {
          orderHistoryLink.addEventListener('click', (e) => {
            // If currently on menu.html, open cart and switch to order history
            if (window.location.pathname.includes('menu.html')) {
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
            <a class="button user-login-btn" href="login.html">Login</a>
            <a class="button user-register-btn" href="register.html">Register</a>
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
      this.clearCurrentUser();
      Toast.show('Logged out successfully!');
      // Refresh page or navigate to homepage
      setTimeout(() => {
        if (window.location.pathname.includes('menu.html')) {
          window.location.reload();
        } else {
          window.location.href = 'index.html';
        }
      }, 1000);
    }
  };

  // ==================== Initialization ====================
  document.addEventListener('DOMContentLoaded', function() {
    // Bind click events for all "Order Now" buttons
    const orderButtons = document.querySelectorAll('.button[data-pizza-type]');
    
    orderButtons.forEach(function(button) {
      button.addEventListener('click', handleOrderClick);
    });

    // Bind view cart button
    const viewCartBtn = document.getElementById('viewCartBtn');
    if (viewCartBtn) {
      viewCartBtn.addEventListener('click', function(e) {
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
        const cartItems = Cart.get();
        if (cartItems.length === 0) {
          Toast.show('Your cart is empty');
          return;
        }
        // Checkout logic can be added here
        Toast.show('Checkout functionality coming soon!');
        // Logic to navigate to checkout page can be added here
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
  });

  // ==================== Menu Controller ====================
  const MenuController = {
    currentPage: 1,
    itemsPerPage: 4,
    searchKeyword: '',
    filteredData: [],

    // Initialize
    init: function() {
      const searchInput = document.getElementById('searchInput');
      const searchBtn = document.getElementById('searchBtn');
      const prevBtn = document.getElementById('prevBtn');
      const nextBtn = document.getElementById('nextBtn');

      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.searchKeyword = e.target.value.trim().toLowerCase();
          this.currentPage = 1; // Reset to first page when searching
          this.renderMenu();
        });

        searchInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.renderMenu();
          }
        });
      }

      if (searchBtn) {
        searchBtn.addEventListener('click', () => {
          this.renderMenu();
        });
      }

      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          if (this.currentPage > 1) {
            this.currentPage--;
            this.renderMenu();
          }
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
          if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderMenu();
          }
        });
      }

      // Initial render
      this.renderMenu();
    },

    // Filter data
    filterData: function() {
      // Menu data is now provided by backend via window.MENU_ITEMS_FROM_DB
      // This function should use backend API instead of local MENU_DATABASE
      const menuData = window.MENU_ITEMS_FROM_DB || [];
      
      if (!this.searchKeyword) {
        this.filteredData = menuData;
      } else {
        this.filteredData = menuData.filter(item => {
          return item.name.toLowerCase().includes(this.searchKeyword) ||
                 (item.description && item.description.toLowerCase().includes(this.searchKeyword)) ||
                 (item.category && item.category.toLowerCase().includes(this.searchKeyword));
        });
      }
    },

    // Render star rating
    renderStars: function(rating) {
      let starsHtml = '';
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 >= 0.5;
      const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

      for (let i = 0; i < fullStars; i++) {
        starsHtml += '<img src="../images/star_full.png" class="noeffects" alt="star">';
      }
      if (hasHalfStar) {
        starsHtml += '<img src="../images/star_half_full.png" class="noeffects" alt="star">';
      }
      for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<img src="../images/star_empty.png" class="noeffects" alt="star">';
      }
      return starsHtml;
    },

    // Render menu
    renderMenu: function() {
      this.filterData();
      const container = document.getElementById('menu-container');
      if (!container) return;

      const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      const currentItems = this.filteredData.slice(startIndex, endIndex);

      // Generate HTML
      let menuHtml = '';
      currentItems.forEach(item => {
        const imageUrl = item.image_url || item.image || '../images/blank.png';
        const rating = item.rating || 0;
        menuHtml += `
          <div class="menu-item">
            <div class="menu-header">
              <h3>${item.name}: $${item.price}</h3>
              <a class="button" href="" data-pizza-type="${item.name}">Order Now</a>
            </div>
            <div class="star mb-2">
              ${this.renderStars(rating)}
            </div>
            <div class="row align-items-start">
              <div class="col-12 col-md-4 mb-3 mb-md-0">
                <img src="${imageUrl}" class="img-fluid item-image" alt="${item.name}">
              </div>
              <div class="col-12 col-md-8">
                <p>${item.description || ''}</p>
              </div>
            </div>
            <div class="border3 mt-3"></div>
          </div>
        `;
      });

      container.innerHTML = menuHtml;

      // Update pagination info
      const pageInfo = document.getElementById('pageInfo');
      if (pageInfo) {
        if (this.filteredData.length === 0) {
          pageInfo.textContent = 'No items found';
        } else {
          pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
        }
      }

      // Update pagination button states
      const prevBtn = document.getElementById('prevBtn');
      const nextBtn = document.getElementById('nextBtn');
      
      if (prevBtn) {
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.style.opacity = this.currentPage === 1 ? '0.5' : '1';
        prevBtn.style.cursor = this.currentPage === 1 ? 'not-allowed' : 'pointer';
      }

      if (nextBtn) {
        nextBtn.disabled = this.currentPage >= totalPages || this.filteredData.length === 0;
        nextBtn.style.opacity = (this.currentPage >= totalPages || this.filteredData.length === 0) ? '0.5' : '1';
        nextBtn.style.cursor = (this.currentPage >= totalPages || this.filteredData.length === 0) ? 'not-allowed' : 'pointer';
      }

      // Re-bind Order Now button events
      container.querySelectorAll('.button[data-pizza-type]').forEach(button => {
        button.addEventListener('click', handleOrderClick);
      });
    }
  };


} else {
  document.write("Sorry, your browser does not support Web Storage.");
}
