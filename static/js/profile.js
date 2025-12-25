// ==================== Profile 页面功能 ====================

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
    loadOrderHistory();
  } else if (tabName === 'addresses') {
    loadAddresses();
  } else if (tabName === 'profile') {
    loadUserProfile();
  }
}

// ==================== 加载用户资料 ====================
async function loadUserProfile() {
  try {
    const response = await fetch('/api/me', {
      credentials: 'same-origin'
    });
    
    if (!response.ok) {
      throw new Error('Failed to load profile');
    }

    const data = await response.json();
    const user = data.user;

    if (user) {
      document.getElementById('profileUsername').value = user.username || '';
      document.getElementById('profileEmail').value = user.email || '';
      document.getElementById('profilePhone').value = user.phone || '';
      
      // 更新头像显示
      updateAvatarDisplay(user.avatar_url, user.username);
    }
  } catch (error) {
    console.error('Error loading profile:', error);
    // 使用 window.CURRENT_USER 作为后备
    const currentUser = window.CURRENT_USER;
    if (currentUser) {
      document.getElementById('profileUsername').value = currentUser.username || '';
      document.getElementById('profileEmail').value = currentUser.email || '';
      document.getElementById('profilePhone').value = currentUser.phone || '';
      updateAvatarDisplay(currentUser.avatar_url, currentUser.username);
    }
  }
}

// ==================== 更新头像显示 ====================
function updateAvatarDisplay(avatarUrl, username) {
  const avatarDisplay = document.getElementById('profileAvatarDisplay');
  if (!avatarDisplay) return;

  // 确保容器有正确的类名
  avatarDisplay.className = 'profile-avatar-display';

  if (avatarUrl) {
    // 有头像：显示图片，完整填充圆形
    avatarDisplay.innerHTML = `<img src="${avatarUrl}" alt="Avatar" class="profile-avatar-large">`;
  } else {
    // 无头像：显示首字母占位符
    const initial = username ? username.charAt(0).toUpperCase() : 'U';
    avatarDisplay.textContent = initial;
    avatarDisplay.classList.add('profile-avatar-placeholder-large');
  }
}

// ==================== 上传头像 ====================
async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('avatar', file);

  try {
    const response = await fetch('/api/profile/avatar', {
      method: 'POST',
      credentials: 'same-origin',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload avatar');
    }

    const data = await response.json();
    
    // 更新显示
    const currentUser = window.CURRENT_USER || {};
    currentUser.avatar_url = data.avatar_url;
    window.CURRENT_USER = currentUser;
    
    updateAvatarDisplay(data.avatar_url, currentUser.username);
    
    // 更新用户菜单
    if (typeof UserMenu !== 'undefined' && UserMenu.render) {
      UserMenu.render();
    }

    // 显示成功提示
    if (typeof Toast !== 'undefined') {
      Toast.show('Avatar uploaded successfully!');
    } else {
      alert('Avatar uploaded successfully!');
    }
  } catch (error) {
    console.error('Error uploading avatar:', error);
    alert('Failed to upload avatar: ' + error.message);
  }
}

// ==================== 加载订单历史 ====================
async function loadOrderHistory() {
  try {
    const response = await fetch('/api/orders', {
      credentials: 'same-origin'
    });

    if (!response.ok) {
      throw new Error('Failed to load orders');
    }

    allOrders = await response.json();
    currentOrderPage = 1; // 重置到第一页

    renderOrderHistory();
  } catch (error) {
    console.error('Error loading orders:', error);
    allOrders = [];
    renderOrderHistory();
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

  if (allOrders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No orders yet</td></tr>';
    updateOrderPagination(0);
    return;
  }

  // 计算分页
  const totalPages = Math.ceil(allOrders.length / ordersPerPage);
  const startIndex = (currentOrderPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const currentPageOrders = allOrders.slice(startIndex, endIndex);

  currentPageOrders.forEach((order, pageIndex) => {
    // 计算全局索引（用于 accordion ID）
    const globalIndex = startIndex + pageIndex;
    
    // 创建表格行
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${order.orderId}</td>
      <td>${order.date}</td>
      <td>$${order.total.toFixed(2)}</td>
      <td><span class="order-status ${order.status.toLowerCase()}">${order.status.toUpperCase()}</span></td>
      <td><button class="button view-items-btn" data-order-index="${globalIndex}">View Items</button></td>
    `;
    tbody.appendChild(row);

    // 创建 Accordion 项
    if (accordion) {
      const accordionItem = document.createElement('div');
      accordionItem.className = 'accordion-item';
      accordionItem.id = `accordion-${globalIndex}`;
      accordionItem.style.display = 'none';
      
      const itemsList = order.items.map(item => 
        `<li><span>${item.name} x${item.quantity}</span><span>$${(item.price * item.quantity).toFixed(2)}</span></li>`
      ).join('');
      
      accordionItem.innerHTML = `
        <div class="accordion-header" data-accordion-index="${globalIndex}">
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

  // 更新分页控件
  updateOrderPagination(totalPages);
}

// ==================== 更新订单分页控件 ====================
function updateOrderPagination(totalPages) {
  const pagination = document.getElementById('orderPagination');
  const prevBtn = document.getElementById('prevOrderPageBtn');
  const nextBtn = document.getElementById('nextOrderPageBtn');
  const infoSpan = document.getElementById('orderPaginationInfo');

  if (!pagination || !prevBtn || !nextBtn || !infoSpan) return;

  if (totalPages <= 1) {
    pagination.style.display = 'none';
    return;
  }

  pagination.style.display = 'flex';

  // 更新按钮状态
  prevBtn.disabled = currentOrderPage === 1;
  nextBtn.disabled = currentOrderPage === totalPages;

  // 更新分页信息
  infoSpan.textContent = `Page ${currentOrderPage} of ${totalPages}`;
}

// ==================== 订单上一页 ====================
function goToPreviousOrderPage() {
  if (currentOrderPage > 1) {
    currentOrderPage--;
    renderOrderHistory();
    // 滚动到顶部
    const tbody = document.getElementById('orderHistoryTableBody');
    if (tbody) {
      tbody.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

// ==================== 订单下一页 ====================
function goToNextOrderPage() {
  const totalPages = Math.ceil(allOrders.length / ordersPerPage);
  if (currentOrderPage < totalPages) {
    currentOrderPage++;
    renderOrderHistory();
    // 滚动到顶部
    const tbody = document.getElementById('orderHistoryTableBody');
    if (tbody) {
      tbody.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

// ==================== 地址分页状态 ====================
let allAddresses = [];
let currentAddressPage = 1;
const addressesPerPage = 4;

// ==================== 订单分页状态 ====================
let allOrders = [];
let currentOrderPage = 1;
const ordersPerPage = 4;

// ==================== 加载地址 ====================
async function loadAddresses() {
  try {
    const response = await fetch('/api/addresses', {
      credentials: 'same-origin'
    });

    if (!response.ok) {
      throw new Error('Failed to load addresses');
    }

    const data = await response.json();
    allAddresses = data.addresses || [];
    
    // 如果当前页没有地址了，调整到合适的页码
    const totalPages = Math.ceil(allAddresses.length / addressesPerPage);
    if (currentAddressPage > totalPages && totalPages > 0) {
      currentAddressPage = totalPages;
    }
    if (currentAddressPage < 1 || allAddresses.length === 0) {
      currentAddressPage = 1;
    }

    renderAddresses();
  } catch (error) {
    console.error('Error loading addresses:', error);
    allAddresses = [];
    currentAddressPage = 1;
    renderAddresses();
  }
}

// ==================== 渲染地址 ====================
function renderAddresses() {
  const container = document.getElementById('addressCardsContainer');
  const pagination = document.getElementById('addressPagination');
  if (!container) return;

  container.innerHTML = '';

  if (allAddresses.length === 0) {
    container.innerHTML = '<p style="text-align: center; padding: 20px; color: #693434;">No addresses saved yet. Click "Add New Address" to add one.</p>';
    if (pagination) pagination.style.display = 'none';
    return;
  }

  // 计算分页
  const totalPages = Math.ceil(allAddresses.length / addressesPerPage);
  const startIndex = (currentAddressPage - 1) * addressesPerPage;
  const endIndex = startIndex + addressesPerPage;
  const currentPageAddresses = allAddresses.slice(startIndex, endIndex);

  // 渲染当前页的地址
  currentPageAddresses.forEach(address => {
    const card = document.createElement('div');
    card.className = `address-card ${address.is_default ? 'default' : ''}`;
    
    // 确保 address.id 被正确转换为字符串
    const addressId = String(address.id || '');
    
    // 构建按钮HTML
    let setDefaultBtnHtml = '';
    if (!address.is_default) {
      setDefaultBtnHtml = `<button class="button set-default-btn" data-address-id="${addressId}" style="font-size: 12px; padding: 6px 12px;">Set as Default</button>`;
    }
    
    card.innerHTML = `
      <div class="address-card-header">
        <h4 class="address-card-title">${address.title || ''}</h4>
        ${address.is_default ? '<span class="default-badge">Default</span>' : ''}
      </div>
      <div class="address-card-content">
        <p><strong>${address.recipient_name || ''}</strong></p>
        <p>${address.address_line || ''}</p>
        <p>${address.city || ''}, ${address.state || ''} ${address.zip_code || ''}</p>
        <p>Phone: ${address.phone || ''}</p>
      </div>
      <div class="address-card-actions">
        <button class="button edit-address-btn" data-address-id="${addressId}" style="font-size: 12px; padding: 6px 12px;">Edit</button>
        <button class="button delete-address-btn" data-address-id="${addressId}" style="font-size: 12px; padding: 6px 12px;">Delete</button>
        ${setDefaultBtnHtml}
      </div>
    `;
    container.appendChild(card);
  });

  // 绑定按钮事件
  container.querySelectorAll('.edit-address-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const addressId = btn.getAttribute('data-address-id');
      editAddress(addressId);
    });
  });

  container.querySelectorAll('.delete-address-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const addressId = btn.getAttribute('data-address-id');
      deleteAddress(addressId);
    });
  });

  container.querySelectorAll('.set-default-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      const addressId = btn.getAttribute('data-address-id');
      console.log('Set default button clicked, addressId:', addressId);
      if (addressId) {
        setDefaultAddress(addressId);
      } else {
        console.error('No address ID found on button');
        alert('Error: Address ID not found');
      }
    });
  });

  // 更新分页控件
  updatePagination(totalPages);
}

// ==================== 更新分页控件 ====================
function updatePagination(totalPages) {
  const pagination = document.getElementById('addressPagination');
  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');
  const infoSpan = document.getElementById('paginationInfo');

  if (!pagination || !prevBtn || !nextBtn || !infoSpan) return;

  if (totalPages <= 1) {
    pagination.style.display = 'none';
    return;
  }

  pagination.style.display = 'flex';

  // 更新按钮状态
  prevBtn.disabled = currentAddressPage === 1;
  nextBtn.disabled = currentAddressPage === totalPages;

  // 更新分页信息
  infoSpan.textContent = `Page ${currentAddressPage} of ${totalPages}`;
}

// ==================== 上一页 ====================
function goToPreviousPage() {
  if (currentAddressPage > 1) {
    currentAddressPage--;
    renderAddresses();
    // 滚动到顶部
    const container = document.getElementById('addressCardsContainer');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

// ==================== 下一页 ====================
function goToNextPage() {
  const totalPages = Math.ceil(allAddresses.length / addressesPerPage);
  if (currentAddressPage < totalPages) {
    currentAddressPage++;
    renderAddresses();
    // 滚动到顶部
    const container = document.getElementById('addressCardsContainer');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

// ==================== 地址管理函数 ====================
async function saveAddress(addressData, addressId = null) {
  const url = addressId ? `/api/addresses/${addressId}` : '/api/addresses';
  const method = addressId ? 'PUT' : 'POST';

  try {
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        title: addressData.title,
        recipient_name: addressData.name,
        phone: addressData.phone,
        address_line: addressData.address,
        city: addressData.city,
        state: addressData.state,
        zip_code: addressData.zip,
        is_default: addressData.isDefault
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save address');
    }

    // 重新加载地址列表
    await loadAddresses();

    // 关闭模态框
    const modal = bootstrap.Modal.getInstance(document.getElementById('addressModal'));
    if (modal) {
      modal.hide();
    }

    if (typeof Toast !== 'undefined') {
      Toast.show('Address saved successfully!');
    } else {
      alert('Address saved successfully!');
    }
  } catch (error) {
    console.error('Error saving address:', error);
    alert('Failed to save address: ' + error.message);
  }
}

async function deleteAddress(addressId) {
  if (!confirm('Are you sure you want to delete this address?')) {
    return;
  }

  try {
    const response = await fetch(`/api/addresses/${addressId}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    });

    if (!response.ok) {
      throw new Error('Failed to delete address');
    }

    // 删除后重新加载地址
    await loadAddresses();

    if (typeof Toast !== 'undefined') {
      Toast.show('Address deleted successfully!');
    } else {
      alert('Address deleted successfully!');
    }
  } catch (error) {
    console.error('Error deleting address:', error);
    alert('Failed to delete address: ' + error.message);
  }
}

async function setDefaultAddress(addressId) {
  console.log('setDefaultAddress called with addressId:', addressId);
  try {
    const url = `/api/addresses/${addressId}`;
    console.log('Sending PUT request to:', url);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        is_default: true
      })
    });

    console.log('Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error response:', errorData);
      throw new Error(errorData.error || `Failed to set default address: ${response.status} ${response.statusText}`);
    }

    const result = await response.json().catch(() => ({}));
    console.log('Success response:', result);

    // 重新加载地址列表以更新显示
    await loadAddresses();

    if (typeof Toast !== 'undefined') {
      Toast.show('Default address updated!');
    } else {
      alert('Default address updated!');
    }
  } catch (error) {
    console.error('Error setting default address:', error);
    alert('Failed to set default address: ' + error.message);
  }
}

async function editAddress(addressId) {
  try {
    const response = await fetch('/api/addresses', {
      credentials: 'same-origin'
    });

    if (!response.ok) {
      throw new Error('Failed to load addresses');
    }

    const data = await response.json();
    const address = data.addresses.find(a => a.id == addressId);

    if (!address) {
      throw new Error('Address not found');
    }

    // 填充表单
    document.getElementById('addressId').value = address.id;
    document.getElementById('addressTitle').value = address.title;
    document.getElementById('addressRecipient').value = address.recipient_name;
    document.getElementById('addressPhone').value = address.phone;
    document.getElementById('addressLine').value = address.address_line;
    document.getElementById('addressCity').value = address.city;
    document.getElementById('addressState').value = address.state;
    document.getElementById('addressZip').value = address.zip_code;
    document.getElementById('addressDefault').checked = address.is_default;

    // 更新模态框标题
    const modalTitle = document.getElementById('addressModalLabel');
    if (modalTitle) {
      modalTitle.textContent = 'Edit Address';
    }

    // 显示模态框
    const modalElement = document.getElementById('addressModal');
    if (modalElement) {
      const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
      modal.show();
    }
  } catch (error) {
    console.error('Error loading address:', error);
    alert('Failed to load address: ' + error.message);
  }
}

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', function() {
  // 检查用户是否登录（优先使用 window.CURRENT_USER，由 pages.js 从模板设置）
  const currentUser = window.CURRENT_USER;
  if (!currentUser || (!currentUser.username && !currentUser.id)) {
    // 未登录，跳转到登录页
    window.location.href = '/login';
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
          fetch('/logout', { method: 'GET', credentials: 'same-origin' })
            .finally(() => {
              window.location.href = '/';
            });
        }
      });
    }

    // 绑定头像上传
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    const avatarFileInput = document.getElementById('avatarFileInput');
    
    if (changeAvatarBtn && avatarFileInput) {
      changeAvatarBtn.addEventListener('click', () => {
        avatarFileInput.click();
      });

      avatarFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          // 验证文件类型
          if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
          }
          // 验证文件大小（5MB限制）
          if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
          }
          uploadAvatar(file);
          // 重置input
          e.target.value = '';
        }
      });
    }

    // 绑定表单提交
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
      profileForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('profileUsername').value.trim();
        const phone = document.getElementById('profilePhone').value.trim();

        if (!username) {
          alert('Username is required');
          return;
        }

        try {
          const response = await fetch('/api/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify({
              username: username,
              phone: phone || null
            })
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update profile');
          }

          const data = await response.json();
          
          // 更新 window.CURRENT_USER
          window.CURRENT_USER = data.user;
          
          // 更新用户菜单
          if (typeof UserMenu !== 'undefined' && UserMenu.render) {
            UserMenu.render();
          }

          // 显示成功提示
          if (typeof Toast !== 'undefined') {
            Toast.show('Profile updated successfully!');
          } else {
            alert('Profile updated successfully!');
          }
        } catch (error) {
          console.error('Error updating profile:', error);
          alert('Failed to update profile: ' + error.message);
        }
      });
    }

    // 绑定添加地址按钮
    const addAddressBtn = document.getElementById('addAddressBtn');
    if (addAddressBtn) {
      addAddressBtn.addEventListener('click', function() {
        // 清空表单
        const addressForm = document.getElementById('addressForm');
        if (addressForm) {
          addressForm.reset();
        }
        document.getElementById('addressId').value = '';
        
        // 更新模态框标题
        const modalTitle = document.getElementById('addressModalLabel');
        if (modalTitle) {
          modalTitle.textContent = 'Add New Address';
        }
        
        // 显示模态框
        const modalElement = document.getElementById('addressModal');
        if (modalElement) {
          const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
          modal.show();
        }
      });
    }

    // 绑定地址表单提交
    const addressForm = document.getElementById('addressForm');
    if (addressForm) {
      addressForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const addressId = document.getElementById('addressId').value;
        const addressData = {
          title: document.getElementById('addressTitle').value.trim(),
          name: document.getElementById('addressRecipient').value.trim(),
          phone: document.getElementById('addressPhone').value.trim(),
          address: document.getElementById('addressLine').value.trim(),
          city: document.getElementById('addressCity').value.trim(),
          state: document.getElementById('addressState').value.trim(),
          zip: document.getElementById('addressZip').value.trim(),
          isDefault: document.getElementById('addressDefault').checked
        };

        saveAddress(addressData, addressId || null);
      });
    }

    // 绑定地址分页按钮
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    if (prevPageBtn) {
      prevPageBtn.addEventListener('click', goToPreviousPage);
    }
    if (nextPageBtn) {
      nextPageBtn.addEventListener('click', goToNextPage);
    }

    // 绑定订单分页按钮
    const prevOrderPageBtn = document.getElementById('prevOrderPageBtn');
    const nextOrderPageBtn = document.getElementById('nextOrderPageBtn');
    if (prevOrderPageBtn) {
      prevOrderPageBtn.addEventListener('click', goToPreviousOrderPage);
    }
    if (nextOrderPageBtn) {
      nextOrderPageBtn.addEventListener('click', goToNextOrderPage);
    }
  });
});
