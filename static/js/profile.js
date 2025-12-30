// ==================== Profile Page Functions ====================

// ==================== Tab Switching Logic ====================
function switchTab(tabName) {
  // Hide all tab content
  document.querySelectorAll('.tab-content-panel').forEach(panel => {
    panel.classList.remove('active');
  });

  // Show selected tab
  const targetTab = document.getElementById(tabName + 'Tab');
  if (targetTab) {
    targetTab.classList.add('active');
  }

  // Update sidebar link states
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('data-tab') === tabName) {
      link.classList.add('active');
    }
  });

  // Load data based on tab
  if (tabName === 'orders') {
    loadOrderHistory();
  } else if (tabName === 'addresses') {
    loadAddresses();
  } else if (tabName === 'profile') {
    loadUserProfile();
  }
}

// ==================== Load User Profile ====================
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
      
      // Update avatar display
      updateAvatarDisplay(user.avatar_url, user.username);
    }
  } catch (error) {
    console.error('Error loading profile:', error);
    // Use window.CURRENT_USER as fallback
    const currentUser = window.CURRENT_USER;
    if (currentUser) {
      document.getElementById('profileUsername').value = currentUser.username || '';
    document.getElementById('profileEmail').value = currentUser.email || '';
    document.getElementById('profilePhone').value = currentUser.phone || '';
      updateAvatarDisplay(currentUser.avatar_url, currentUser.username);
    }
  }
}

// ==================== Update Avatar Display ====================
function updateAvatarDisplay(avatarUrl, username) {
  const avatarDisplay = document.getElementById('profileAvatarDisplay');
  if (!avatarDisplay) return;

  // Ensure container has correct class name
  avatarDisplay.className = 'profile-avatar-display';

  if (avatarUrl) {
    // Has avatar: show image, fully fill circle
    avatarDisplay.innerHTML = `<img src="${avatarUrl}" alt="Avatar" class="profile-avatar-large">`;
  } else {
    // No avatar: show initial placeholder
    const initial = username ? username.charAt(0).toUpperCase() : 'U';
    avatarDisplay.textContent = initial;
    avatarDisplay.classList.add('profile-avatar-placeholder-large');
  }
}

// ==================== Upload Avatar ====================
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
    
    // Update display
    const currentUser = window.CURRENT_USER || {};
    currentUser.avatar_url = data.avatar_url;
    window.CURRENT_USER = currentUser;
    
    updateAvatarDisplay(data.avatar_url, currentUser.username);
    
    // Update user menu
    if (typeof UserMenu !== 'undefined' && UserMenu.render) {
      UserMenu.render();
    }

    // Show success message
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

// ==================== Load Order History ====================
async function loadOrderHistory() {
  try {
    const response = await fetch('/api/orders', {
      credentials: 'same-origin'
    });

    if (!response.ok) {
      throw new Error('Failed to load orders');
    }

    allOrders = await response.json();
    currentOrderPage = 1; // Reset to first page

    renderOrderHistory();
  } catch (error) {
    console.error('Error loading orders:', error);
    allOrders = [];
    renderOrderHistory();
  }
}

// ==================== Render Order History ====================
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

  // Calculate pagination
  const totalPages = Math.ceil(allOrders.length / ordersPerPage);
  const startIndex = (currentOrderPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const currentPageOrders = allOrders.slice(startIndex, endIndex);

  currentPageOrders.forEach((order, pageIndex) => {
    // Calculate global index (for accordion ID)
    const globalIndex = startIndex + pageIndex;
    
    // Create table row
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${order.orderId}</td>
      <td>${order.date}</td>
      <td>$${order.total.toFixed(2)}</td>
      <td><span class="order-status ${order.status.toLowerCase()}">${order.status.toUpperCase()}</span></td>
      <td><button class="button view-items-btn" data-order-index="${globalIndex}">View Items</button></td>
    `;
    tbody.appendChild(row);

    // Create Accordion item
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

  // Bind View Items button events
  document.querySelectorAll('.view-items-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const orderIndex = this.getAttribute('data-order-index');
      const accordionItem = document.getElementById(`accordion-${orderIndex}`);
      
      if (!accordionItem) return;
      
      // Close all other accordions
      document.querySelectorAll('.accordion-item').forEach(item => {
        if (item.id !== `accordion-${orderIndex}`) {
          item.style.display = 'none';
          const header = item.querySelector('.accordion-header');
          const content = item.querySelector('.accordion-content');
          if (header) header.classList.remove('active');
          if (content) content.classList.remove('active');
        }
      });

      // Toggle current accordion
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

  // Bind Accordion header click events
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
        // Close all others
        document.querySelectorAll('.accordion-content').forEach(c => c.classList.remove('active'));
        document.querySelectorAll('.accordion-header').forEach(h => h.classList.remove('active'));
        
        content.classList.add('active');
        this.classList.add('active');
      }
    });
  });

  // Update pagination controls
  updateOrderPagination(totalPages);
}

// ==================== Update Order Pagination Controls ====================
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

  // Update button states
  prevBtn.disabled = currentOrderPage === 1;
  nextBtn.disabled = currentOrderPage === totalPages;

  // Update pagination info
  infoSpan.textContent = `Page ${currentOrderPage} of ${totalPages}`;
}

// ==================== Order Previous Page ====================
function goToPreviousOrderPage() {
  if (currentOrderPage > 1) {
    currentOrderPage--;
    renderOrderHistory();
    // Scroll to top
    const tbody = document.getElementById('orderHistoryTableBody');
    if (tbody) {
      tbody.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

// ==================== Order Next Page ====================
function goToNextOrderPage() {
  const totalPages = Math.ceil(allOrders.length / ordersPerPage);
  if (currentOrderPage < totalPages) {
    currentOrderPage++;
    renderOrderHistory();
    // Scroll to top
    const tbody = document.getElementById('orderHistoryTableBody');
    if (tbody) {
      tbody.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

// ==================== Address Pagination State ====================
let allAddresses = [];
let currentAddressPage = 1;
const addressesPerPage = 4;

// ==================== Order Pagination State ====================
let allOrders = [];
let currentOrderPage = 1;
const ordersPerPage = 4;

// ==================== Load Addresses ====================
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
    
    // If current page has no addresses, adjust to appropriate page number
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

// ==================== Render Addresses ====================
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

  // Calculate pagination
  const totalPages = Math.ceil(allAddresses.length / addressesPerPage);
  const startIndex = (currentAddressPage - 1) * addressesPerPage;
  const endIndex = startIndex + addressesPerPage;
  const currentPageAddresses = allAddresses.slice(startIndex, endIndex);

  // Render addresses for current page
  currentPageAddresses.forEach(address => {
    const card = document.createElement('div');
    card.className = `address-card ${address.is_default ? 'default' : ''}`;
    
    // Ensure address.id is correctly converted to string
    const addressId = String(address.id || '');
    
    // Build button HTML
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

  // Bind button events
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

  // Update pagination controls
  updatePagination(totalPages);
}

// ==================== Update Pagination Controls ====================
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

  // Update button states
  prevBtn.disabled = currentAddressPage === 1;
  nextBtn.disabled = currentAddressPage === totalPages;

  // Update pagination info
  infoSpan.textContent = `Page ${currentAddressPage} of ${totalPages}`;
}

// ==================== Previous Page ====================
function goToPreviousPage() {
  if (currentAddressPage > 1) {
    currentAddressPage--;
    renderAddresses();
    // Scroll to top
    const container = document.getElementById('addressCardsContainer');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

// ==================== Next Page ====================
function goToNextPage() {
  const totalPages = Math.ceil(allAddresses.length / addressesPerPage);
  if (currentAddressPage < totalPages) {
    currentAddressPage++;
    renderAddresses();
    // Scroll to top
    const container = document.getElementById('addressCardsContainer');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

// ==================== Address Management Functions ====================
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

    // Reload address list
    await loadAddresses();

    // Close modal
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

    // Reload addresses after deletion
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

    // Reload address list to update display
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

    // Populate form
    document.getElementById('addressId').value = address.id;
    document.getElementById('addressTitle').value = address.title;
    document.getElementById('addressRecipient').value = address.recipient_name;
    document.getElementById('addressPhone').value = address.phone;
    document.getElementById('addressLine').value = address.address_line;
    document.getElementById('addressCity').value = address.city;
    document.getElementById('addressState').value = address.state;
    document.getElementById('addressZip').value = address.zip_code;
    document.getElementById('addressDefault').checked = address.is_default;

    // Update modal title
    const modalTitle = document.getElementById('addressModalLabel');
    if (modalTitle) {
      modalTitle.textContent = 'Edit Address';
    }

    // Show modal
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

// ==================== Initialization ====================
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in (prioritize window.CURRENT_USER, set by pages.js from template)
  const currentUser = window.CURRENT_USER;
  if (!currentUser || (!currentUser.username && !currentUser.id)) {
    // Not logged in, redirect to login page
    window.location.href = '/login';
    return;
  }

  // Use requestAnimationFrame to delay execution, avoid conflict with UserMenu.render()
  requestAnimationFrame(function() {
    // Load user profile
    loadUserProfile();

    // Bind sidebar link click events
    document.querySelectorAll('.sidebar-link').forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const tabName = this.getAttribute('data-tab');
        if (tabName) {
          switchTab(tabName);
        }
      });
    });

    // Bind logout link
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

    // Bind avatar upload
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    const avatarFileInput = document.getElementById('avatarFileInput');
    
    if (changeAvatarBtn && avatarFileInput) {
      changeAvatarBtn.addEventListener('click', () => {
        avatarFileInput.click();
      });

      avatarFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          // Validate file type
          if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
          }
          // Validate file size (5MB limit)
          if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
          }
          uploadAvatar(file);
          // Reset input
          e.target.value = '';
        }
      });
    }

    // Bind form submission
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
          
          // Update window.CURRENT_USER
          window.CURRENT_USER = data.user;
          
          // Update user menu
          if (typeof UserMenu !== 'undefined' && UserMenu.render) {
            UserMenu.render();
          }
        
        // Show success message
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

    // Bind add address button
    const addAddressBtn = document.getElementById('addAddressBtn');
    if (addAddressBtn) {
      addAddressBtn.addEventListener('click', function() {
        // Clear form
        const addressForm = document.getElementById('addressForm');
        if (addressForm) {
          addressForm.reset();
        }
        document.getElementById('addressId').value = '';
        
        // Update modal title
        const modalTitle = document.getElementById('addressModalLabel');
        if (modalTitle) {
          modalTitle.textContent = 'Add New Address';
        }
        
        // Show modal
        const modalElement = document.getElementById('addressModal');
        if (modalElement) {
          const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
          modal.show();
        }
      });
    }

    // Bind address form submission
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

    // Bind address pagination buttons
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    if (prevPageBtn) {
      prevPageBtn.addEventListener('click', goToPreviousPage);
    }
    if (nextPageBtn) {
      nextPageBtn.addEventListener('click', goToNextPage);
    }

    // Bind order pagination buttons
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
