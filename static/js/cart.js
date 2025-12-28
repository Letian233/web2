// ==================== 购物车模块 ====================
// 依赖：data.js (需要 menuDatabase)，订单历史改为通过后端 API 获取

// ==================== Toast 通知系统 ====================
const Toast = {
  show: function(message, duration = 3000) {
    // 移除已存在的 toast
    const existingToast = document.getElementById('toast-notification');
    if (existingToast) {
      existingToast.remove();
    }

    // 创建 toast 元素
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

    // 触发动画
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    }, 10);

    // 自动消失
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

// ==================== 购物车对象 ====================
const Cart = {
  orderHistory: [],
  // 从 localStorage 读取购物车数据
  get: function() {
    const cartData = localStorage.getItem('cart');
    return cartData ? JSON.parse(cartData) : [];
  },

  // 保存购物车数据到 localStorage
  save: function(cartItems) {
    localStorage.setItem('cart', JSON.stringify(cartItems));
    // 保存后更新 UI
    this.updateCartUI();
  },

  // 添加商品到购物车（如果已存在则增加数量）
  add: function(itemId) {
    const cartItems = this.get();
    const menuItem = menuDatabase[itemId];
    
    if (!menuItem) {
      console.error('Item not found in database:', itemId);
      return false;
    }

    // 查找购物车中是否已存在该商品
    const existingItem = cartItems.find(item => item.id === itemId);
    
    if (existingItem) {
      // 如果已存在，增加数量
      existingItem.quantity += 1;
    } else {
      // 如果不存在，添加新商品
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

  // 计算购物车总价
  getTotal: function() {
    const cartItems = this.get();
    return cartItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  },

  // 获取购物车商品总数
  getTotalQuantity: function() {
    const cartItems = this.get();
    return cartItems.reduce((total, item) => {
      return total + item.quantity;
    }, 0);
  },

  // 更新购物车 UI（更新导航栏的购物车计数器和悬浮按钮）
  updateCartUI: function() {
    const cartBadge = document.getElementById('cart-badge');
    const cartBadgeFixed = document.getElementById('cartBadgeFixed');
    const totalQuantity = this.getTotalQuantity();
    
    // 更新导航栏角标
    if (cartBadge) {
      cartBadge.textContent = totalQuantity;
      if (totalQuantity === 0) {
        cartBadge.style.display = 'none';
      } else {
        cartBadge.style.display = 'inline-block';
      }
    }
    
    // 更新悬浮按钮角标（menu 页面）
    if (cartBadgeFixed) {
      cartBadgeFixed.textContent = totalQuantity;
      if (totalQuantity === 0) {
        cartBadgeFixed.style.display = 'none';
      } else {
        cartBadgeFixed.style.display = 'flex';
      }
    }
  },

  // 更新商品数量
  updateQuantity: function(itemId, change) {
    const cartItems = this.get();
    const item = cartItems.find(item => item.id === itemId);
    
    if (!item) return false;

    item.quantity += change;
    
    // 如果数量小于等于 0，移除该商品
    if (item.quantity <= 0) {
      const index = cartItems.findIndex(item => item.id === itemId);
      if (index > -1) {
        cartItems.splice(index, 1);
      }
    }

    this.save(cartItems);
    return true;
  },

  // 渲染购物车模态框
  renderCartModal: function() {
    const cartItems = this.get();
    const cartItemsList = document.getElementById('cartItemsList');
    const cartEmptyMessage = document.getElementById('cartEmptyMessage');
    const cartTotalPrice = document.getElementById('cartTotalPrice');
    
    if (!cartItemsList || !cartEmptyMessage || !cartTotalPrice) {
      console.error('Cart modal elements not found');
      return;
    }

    // 清空列表
    cartItemsList.innerHTML = '';

    if (cartItems.length === 0) {
      // 购物车为空
      cartItemsList.style.display = 'none';
      cartEmptyMessage.style.display = 'block';
      cartTotalPrice.textContent = '0.00';
    } else {
      // 显示商品列表
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

      // 绑定数量调整按钮事件
      const quantityButtons = cartItemsList.querySelectorAll('.quantity-btn');
      quantityButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const itemId = parseInt(btn.getAttribute('data-item-id'));
          const action = btn.getAttribute('data-action');
          const change = action === 'increase' ? 1 : -1;
          
          this.updateQuantity(itemId, change);
          this.renderCartModal(); // 重新渲染
        });
      });
    }

    // 更新总价
    const total = this.getTotal();
    cartTotalPrice.textContent = total.toFixed(2);
  },

  // 显示购物车模态框
  showModal: function() {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
      this.renderCartModal();
      cartModal.classList.add('active');
      document.body.style.overflow = 'hidden'; // 防止背景滚动
    }
  },

  // 隐藏购物车模态框
  hideModal: function() {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
      cartModal.classList.remove('active');
      document.body.style.overflow = ''; // 恢复滚动
    }
  },

  // 切换标签页
  switchTab: function(tabName) {
    // 更新标签按钮状态
    const tabButtons = document.querySelectorAll('.cart-tab-btn');
    tabButtons.forEach(btn => {
      if (btn.getAttribute('data-tab') === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // 更新内容区域显示
    const currentTab = document.getElementById('currentOrderTab');
    const historyTab = document.getElementById('orderHistoryTab');

    if (tabName === 'current') {
      if (currentTab) currentTab.classList.add('active');
      if (historyTab) historyTab.classList.remove('active');
      // 重新渲染当前购物车
      this.renderCartModal();
    } else if (tabName === 'history') {
      if (currentTab) currentTab.classList.remove('active');
      if (historyTab) historyTab.classList.add('active');
      // 从后端加载并渲染历史订单
      this.fetchHistory();
    }
  },

  // 渲染历史订单列表
  renderHistory: function() {
    const orderHistoryList = document.getElementById('orderHistoryList');
    const orderHistoryEmpty = document.getElementById('orderHistoryEmpty');

    if (!orderHistoryList || !orderHistoryEmpty) {
      console.error('Order history elements not found');
      return;
    }

    // 清空列表
    orderHistoryList.innerHTML = '';

    if (!this.orderHistory || this.orderHistory.length === 0) {
      orderHistoryList.style.display = 'none';
      orderHistoryEmpty.style.display = 'block';
      return;
    }

    orderHistoryList.style.display = 'flex';
    orderHistoryEmpty.style.display = 'none';

    // 渲染每个订单
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

      // 绑定展开/收起事件
      const header = orderItem.querySelector('.order-history-header');
      const details = orderItem.querySelector('.order-history-details');
      
      header.addEventListener('click', function() {
        const isActive = header.classList.contains('active');
        
        // 关闭所有其他订单详情
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

        // 切换当前订单详情
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

  // 从后端加载订单历史
  fetchHistory: function() {
    const orderHistoryList = document.getElementById('orderHistoryList');
    const orderHistoryEmpty = document.getElementById('orderHistoryEmpty');
    if (!orderHistoryList || !orderHistoryEmpty) return;

    // 简单的加载状态
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
          // 未登录或其他错误
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

// ==================== 根据菜品名称查找 ID ====================
function findItemIdByName(itemName) {
  for (const id in menuDatabase) {
    if (menuDatabase[id].name === itemName) {
      return parseInt(id);
    }
  }
  return null;
}

// ==================== 处理订单按钮点击 ====================
function handleOrderClick(event) {
  event.preventDefault();
  
  // 检查登录状态
  if (typeof UserMenu !== 'undefined' && !UserMenu.requireLogin()) {
    return; // 未登录，已跳转到登录页面
  }
  
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

  // 添加到购物车
  const success = Cart.add(itemId);
  if (success) {
    Toast.show('Added to cart!');
  } else {
    Toast.show('Failed to add, please try again later');
  }
}

