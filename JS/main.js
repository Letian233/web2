// ==================== 入口文件 ====================
// 依赖：data.js, cart.js, menu.js
// 负责初始化和绑定全局事件监听器

// 检查浏览器是否支持 localStorage
if (typeof(Storage) === "undefined") {
  document.write("Sorry, your browser does not support Web Storage.");
} else {
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
}

