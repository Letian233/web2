// ==================== Menu Display Module ====================
// Dependencies: data.js (requires MENU_DATABASE)
// Supports backend API filtering and sorting (uses quicksort algorithm)

// ==================== Menu Controller ====================
const MenuController = {
  currentPage: 1,
  itemsPerPage: 4,
  searchKeyword: '',
  filteredData: [],
  
  // Filter and sort state
  filters: {
    category: '',
    minPrice: null,
    maxPrice: null,
    sortBy: 'price',
    sortOrder: 'asc'
  },
  
  // Available categories and price range (fetched from API)
  availableCategories: [],
  priceRange: { min: 0, max: 100 },
  
  // Whether to use API (backend filtering and sorting)
  useApi: true,

  // Initialize
  init: function() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    // Filter controls
    const categoryFilter = document.getElementById('categoryFilter');
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    const sortBySelect = document.getElementById('sortBy');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');

    // Search box events
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

    // Pagination events
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
    
    // Filter control events
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
    
    // Auto-apply when sort dropdown changes
    if (sortBySelect) {
      sortBySelect.addEventListener('change', () => {
        this.applyFilters();
      });
    }
    
    // Filter toggle button click event
    this.initFilterToggle();

    // Initial load
    this.loadMenuFromApi();
  },
  
  // Initialize filter panel expand/collapse
  initFilterToggle: function() {
    const toggleBtn = document.getElementById('filterToggleBtn');
    const filterPanel = document.getElementById('filterPanel');
    
    if (toggleBtn && filterPanel) {
      toggleBtn.addEventListener('click', () => {
        const isExpanded = !filterPanel.classList.contains('collapsed');
        
        if (isExpanded) {
          // Collapse
          filterPanel.classList.add('collapsed');
          toggleBtn.classList.remove('active');
          toggleBtn.setAttribute('aria-expanded', 'false');
        } else {
          // Expand
          filterPanel.classList.remove('collapsed');
          toggleBtn.classList.add('active');
          toggleBtn.setAttribute('aria-expanded', 'true');
        }
      });
    }
  },
  
  // Load menu data from API (uses backend quicksort)
  loadMenuFromApi: async function() {
    try {
      // Build query parameters
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
      
      // Update data
      this.filteredData = data.items || [];
      this.availableCategories = data.categories || [];
      this.priceRange = data.price_range || { min: 0, max: 100 };
      
      // Update category dropdown
      this.updateCategorySelect();
      
      // Update filter status display
      this.updateFilterStatus(data.filters_applied, data.sort_applied);
      
      // Render menu
      this.renderMenu();
      
    } catch (error) {
      console.error('[MenuController] API error:', error);
      // Fallback to local data
      this.useLocalData();
    }
  },
  
  // Fallback to local data (without using API)
  useLocalData: function() {
    console.log('[MenuController] Falling back to local data');
    this.filteredData = MENU_DATABASE || [];
    this.renderMenu();
  },
  
  // Update category dropdown
  updateCategorySelect: function() {
    const categorySelect = document.getElementById('categoryFilter');
    if (!categorySelect) return;
    
    // Preserve current selected value
    const currentValue = categorySelect.value;
    
    // Clear and repopulate
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
  
  // Apply filters
  applyFilters: function() {
    const categorySelect = document.getElementById('categoryFilter');
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    const sortBySelect = document.getElementById('sortBy');
    
    // Read filter values
    this.filters.category = categorySelect ? categorySelect.value : '';
    this.filters.minPrice = minPriceInput && minPriceInput.value ? parseFloat(minPriceInput.value) : null;
    this.filters.maxPrice = maxPriceInput && maxPriceInput.value ? parseFloat(maxPriceInput.value) : null;
    
    // Read sort values
    if (sortBySelect) {
      const sortValue = sortBySelect.value;
      const [sortBy, sortOrder] = sortValue.split('-');
      this.filters.sortBy = sortBy;
      this.filters.sortOrder = sortOrder;
    }
    
    // Reset to first page
    this.currentPage = 1;
    
    // Call API
    this.loadMenuFromApi();
  },
  
  // Reset filters
  resetFilters: function() {
    // Reset state
    this.filters = {
      category: '',
      minPrice: null,
      maxPrice: null,
      sortBy: 'price',
      sortOrder: 'asc'
    };
    this.searchKeyword = '';
    this.currentPage = 1;
    
    // Reset UI
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
    
    // Reload
    this.loadMenuFromApi();
  },
  
  // Update filter status display
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

  // Render star rating
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

  // Render menu
  renderMenu: function() {
    const container = document.getElementById('menu-container');
    if (!container) return;

    const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const currentItems = this.filteredData.slice(startIndex, endIndex);

    // Generate HTML
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
        // Compatible with different property names (API returns image_url, local data uses image)
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

