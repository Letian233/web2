// ==================== 入口文件 ====================
// 依赖：data.js, cart.js, menu.js
// 负责初始化和绑定全局事件监听器

// 检查浏览器是否支持 localStorage
if (typeof(Storage) === "undefined") {
  document.write("Sorry, your browser does not support Web Storage.");
} else {
  // ==================== 用户菜单管理 ====================
  const UserMenu = {
    // 判断用户对象是否代表已登录（后端可能返回 {id: null, username: null, ...}）
    isLoggedIn: function(user) {
      return user && (user.id || user.username);
    },

    // 获取当前用户
    getCurrentUser: function() {
      // 1）优先使用 window.CURRENT_USER（由 pages.js 从 <html data-current-user> 设置）
      if (window.CURRENT_USER !== undefined) {
        return window.CURRENT_USER;
      }

      // 2）从 <html data-current-user="..."> 读取（pages.js 可能还没执行）
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

      // 3）从 <body data-current-user="..."> 读取（兼容旧模板）
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

      // 4）最后兼容旧的 localStorage 模拟登录数据
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

    // 设置当前用户
    setCurrentUser: function(userData) {
      window.CURRENT_USER = userData;
      this.render();
    },

    // 清除当前用户（登出）
    clearCurrentUser: function() {
      window.CURRENT_USER = null;
      localStorage.removeItem('currentUser');
      this.render();
    },

    // 检查登录状态，如果未登录则跳转到登录页面
    requireLogin: function() {
      const currentUser = this.getCurrentUser();
      if (!this.isLoggedIn(currentUser)) {
        // 未登录，跳转到登录页面
        window.location.href = '/login';
        return false;
      }
      return true;
    },

    // 渲染用户菜单
    render: function() {
      const container = document.getElementById('userMenuContainer');
      if (!container) return;

      // 使用 requestAnimationFrame 来避免闪烁
      requestAnimationFrame(() => {
        const currentUser = this.getCurrentUser();

        // 检查是否真正登录（后端可能返回 {id: null, username: null, ...}）
        if (this.isLoggedIn(currentUser)) {
          // 已登录：显示头像下拉菜单
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

          // 绑定登出按钮
          const logoutBtn = document.getElementById('logoutBtn');
          if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
              this.logout();
            });
          }

          // Profile 链接使用标准 href="/profile"，这里无需额外处理

          // 绑定 Order History 链接（打开购物车模态框并切换到历史订单标签）
          const orderHistoryLink = document.getElementById('orderHistoryLink');
          if (orderHistoryLink) {
            orderHistoryLink.addEventListener('click', (e) => {
              // 如果当前在 /menu 页面，打开购物车并切换到历史订单
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
          // 未登录：显示登录和注册按钮
          container.innerHTML = `
            <div class="user-auth-buttons">
              <a class="button user-login-btn" href="/login">Login</a>
              <a class="button user-register-btn" href="/register">Register</a>
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
      // 调用后端登出接口，清理服务器端 session
      fetch('/logout', { method: 'GET', credentials: 'same-origin' })
        .finally(() => {
          this.clearCurrentUser();
          // 刷新到首页，确保导航和用户信息更新
          window.location.href = '/';
        });
    }
  };

  // Expose for other scripts (profile.js)
  window.UserMenu = UserMenu;

  // ==================== 初始化 ====================
  document.addEventListener('DOMContentLoaded', function() {
    // 为所有 "Order Now" 按钮绑定点击事件
    const orderButtons = document.querySelectorAll('.button[data-pizza-type]');
    
    orderButtons.forEach(function(button) {
      button.addEventListener('click', handleOrderClick);
    });

    // 绑定查看购物车按钮（侧边栏）
    const viewCartBtn = document.getElementById('viewCartBtn');
    if (viewCartBtn) {
      viewCartBtn.addEventListener('click', function(e) {
        e.preventDefault();
        Cart.showModal();
      });
    }

    // 绑定悬浮购物车按钮（menu 页面）
    const viewCartBtnFixed = document.getElementById('viewCartBtnFixed');
    if (viewCartBtnFixed) {
      viewCartBtnFixed.addEventListener('click', function(e) {
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
        // 检查登录状态
        if (!UserMenu.requireLogin()) {
          return; // 未登录，已跳转到登录页面
        }
        
        const cartItems = Cart.get();
        if (cartItems.length === 0) {
          Toast.show('Your cart is empty');
          return;
        }

        // 构造发送给后端的订单数据
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

            // 下单成功：清空购物车、本地存储，并提示成功
            localStorage.removeItem('cart');
            Cart.updateCartUI();
            Cart.renderCartModal();
            Toast.show('Order placed successfully!');

            // 自动切换到订单历史标签并刷新历史订单
            Cart.switchTab('history');
          })
          .catch(() => {
            Toast.show('Network error, please try again later.');
          });
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
}

