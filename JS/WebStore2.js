// Check if the browser supports localStorage
if (typeof(Storage) !== "undefined") {

  // ==================== 菜单数据库（模拟后端数据） ====================
  // 扩展为数组格式，包含详细信息
  const MENU_DATABASE = [
    {
      id: 1,
      name: 'Pizza',
      price: 25,
      image: '../images/pizza1.jpg',
      description: 'Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra.',
      category: 'Main Course',
      rating: 3.5
    },
    {
      id: 2,
      name: 'Black Forest Cake',
      price: 20,
      image: '../images/black_cake.jpg',
      description: 'Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra.',
      category: 'Dessert',
      rating: 4.0
    },
    {
      id: 3,
      name: 'Boeuf Bourguignon',
      price: 45,
      image: '../images/beef-stew-15.png',
      description: 'Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra.',
      category: 'Main Course',
      rating: 5.0
    },
    {
      id: 4,
      name: 'French Snails',
      price: 30,
      image: '../images/snails.jpg',
      description: 'Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra.',
      category: 'Appetizer',
      rating: 2.5
    },
    {
      id: 5,
      name: 'Seafood Pasta',
      price: 28,
      image: '../images/pizza1.jpg',
      description: 'Fresh seafood with traditional pasta, served with a white wine cream sauce. A delightful combination of ocean flavors and Italian tradition.',
      category: 'Main Course',
      rating: 4.5
    },
    {
      id: 6,
      name: 'Mediterranean Salad',
      price: 15,
      image: '../images/black_cake.jpg',
      description: 'A mix of green leaves, cherry tomatoes, olives, and feta cheese. Fresh, healthy, and bursting with Mediterranean flavors.',
      category: 'Salad',
      rating: 4.0
    },
    {
      id: 7,
      name: 'Pan-Seared Salmon',
      price: 32,
      image: '../images/beef-stew-15.png',
      description: 'Premium Norwegian salmon with a side of lemon butter sauce and seasonal vegetables. Perfectly cooked to maintain its tenderness.',
      category: 'Main Course',
      rating: 4.5
    },
    {
      id: 8,
      name: 'Mushroom Risotto',
      price: 24,
      image: '../images/snails.jpg',
      description: 'A rich and creamy mushroom risotto infused with Parmesan cheese and fresh herbs. A comforting Italian classic.',
      category: 'Main Course',
      rating: 4.0
    },
    {
      id: 9,
      name: 'Chocolate Lava Cake',
      price: 18,
      image: '../images/pizza1.jpg',
      description: 'Warm chocolate cake with a molten center, served with vanilla ice cream. A decadent dessert that melts in your mouth.',
      category: 'Dessert',
      rating: 5.0
    },
    {
      id: 10,
      name: 'Caesar Salad',
      price: 14,
      image: '../images/black_cake.jpg',
      description: 'Classic Caesar salad with crisp romaine lettuce, parmesan cheese, croutons, and our signature Caesar dressing.',
      category: 'Salad',
      rating: 4.0
    },
    {
      id: 11,
      name: 'Grilled Chicken Breast',
      price: 22,
      image: '../images/beef-stew-15.png',
      description: 'Tender grilled chicken breast marinated in herbs and spices, served with roasted vegetables and a side of mashed potatoes.',
      category: 'Main Course',
      rating: 4.5
    },
    {
      id: 12,
      name: 'Tiramisu',
      price: 16,
      image: '../images/pizza1.jpg',
      description: 'Classic Italian dessert made with layers of coffee-soaked ladyfingers, mascarpone cheese, and cocoa powder.',
      category: 'Dessert',
      rating: 5.0
    },
    {
      id: 13,
      name: 'Beef Ribs',
      price: 38,
      image: '../images/beef-stew-15.png',
      description: 'Slow-roasted beef ribs with our signature barbecue sauce, served with coleslaw and cornbread. A hearty meal that satisfies.',
      category: 'Main Course',
      rating: 4.5
    },
    {
      id: 14,
      name: 'Caprese Salad',
      price: 13,
      image: '../images/black_cake.jpg',
      description: 'Fresh mozzarella, ripe tomatoes, and basil leaves drizzled with extra virgin olive oil and balsamic glaze.',
      category: 'Salad',
      rating: 4.5
    },
    {
      id: 15,
      name: 'Lobster Bisque',
      price: 26,
      image: '../images/snails.jpg',
      description: 'Rich and creamy lobster soup with a hint of brandy, garnished with fresh herbs and a dollop of crème fraîche.',
      category: 'Soup',
      rating: 4.5
    },
    {
      id: 16,
      name: 'Margherita Pizza',
      price: 18,
      image: '../images/pizza1.jpg',
      description: 'Traditional Italian pizza with fresh mozzarella, tomato sauce, and basil leaves. Simple, classic, and delicious.',
      category: 'Main Course',
      rating: 4.5
    },
    {
      id: 17,
      name: 'Chocolate Mousse',
      price: 15,
      image: '../images/black_cake.jpg',
      description: 'Silky smooth dark chocolate mousse topped with whipped cream and chocolate shavings. A decadent treat for chocolate lovers.',
      category: 'Dessert',
      rating: 4.5
    },
    {
      id: 18,
      name: 'Fish and Chips',
      price: 20,
      image: '../images/beef-stew-15.png',
      description: 'Beer-battered cod served with crispy golden fries, mushy peas, and tartar sauce. A British classic done right.',
      category: 'Main Course',
      rating: 4.0
    },
    {
      id: 19,
      name: 'Greek Salad',
      price: 16,
      image: '../images/black_cake.jpg',
      description: 'Fresh cucumbers, tomatoes, red onions, Kalamata olives, and feta cheese with a lemon-oregano vinaigrette.',
      category: 'Salad',
      rating: 4.5
    },
    {
      id: 20,
      name: 'Apple Pie',
      price: 12,
      image: '../images/pizza1.jpg',
      description: 'Homemade apple pie with a flaky crust, filled with cinnamon-spiced apples and served warm with vanilla ice cream.',
      category: 'Dessert',
      rating: 4.5
    }
  ];

  // 保留 menuDatabase 对象格式以兼容现有购物车代码
  const menuDatabase = {};
  MENU_DATABASE.forEach(item => {
    menuDatabase[item.id] = {
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image
    };
  });

  // ==================== 模拟历史订单数据（体现多对多关系） ====================
  // 订单与菜品是多对多关系：一个订单可以包含多个菜品，一个菜品可以出现在多个订单中
  const MOCK_ORDER_HISTORY = [
    {
      orderId: 'ORD-001',
      date: '2024-01-15',
      total: 50.00,
      items: [
        { id: 1, name: 'Pizza', price: 25, quantity: 1 },
        { id: 2, name: 'Black Forest Cake', price: 20, quantity: 1 }
      ]
    },
    {
      orderId: 'ORD-002',
      date: '2024-01-16',
      total: 75.00,
      items: [
        { id: 1, name: 'Pizza', price: 25, quantity: 2 },
        { id: 3, name: 'Boeuf Bourguignon', price: 45, quantity: 1 }
      ]
    },
    {
      orderId: 'ORD-003',
      date: '2024-01-17',
      total: 100.00,
      items: [
        { id: 1, name: 'Pizza', price: 25, quantity: 1 },
        { id: 4, name: 'French Snails', price: 30, quantity: 2 },
        { id: 2, name: 'Black Forest Cake', price: 20, quantity: 1 }
      ]
    },
    {
      orderId: 'ORD-004',
      date: '2024-01-18',
      total: 45.00,
      items: [
        { id: 3, name: 'Boeuf Bourguignon', price: 45, quantity: 1 }
      ]
    },
    {
      orderId: 'ORD-005',
      date: '2024-01-19',
      total: 70.00,
      items: [
        { id: 1, name: 'Pizza', price: 25, quantity: 2 },
        { id: 2, name: 'Black Forest Cake', price: 20, quantity: 1 }
      ]
    }
  ];

  // ==================== 购物车对象 ====================
  const Cart = {
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

    // 更新购物车 UI（更新导航栏的购物车计数器）
    updateCartUI: function() {
      const cartBadge = document.getElementById('cart-badge');
      if (cartBadge) {
        const totalQuantity = this.getTotalQuantity();
        cartBadge.textContent = totalQuantity;
        // 如果数量为 0，隐藏角标
        if (totalQuantity === 0) {
          cartBadge.style.display = 'none';
        } else {
          cartBadge.style.display = 'inline-block';
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
        // 渲染历史订单
        this.renderHistory();
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

      if (MOCK_ORDER_HISTORY.length === 0) {
        orderHistoryList.style.display = 'none';
        orderHistoryEmpty.style.display = 'block';
        return;
      }

      orderHistoryList.style.display = 'flex';
      orderHistoryEmpty.style.display = 'none';

      // 渲染每个订单
      MOCK_ORDER_HISTORY.forEach(order => {
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
    }
  };

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

  // ==================== 用户菜单管理 ====================
  const UserMenu = {
    // 获取当前用户
    getCurrentUser: function() {
      const userData = localStorage.getItem('currentUser');
      return userData ? JSON.parse(userData) : null;
    },

    // 设置当前用户
    setCurrentUser: function(userData) {
      localStorage.setItem('currentUser', JSON.stringify(userData));
      this.render();
    },

    // 清除当前用户（登出）
    clearCurrentUser: function() {
      localStorage.removeItem('currentUser');
      this.render();
    },

    // 渲染用户菜单
    render: function() {
      const container = document.getElementById('userMenuContainer');
      if (!container) return;

      // 使用 requestAnimationFrame 来避免闪烁
      requestAnimationFrame(() => {
        const currentUser = this.getCurrentUser();

        if (currentUser) {
        // 已登录：显示头像下拉菜单
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

        // 绑定登出按钮
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
          logoutBtn.addEventListener('click', () => {
            this.logout();
          });
        }

        // 绑定 Profile 链接（跳转到个人设置页）
        const profileLink = document.getElementById('profileLink');
        if (profileLink) {
          profileLink.addEventListener('click', (e) => {
            // 如果当前在 profile.html，阻止跳转
            if (window.location.pathname.includes('profile.html')) {
              e.preventDefault();
              return;
            }
            // 跳转到个人设置页面
            window.location.href = 'profile.html';
          });
        }

        // 绑定 Order History 链接（打开购物车模态框并切换到历史订单标签）
        const orderHistoryLink = document.getElementById('orderHistoryLink');
        if (orderHistoryLink) {
          orderHistoryLink.addEventListener('click', (e) => {
            // 如果当前在 menu.html，打开购物车并切换到历史订单
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
        // 未登录：显示登录和注册按钮
        container.innerHTML = `
          <div class="user-auth-buttons">
            <a class="button user-login-btn" href="login.html">Login</a>
            <a class="button user-register-btn" href="register.html">Register</a>
          </div>
        `;
        }
      });
    },

    // 初始化
    init: function() {
      this.render();
    },

    // 登出
    logout: function() {
      this.clearCurrentUser();
      Toast.show('Logged out successfully!');
      // 刷新页面或跳转到首页
      setTimeout(() => {
        if (window.location.pathname.includes('menu.html')) {
          window.location.reload();
        } else {
          window.location.href = 'index.html';
        }
      }, 1000);
    }
  };

  // ==================== 初始化 ====================
  document.addEventListener('DOMContentLoaded', function() {
    // 为所有 "Order Now" 按钮绑定点击事件
    const orderButtons = document.querySelectorAll('.button[data-pizza-type]');
    
    orderButtons.forEach(function(button) {
      button.addEventListener('click', handleOrderClick);
    });

    // 绑定查看购物车按钮
    const viewCartBtn = document.getElementById('viewCartBtn');
    if (viewCartBtn) {
      viewCartBtn.addEventListener('click', function(e) {
        e.preventDefault();
        Cart.showModal();
      });
    }

    // 绑定关闭模态框按钮
    const cartModalClose = document.getElementById('cartModalClose');
    if (cartModalClose) {
      cartModalClose.addEventListener('click', function() {
        Cart.hideModal();
      });
    }

    // 点击遮罩层关闭模态框
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
      const overlay = cartModal.querySelector('.cart-modal-overlay');
      if (overlay) {
        overlay.addEventListener('click', function() {
          Cart.hideModal();
        });
      }
    }

    // 绑定结账按钮
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', function() {
        const cartItems = Cart.get();
        if (cartItems.length === 0) {
          Toast.show('Your cart is empty');
          return;
        }
        // 这里可以添加结账逻辑
        Toast.show('Checkout functionality coming soon!');
        // 可以在这里添加跳转到结账页面的逻辑
      });
    }

    // 绑定标签页切换按钮
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

    // 初始化购物车 UI
    Cart.updateCartUI();

    // 初始化用户菜单
    UserMenu.init();

    // 初始化菜单控制器（如果在 menu 页面）
    if (document.querySelector('.menu-page') || document.getElementById('menu-container')) {
      if (typeof MenuController !== 'undefined') {
        MenuController.init();
      }
    }
  });

  // ==================== 菜单控制器 ====================
  const MenuController = {
    currentPage: 1,
    itemsPerPage: 4,
    searchKeyword: '',
    filteredData: [],

    // 初始化
    init: function() {
      const searchInput = document.getElementById('searchInput');
      const searchBtn = document.getElementById('searchBtn');
      const prevBtn = document.getElementById('prevBtn');
      const nextBtn = document.getElementById('nextBtn');

      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.searchKeyword = e.target.value.trim().toLowerCase();
          this.currentPage = 1; // 搜索时重置到第一页
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

      // 初始渲染
      this.renderMenu();
    },

    // 过滤数据
    filterData: function() {
      if (!this.searchKeyword) {
        this.filteredData = MENU_DATABASE;
      } else {
        this.filteredData = MENU_DATABASE.filter(item => {
          return item.name.toLowerCase().includes(this.searchKeyword) ||
                 item.description.toLowerCase().includes(this.searchKeyword) ||
                 item.category.toLowerCase().includes(this.searchKeyword);
        });
      }
    },

    // 渲染星级评分
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

    // 渲染菜单
    renderMenu: function() {
      this.filterData();
      const container = document.getElementById('menu-container');
      if (!container) return;

      const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      const currentItems = this.filteredData.slice(startIndex, endIndex);

      // 生成 HTML
      let menuHtml = '';
      currentItems.forEach(item => {
        menuHtml += `
          <div class="menu-item">
            <div class="menu-header">
              <h3>${item.name}: $${item.price}</h3>
              <a class="button" href="" data-pizza-type="${item.name}">Order Now</a>
            </div>
            <div class="star mb-2">
              ${this.renderStars(item.rating)}
            </div>
            <div class="row align-items-start">
              <div class="col-12 col-md-4 mb-3 mb-md-0">
                <img src="${item.image}" class="img-fluid item-image" alt="${item.name}">
              </div>
              <div class="col-12 col-md-8">
                <p>${item.description}</p>
              </div>
            </div>
            <div class="border3 mt-3"></div>
          </div>
        `;
      });

      container.innerHTML = menuHtml;

      // 更新分页信息
      const pageInfo = document.getElementById('pageInfo');
      if (pageInfo) {
        if (this.filteredData.length === 0) {
          pageInfo.textContent = 'No items found';
        } else {
          pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
        }
      }

      // 更新分页按钮状态
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

      // 重新绑定 Order Now 按钮事件
      container.querySelectorAll('.button[data-pizza-type]').forEach(button => {
        button.addEventListener('click', handleOrderClick);
      });
    }
  };


} else {
  document.write("Sorry, your browser does not support Web Storage.");
}
