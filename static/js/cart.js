// ==================== Shopping Cart Module ====================
// Dependencies: data.js (requires menuDatabase), order history now fetched via backend API

// ==================== Toast Notification System ====================
const Toast = {
  show: function(message, duration = 3000) {
    const existingToast = document.getElementById('toast-notification');
    if (existingToast) {
      existingToast.remove();
    }

    // Calculate position: prioritize proximity to user avatar (userMenuContainer in top right)
    let topPx = 20;
    let rightPx = 20;
    const anchor = document.getElementById('userMenuContainer') || document.querySelector('.user-menu-fixed');
    if (anchor && anchor.getBoundingClientRect) {
      const rect = anchor.getBoundingClientRect();
      topPx = rect.bottom + 10;
      rightPx = Math.max(window.innerWidth - rect.right, 20);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: ${topPx}px;
      right: ${rightPx}px;
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

// ==================== Shopping Cart Object ====================
const Cart = {
  orderHistory: [],
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
  // itemData: optional, directly pass {id, name, price, image} to avoid dependency on menuDatabase
  add: function(itemId, itemData = null) {
    const cartItems = this.get();
    const menuItem = itemData || menuDatabase[itemId];
    
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

  // Update cart UI (update cart counter in navigation bar and floating button)
  updateCartUI: function() {
    const cartBadge = document.getElementById('cart-badge');
    const cartBadgeFixed = document.getElementById('cartBadgeFixed');
    const totalQuantity = this.getTotalQuantity();
    
    // Update navigation bar badge
    if (cartBadge) {
      cartBadge.textContent = totalQuantity;
      if (totalQuantity === 0) {
        cartBadge.style.display = 'none';
      } else {
        cartBadge.style.display = 'inline-block';
      }
    }
    
    // Update floating button badge (menu page)
    if (cartBadgeFixed) {
      cartBadgeFixed.textContent = totalQuantity;
      if (totalQuantity === 0) {
        cartBadgeFixed.style.display = 'none';
      } else {
        cartBadgeFixed.style.display = 'flex';
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
      // Load and render order history from backend
      this.fetchHistory();
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

    if (!this.orderHistory || this.orderHistory.length === 0) {
      orderHistoryList.style.display = 'none';
      orderHistoryEmpty.style.display = 'block';
      return;
    }

    orderHistoryList.style.display = 'flex';
    orderHistoryEmpty.style.display = 'none';

    // Render each order
    this.orderHistory.forEach(order => {
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
  },

  // Load order history from backend
  fetchHistory: function() {
    const orderHistoryList = document.getElementById('orderHistoryList');
    const orderHistoryEmpty = document.getElementById('orderHistoryEmpty');
    if (!orderHistoryList || !orderHistoryEmpty) return;

    // Simple loading state
    orderHistoryList.innerHTML = '<p style="padding: 16px;">Loading orders...</p>';
    orderHistoryList.style.display = 'block';
    orderHistoryEmpty.style.display = 'none';

    fetch('/api/orders', {
      method: 'GET',
      credentials: 'same-origin'
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(result => {
        if (!result.ok) {
          // Not logged in or other error
          this.orderHistory = [];
          if (result.data && result.data.error) {
            Toast.show(result.data.error);
          }
        } else if (Array.isArray(result.data)) {
          this.orderHistory = result.data;
        } else {
          this.orderHistory = [];
        }
        this.renderHistory();
      })
      .catch(() => {
        this.orderHistory = [];
        Toast.show('Failed to load order history, please try again later.');
        this.renderHistory();
      });
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
  
  // Check login status
  if (typeof UserMenu !== 'undefined' && !UserMenu.requireLogin()) {
    return; // Not logged in, already redirected to login page
  }
  
  const button = event.currentTarget;
  const itemName = button.getAttribute('data-pizza-type');
  
  if (!itemName) {
    console.error('Item name not found');
    return;
  }

  // Prioritize data-* attributes to reduce dependency on menuDatabase
  const dataId = button.dataset.itemId ? parseInt(button.dataset.itemId, 10) : null;
  const dataPrice = button.dataset.itemPrice ? parseFloat(button.dataset.itemPrice) : null;
  const dataImage = button.dataset.itemImage;

  let itemId = dataId;
  let itemData = null;

  if (dataId && !Number.isNaN(dataId)) {
    itemData = {
      id: dataId,
      name: itemName,
      price: dataPrice || 0,
      image: dataImage || ''
    };
  } else {
    itemId = findItemIdByName(itemName);
  }

  if (!itemId) {
    console.error('Item ID not found for:', itemName);
    Toast.show('Item not found, please try again later');
    return;
  }

  // Add to cart
  const success = Cart.add(itemId, itemData);
  if (success) {
    Toast.show('Added to cart!');
  } else {
    Toast.show('Failed to add, please try again later');
  }
}

