// ==================== 模拟订单数据（体现多对多关系） ====================
const PROFILE_ORDER_DATA = [
  {
    orderId: 'ORD-001',
    date: '2024-01-15',
    total: 50.00,
    status: 'completed',
    items: [
      { name: 'Pizza', quantity: 1, price: 25 },
      { name: 'Black Forest Cake', quantity: 1, price: 20 }
    ]
  },
  {
    orderId: 'ORD-002',
    date: '2024-01-16',
    total: 75.00,
    status: 'completed',
    items: [
      { name: 'Pizza', quantity: 2, price: 25 },
      { name: 'Boeuf Bourguignon', quantity: 1, price: 45 }
    ]
  },
  {
    orderId: 'ORD-003',
    date: '2024-01-17',
    total: 100.00,
    status: 'pending',
    items: [
      { name: 'Pizza', quantity: 1, price: 25 },
      { name: 'French Snails', quantity: 2, price: 30 },
      { name: 'Black Forest Cake', quantity: 1, price: 20 }
    ]
  },
  {
    orderId: 'ORD-004',
    date: '2024-01-18',
    total: 45.00,
    status: 'completed',
    items: [
      { name: 'Boeuf Bourguignon', quantity: 1, price: 45 }
    ]
  },
  {
    orderId: 'ORD-005',
    date: '2024-01-19',
    total: 70.00,
    status: 'cancelled',
    items: [
      { name: 'Pizza', quantity: 2, price: 25 },
      { name: 'Black Forest Cake', quantity: 1, price: 20 }
    ]
  }
];

// ==================== 模拟地址数据 ====================
const PROFILE_ADDRESS_DATA = [
  {
    id: 1,
    title: 'Home',
    name: 'John Doe',
    phone: '+1 234-567-8900',
    address: '123 Main Street, Apt 4B',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    isDefault: true
  },
  {
    id: 2,
    title: 'Office',
    name: 'John Doe',
    phone: '+1 234-567-8901',
    address: '456 Business Ave, Suite 200',
    city: 'New York',
    state: 'NY',
    zip: '10002',
    isDefault: false
  }
];

// ==================== Tab 切换逻辑 ====================
function switchTab(tabName) {
  // 隐藏所有 tab 内容
  document.querySelectorAll('.tab-content-panel').forEach(panel => {
    panel.classList.remove('active');
  });

  // 显示选中的 tab
  const targetTab = document.getElementById(tabName + 'Tab');
  if (targetTab) {
    targetTab.classList.add('active');
  }

  // 更新侧边栏链接状态
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('data-tab') === tabName) {
      link.classList.add('active');
    }
  });

  // 根据 tab 加载数据
  if (tabName === 'orders') {
    renderOrderHistory();
  } else if (tabName === 'addresses') {
    renderAddresses();
  } else if (tabName === 'profile') {
    loadUserProfile();
  }
}

// ==================== 加载用户资料 ====================
function loadUserProfile() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  
  if (currentUser.username) {
    document.getElementById('profileUsername').value = currentUser.username;
    document.getElementById('profileEmail').value = currentUser.email || '';
    document.getElementById('profilePhone').value = currentUser.phone || '';
    
    // 更新头像显示
    const avatarDisplay = document.getElementById('profileAvatarDisplay');
    if (avatarDisplay) {
      if (currentUser.avatar) {
        avatarDisplay.innerHTML = `<img src="${currentUser.avatar}" alt="Avatar" class="profile-avatar-large">`;
      } else {
        avatarDisplay.textContent = currentUser.username.charAt(0).toUpperCase();
      }
    }
  }
}

// ==================== 渲染订单历史 ====================
function renderOrderHistory() {
  const tbody = document.getElementById('orderHistoryTableBody');
  const accordion = document.getElementById('orderItemsAccordion');
  
  if (!tbody) return;

  tbody.innerHTML = '';
  if (accordion) {
    accordion.innerHTML = '';
  }

  PROFILE_ORDER_DATA.forEach((order, index) => {
    // 创建表格行
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${order.orderId}</td>
      <td>${order.date}</td>
      <td>$${order.total.toFixed(2)}</td>
      <td><span class="order-status ${order.status}">${order.status.toUpperCase()}</span></td>
      <td><button class="button view-items-btn" data-order-index="${index}">View Items</button></td>
    `;
    tbody.appendChild(row);

    // 创建 Accordion 项
    if (accordion) {
      const accordionItem = document.createElement('div');
      accordionItem.className = 'accordion-item';
      accordionItem.id = `accordion-${index}`;
      accordionItem.style.display = 'none';
      
      const itemsList = order.items.map(item => 
        `<li><span>${item.name} x${item.quantity}</span><span>$${(item.price * item.quantity).toFixed(2)}</span></li>`
      ).join('');
      
      accordionItem.innerHTML = `
        <div class="accordion-header" data-accordion-index="${index}">
          <span><strong>${order.orderId}</strong> - ${order.items.length} item(s)</span>
          <span>▼</span>
        </div>
        <div class="accordion-content">
          <ul class="order-item-list">
            ${itemsList}
          </ul>
          <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #9c5959;">
            <strong style="color: #693434;">Total: $${order.total.toFixed(2)}</strong>
          </div>
        </div>
      `;
      accordion.appendChild(accordionItem);
    }
  });

  // 绑定 View Items 按钮事件
  document.querySelectorAll('.view-items-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const orderIndex = this.getAttribute('data-order-index');
      const accordionItem = document.getElementById(`accordion-${orderIndex}`);
      
      if (!accordionItem) return;
      
      // 关闭所有其他 accordion
      document.querySelectorAll('.accordion-item').forEach(item => {
        if (item.id !== `accordion-${orderIndex}`) {
          item.style.display = 'none';
          const header = item.querySelector('.accordion-header');
          const content = item.querySelector('.accordion-content');
          if (header) header.classList.remove('active');
          if (content) content.classList.remove('active');
        }
      });

      // 切换当前 accordion
      if (accordionItem.style.display === 'none') {
        accordionItem.style.display = 'block';
        const header = accordionItem.querySelector('.accordion-header');
        const content = accordionItem.querySelector('.accordion-content');
        if (header) header.classList.add('active');
        if (content) content.classList.add('active');
      } else {
        accordionItem.style.display = 'none';
        const header = accordionItem.querySelector('.accordion-header');
        const content = accordionItem.querySelector('.accordion-content');
        if (header) header.classList.remove('active');
        if (content) content.classList.remove('active');
      }
    });
  });

  // 绑定 Accordion 头部点击事件
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', function() {
      const accordionIndex = this.getAttribute('data-accordion-index');
      const accordionItem = document.getElementById(`accordion-${accordionIndex}`);
      if (!accordionItem) return;
      
      const content = accordionItem.querySelector('.accordion-content');
      if (!content) return;
      
      if (content.classList.contains('active')) {
        content.classList.remove('active');
        this.classList.remove('active');
      } else {
        // 关闭所有其他
        document.querySelectorAll('.accordion-content').forEach(c => c.classList.remove('active'));
        document.querySelectorAll('.accordion-header').forEach(h => h.classList.remove('active'));
        
        content.classList.add('active');
        this.classList.add('active');
      }
    });
  });
}

// ==================== 渲染地址 ====================
function renderAddresses() {
  const container = document.getElementById('addressCardsContainer');
  if (!container) return;

  container.innerHTML = '';

  PROFILE_ADDRESS_DATA.forEach(address => {
    const card = document.createElement('div');
    card.className = `address-card ${address.isDefault ? 'default' : ''}`;
    card.innerHTML = `
      <div class="address-card-header">
        <h4 class="address-card-title">${address.title}</h4>
        ${address.isDefault ? '<span class="default-badge">Default</span>' : ''}
      </div>
      <div class="address-card-content">
        <p><strong>${address.name}</strong></p>
        <p>${address.address}</p>
        <p>${address.city}, ${address.state} ${address.zip}</p>
        <p>Phone: ${address.phone}</p>
      </div>
      <div class="address-card-actions">
        <button class="button" style="font-size: 12px; padding: 6px 12px;">Edit</button>
        <button class="button" style="font-size: 12px; padding: 6px 12px;">Delete</button>
        ${!address.isDefault ? '<button class="button" style="font-size: 12px; padding: 6px 12px;">Set as Default</button>' : ''}
      </div>
    `;
    container.appendChild(card);
  });
}

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', function() {
  // 检查用户是否登录
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  if (!currentUser.username) {
    // 未登录，跳转到登录页
    window.location.href = 'login.html';
    return;
  }

  // 使用 requestAnimationFrame 延迟执行，避免与 UserMenu.render() 冲突
  requestAnimationFrame(function() {
    // 加载用户资料
    loadUserProfile();

    // 绑定侧边栏链接点击事件
    document.querySelectorAll('.sidebar-link').forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const tabName = this.getAttribute('data-tab');
        if (tabName) {
          switchTab(tabName);
        }
      });
    });

    // 绑定登出链接
    const logoutLink = document.getElementById('logoutSidebarLink');
    if (logoutLink) {
      logoutLink.addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
          localStorage.removeItem('currentUser');
          window.location.href = 'index.html';
        }
      });
    }

    // 绑定表单提交
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
      profileForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        currentUser.username = document.getElementById('profileUsername').value;
        currentUser.email = document.getElementById('profileEmail').value;
        currentUser.phone = document.getElementById('profilePhone').value;
        
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // 显示成功提示
        if (typeof Toast !== 'undefined') {
          Toast.show('Profile updated successfully!');
        } else {
          alert('Profile updated successfully!');
        }
        
        // 更新用户菜单（如果存在）
        if (typeof UserMenu !== 'undefined' && UserMenu.render) {
          UserMenu.render();
        }
      });
    }

    // 绑定添加地址按钮
    const addAddressBtn = document.getElementById('addAddressBtn');
    if (addAddressBtn) {
      addAddressBtn.addEventListener('click', function() {
        alert('Add address functionality coming soon!');
      });
    }
  });
});
