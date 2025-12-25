// ==================== 菜单展示模块 ====================
// 依赖：data.js (需要 MENU_DATABASE)

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

