// ==================== 菜单展示模块 ====================
// 依赖：data.js (需要 MENU_DATABASE)
// 支持後端 API 過濾和排序（使用快速排序算法）

// ==================== 菜单控制器 ====================
const MenuController = {
  currentPage: 1,
  itemsPerPage: 4,
  searchKeyword: '',
  filteredData: [],
  
  // 過濾和排序狀態
  filters: {
    category: '',
    minPrice: null,
    maxPrice: null,
    sortBy: 'price',
    sortOrder: 'asc'
  },
  
  // 可用類別和價格範圍（從 API 獲取）
  availableCategories: [],
  priceRange: { min: 0, max: 100 },
  
  // 是否使用 API（後端過濾和排序）
  useApi: true,

  // 初始化
  init: function() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    // 過濾控件
    const categoryFilter = document.getElementById('categoryFilter');
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    const sortBySelect = document.getElementById('sortBy');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');

    // 搜索框事件
    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.searchKeyword = e.target.value.trim();
          this.currentPage = 1;
          this.loadMenuFromApi();
        }
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        this.searchKeyword = searchInput ? searchInput.value.trim() : '';
        this.currentPage = 1;
        this.loadMenuFromApi();
      });
    }

    // 分頁事件
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
    
    // 過濾控件事件
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener('click', () => {
        this.applyFilters();
      });
    }
    
    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener('click', () => {
        this.resetFilters();
      });
    }
    
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        this.resetFilters();
      });
    }
    
    // 排序下拉選單變化時自動應用
    if (sortBySelect) {
      sortBySelect.addEventListener('change', () => {
        this.applyFilters();
      });
    }
    
    // 漢堡過濾按鈕點擊事件
    this.initFilterToggle();

    // 初始加載
    this.loadMenuFromApi();
  },
  
  // 初始化過濾面板展開/收起
  initFilterToggle: function() {
    const toggleBtn = document.getElementById('filterToggleBtn');
    const filterPanel = document.getElementById('filterPanel');
    
    if (toggleBtn && filterPanel) {
      toggleBtn.addEventListener('click', () => {
        const isExpanded = !filterPanel.classList.contains('collapsed');
        
        if (isExpanded) {
          // 收起
          filterPanel.classList.add('collapsed');
          toggleBtn.classList.remove('active');
          toggleBtn.setAttribute('aria-expanded', 'false');
        } else {
          // 展開
          filterPanel.classList.remove('collapsed');
          toggleBtn.classList.add('active');
          toggleBtn.setAttribute('aria-expanded', 'true');
        }
      });
    }
  },
  
  // 從 API 加載菜單數據（使用後端快速排序）
  loadMenuFromApi: async function() {
    try {
      // 構建查詢參數
      const params = new URLSearchParams();
      
      if (this.filters.category) {
        params.append('category', this.filters.category);
      }
      if (this.filters.minPrice !== null && this.filters.minPrice !== '') {
        params.append('min_price', this.filters.minPrice);
      }
      if (this.filters.maxPrice !== null && this.filters.maxPrice !== '') {
        params.append('max_price', this.filters.maxPrice);
      }
      if (this.searchKeyword) {
        params.append('search', this.searchKeyword);
      }
      params.append('sort_by', this.filters.sortBy);
      params.append('sort_order', this.filters.sortOrder);
      
      const url = `/api/menu?${params.toString()}`;
      console.log('[MenuController] Loading from API:', url);
      
      const response = await fetch(url, {
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        throw new Error('Failed to load menu');
      }
      
      const data = await response.json();
      console.log('[MenuController] API response:', data);
      
      // 更新數據
      this.filteredData = data.items || [];
      this.availableCategories = data.categories || [];
      this.priceRange = data.price_range || { min: 0, max: 100 };
      
      // 更新類別下拉選單
      this.updateCategorySelect();
      
      // 更新過濾狀態顯示
      this.updateFilterStatus(data.filters_applied, data.sort_applied);
      
      // 渲染菜單
      this.renderMenu();
      
    } catch (error) {
      console.error('[MenuController] API error:', error);
      // 回退到本地數據
      this.useLocalData();
    }
  },
  
  // 回退到本地數據（不使用 API）
  useLocalData: function() {
    console.log('[MenuController] Falling back to local data');
    this.filteredData = MENU_DATABASE || [];
    this.renderMenu();
  },
  
  // 更新類別下拉選單
  updateCategorySelect: function() {
    const categorySelect = document.getElementById('categoryFilter');
    if (!categorySelect) return;
    
    // 保留當前選中值
    const currentValue = categorySelect.value;
    
    // 清空並重新填充
    categorySelect.innerHTML = '<option value="">All Categories</option>';
    
    this.availableCategories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      if (category === currentValue) {
        option.selected = true;
      }
      categorySelect.appendChild(option);
    });
  },
  
  // 應用過濾器
  applyFilters: function() {
    const categorySelect = document.getElementById('categoryFilter');
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    const sortBySelect = document.getElementById('sortBy');
    
    // 讀取過濾值
    this.filters.category = categorySelect ? categorySelect.value : '';
    this.filters.minPrice = minPriceInput && minPriceInput.value ? parseFloat(minPriceInput.value) : null;
    this.filters.maxPrice = maxPriceInput && maxPriceInput.value ? parseFloat(maxPriceInput.value) : null;
    
    // 讀取排序值
    if (sortBySelect) {
      const sortValue = sortBySelect.value;
      const [sortBy, sortOrder] = sortValue.split('-');
      this.filters.sortBy = sortBy;
      this.filters.sortOrder = sortOrder;
    }
    
    // 重置到第一頁
    this.currentPage = 1;
    
    // 調用 API
    this.loadMenuFromApi();
  },
  
  // 重置過濾器
  resetFilters: function() {
    // 重置狀態
    this.filters = {
      category: '',
      minPrice: null,
      maxPrice: null,
      sortBy: 'price',
      sortOrder: 'asc'
    };
    this.searchKeyword = '';
    this.currentPage = 1;
    
    // 重置 UI
    const searchInput = document.getElementById('searchInput');
    const categorySelect = document.getElementById('categoryFilter');
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    const sortBySelect = document.getElementById('sortBy');
    
    if (searchInput) searchInput.value = '';
    if (categorySelect) categorySelect.value = '';
    if (minPriceInput) minPriceInput.value = '';
    if (maxPriceInput) maxPriceInput.value = '';
    if (sortBySelect) sortBySelect.value = 'price-asc';
    
    // 重新加載
    this.loadMenuFromApi();
  },
  
  // 更新過濾狀態顯示
  updateFilterStatus: function(filtersApplied, sortApplied) {
    const statusDiv = document.getElementById('filterStatus');
    const statusText = document.getElementById('filterStatusText');
    
    if (!statusDiv || !statusText) return;
    
    const parts = [];
    
    if (filtersApplied) {
      if (filtersApplied.category) {
        parts.push(`Category: ${filtersApplied.category}`);
      }
      if (filtersApplied.min_price !== null) {
        parts.push(`Min: $${filtersApplied.min_price}`);
      }
      if (filtersApplied.max_price !== null) {
        parts.push(`Max: $${filtersApplied.max_price}`);
      }
      if (filtersApplied.search_query) {
        parts.push(`Search: "${filtersApplied.search_query}"`);
      }
    }
    
    if (sortApplied) {
      const sortByName = sortApplied.sort_by === 'price' ? 'Price' : 'Rating';
      const sortOrderName = sortApplied.sort_order === 'asc' ? '↑' : '↓';
      parts.push(`Sort: ${sortByName} ${sortOrderName}`);
    }
    
    if (parts.length > 0) {
      statusText.textContent = `Showing ${this.filteredData.length} items | ${parts.join(' | ')}`;
      statusDiv.style.display = 'flex';
    } else {
      statusDiv.style.display = 'none';
    }
  },

  // 渲染星级评分
  renderStars: function(rating) {
    let starsHtml = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    for (let i = 0; i < fullStars; i++) {
      starsHtml += '<img src="/static/images/star_full.png" class="noeffects" alt="star">';
    }
    if (hasHalfStar) {
      starsHtml += '<img src="/static/images/star_half_full.png" class="noeffects" alt="star">';
    }
    for (let i = 0; i < emptyStars; i++) {
      starsHtml += '<img src="/static/images/star_empty.png" class="noeffects" alt="star">';
    }
    return starsHtml;
  },

  // 渲染菜单
  renderMenu: function() {
    const container = document.getElementById('menu-container');
    if (!container) return;

    const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const currentItems = this.filteredData.slice(startIndex, endIndex);

    // 生成 HTML
    let menuHtml = '';
    
    if (currentItems.length === 0) {
      menuHtml = `
        <div class="menu-no-results">
          <h3>No items found</h3>
          <p>Try adjusting your filters or search terms.</p>
          <button class="button" onclick="MenuController.resetFilters()">Clear Filters</button>
        </div>
      `;
    } else {
      currentItems.forEach(item => {
        // 兼容不同的屬性名（API 返回 image_url，本地數據用 image）
        const imageUrl = item.image_url || item.image || '/static/images/blank.png';
        const price = parseFloat(item.price).toFixed(2);
        const rating = parseFloat(item.rating || 0);
        
        menuHtml += `
          <div class="menu-item">
            <div class="menu-header">
              <h3>${item.name}: $${price}</h3>
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
                <span class="menu-item-category">${item.category || ''}</span>
              </div>
            </div>
            <div class="border3 mt-3"></div>
          </div>
        `;
      });
    }

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

