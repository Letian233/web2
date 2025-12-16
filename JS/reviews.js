// ==================== Bilibili 风格评论系统 ====================

// ==================== 初始评论数据 ====================
const INITIAL_REVIEWS = [
  {
    id: 1,
    author: "John Doe",
    text: "I had the pan-seared steak at this restaurant last night, and it was tender and juicy with perfect seasoning. The herb sauce added a delightful touch to the dish. The service was attentive, making for a pleasant dining experience.",
    date: "2023-12-10",
    likes: 5,
    likedBy: [],
    replies: [
      {
        id: 101,
        author: "Admin",
        text: "Thank you for your kind words! We're glad you enjoyed the steak.",
        date: "2023-12-10"
      }
    ]
  },
  {
    id: 2,
    author: "Emily Smith",
    text: "The seafood pasta was a delightful surprise, with fresh seafood perfectly combined with pasta, and a rich sauce that wasn't too heavy. Every bite was a taste of the ocean's freshness. The ambiance was comfortable, perfect for sharing a meal with family and friends.",
    date: "2023-12-08",
    likes: 8,
    likedBy: [],
    replies: [
      {
        id: 201,
        author: "Chef Marco",
        text: "We're thrilled you enjoyed it! The seafood is sourced fresh daily.",
        date: "2023-12-08"
      },
      {
        id: 202,
        author: "Emily Smith",
        text: "Looking forward to visiting again soon!",
        date: "2023-12-09"
      }
    ]
  },
  {
    id: 3,
    author: "Sarah Johnson",
    text: "Dessert lovers must not miss the chocolate lava cake, with a crust that's just right and a molten chocolate center that flows out, sweet but not too rich. The vanilla ice cream that comes with it is the cherry on top.",
    date: "2023-12-05",
    likes: 12,
    likedBy: [],
    replies: []
  },
  {
    id: 4,
    author: "David Wilson",
    text: "The roasted chicken had a crispy skin and juicy meat, seasoned just right to enhance the natural flavor of the chicken without overpowering it. The side dishes were also abundant, making it a satisfying main course overall.",
    date: "2023-12-03",
    likes: 6,
    likedBy: [],
    replies: []
  },
  {
    id: 5,
    author: "Liam Parker",
    text: "Loved the vegetarian options! The grilled veggie platter was fresh, well-seasoned, and came with a tangy dip that tied everything together.",
    date: "2023-12-02",
    likes: 4,
    likedBy: [],
    replies: [
      {
        id: 501,
        author: "Chef Marco",
        text: "Thanks for trying our veggie platter! We rotate seasonal vegetables weekly—hope to see you again.",
        date: "2023-12-03"
      }
    ]
  },
  {
    id: 6,
    author: "Olivia Brown",
    text: "The tiramisu was spot on—not too sweet, with a balanced coffee kick. Portion size was generous for sharing.",
    date: "2023-12-01",
    likes: 7,
    likedBy: [],
    replies: []
  },
  {
    id: 7,
    author: "Ethan Clark",
    text: "Great service and cozy ambience. The sourdough bread starter was warm and crusty, and the herb butter was addictive.",
    date: "2023-11-29",
    likes: 3,
    likedBy: [],
    replies: [
      {
        id: 701,
        author: "Admin",
        text: "Glad you enjoyed the bread! We bake it in-house every morning.",
        date: "2023-11-30"
      }
    ]
  }
];

// ==================== 评论管理器 ====================
const ReviewsManager = {
  // 获取唯一ID
  getNextId: function() {
    const reviews = this.getReviews();
    if (reviews.length === 0) return 1;
    return Math.max(...reviews.map(r => r.id)) + 1;
  },

  // 获取回复的唯一ID
  getNextReplyId: function() {
    const reviews = this.getReviews();
    let maxReplyId = 0;
    reviews.forEach(review => {
      if (review.replies && review.replies.length > 0) {
        const maxId = Math.max(...review.replies.map(r => r.id));
        if (maxId > maxReplyId) maxReplyId = maxId;
      }
    });
    return maxReplyId + 1;
  },

  // 获取用户唯一标识
  getUserIdentifier: function() {
    let userId = localStorage.getItem('reviewUserId');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('reviewUserId', userId);
    }
    return userId;
  },

  // 获取当前用户名（用于显示头像）
  getCurrentUserName: function() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const user = JSON.parse(currentUser);
        return user.username || 'U';
      } catch (e) {
        return 'U';
      }
    }
    return 'U';
  },

  // 从 localStorage 获取评论
  getReviews: function() {
    const stored = localStorage.getItem('epicEatsReviews');
    if (stored) {
      const existingReviews = JSON.parse(stored);
      // 检查是否需要合并新评论（如果 INITIAL_REVIEWS 中有新评论）
      const existingIds = new Set(existingReviews.map(r => r.id));
      const newReviews = INITIAL_REVIEWS.filter(r => !existingIds.has(r.id));
      if (newReviews.length > 0) {
        // 合并新评论到现有数据
        const mergedReviews = [...existingReviews, ...newReviews];
        // 按日期降序排序
        mergedReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
        this.saveReviews(mergedReviews);
        return mergedReviews;
      }
      return existingReviews;
    }
    this.saveReviews(INITIAL_REVIEWS);
    return INITIAL_REVIEWS;
  },

  // 保存评论到 localStorage
  saveReviews: function(reviews) {
    localStorage.setItem('epicEatsReviews', JSON.stringify(reviews));
  },

  // 添加新评论
  addReview: function(text) {
    const reviews = this.getReviews();
    const currentUser = this.getCurrentUserName();
    const newReview = {
      id: this.getNextId(),
      author: currentUser,
      text: text.trim(),
      date: new Date().toISOString().split('T')[0],
      likes: 0,
      likedBy: [],
      replies: []
    };
    reviews.unshift(newReview);
    this.saveReviews(reviews);
    return newReview;
  },

  // 切换点赞状态
  toggleLike: function(reviewId) {
    const reviews = this.getReviews();
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return false;

    const userId = this.getUserIdentifier();
    const index = review.likedBy.indexOf(userId);

    if (index > -1) {
      review.likedBy.splice(index, 1);
      review.likes--;
    } else {
      review.likedBy.push(userId);
      review.likes++;
    }

    this.saveReviews(reviews);
    return review.likes;
  },

  // 添加回复
  addReply: function(reviewId, text) {
    const reviews = this.getReviews();
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return null;

    const currentUser = this.getCurrentUserName();
    const newReply = {
      id: this.getNextReplyId(),
      author: currentUser,
      text: text.trim(),
      date: new Date().toISOString().split('T')[0]
    };

    if (!review.replies) {
      review.replies = [];
    }
    review.replies.push(newReply);
    this.saveReviews(reviews);
    return newReply;
  },

  // 检查用户是否已点赞
  isLiked: function(review) {
    const userId = this.getUserIdentifier();
    return review.likedBy && review.likedBy.indexOf(userId) > -1;
  },

  // 格式化日期
  formatDate: function(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  },

  // 获取头像首字母
  getAvatarLetter: function(name) {
    return name ? name.charAt(0).toUpperCase() : 'U';
  },

  // 渲染单个评论（B站风格）
  renderReview: function(review) {
    const isLiked = this.isLiked(review);
    const heartIcon = isLiked ? '❤️' : '🤍';
    const avatarLetter = this.getAvatarLetter(review.author);

    // 渲染子评论
    let repliesHtml = '';
    if (review.replies && review.replies.length > 0) {
      repliesHtml = '<div class="comment-replies">';
      review.replies.forEach(reply => {
        const replyAvatar = this.getAvatarLetter(reply.author);
        repliesHtml += `
          <div class="comment-reply-item">
            <div class="reply-avatar">${replyAvatar}</div>
            <div class="reply-content">
              <span class="reply-author">${this.escapeHtml(reply.author)}</span>
              <span class="reply-text">: ${this.escapeHtml(reply.text)}</span>
            </div>
          </div>
        `;
      });
      repliesHtml += '</div>';
    }

    return `
      <div class="bili-comment-item" data-review-id="${review.id}">
        <div class="comment-avatar">
          <div class="avatar-circle">${avatarLetter}</div>
        </div>
        <div class="comment-content">
          <div class="comment-author">${this.escapeHtml(review.author)}</div>
          <div class="comment-text">${this.escapeHtml(review.text)}</div>
          <div class="comment-info">
            <span class="comment-date">${this.formatDate(review.date)}</span>
            <button class="comment-like-btn ${isLiked ? 'liked' : ''}" data-review-id="${review.id}">
              <span class="like-icon">${heartIcon}</span>
              <span class="like-count">${review.likes}</span>
            </button>
            <button class="comment-reply-btn" data-review-id="${review.id}">Reply</button>
          </div>
          <div class="comment-reply-form" id="reply-form-${review.id}" style="display: none;">
            <textarea class="reply-textarea" placeholder="Write your reply..." rows="2"></textarea>
            <div class="reply-form-actions">
              <button type="button" class="reply-submit-btn" data-review-id="${review.id}">Submit</button>
              <button type="button" class="reply-cancel-btn" data-review-id="${review.id}">Cancel</button>
            </div>
          </div>
          ${repliesHtml}
        </div>
      </div>
    `;
  },

  // 渲染所有评论
  renderReviews: function() {
    const container = document.getElementById('reviews-list');
    if (!container) return;

    const reviews = this.getReviews();
    if (reviews.length === 0) {
      container.innerHTML = '<div class="no-reviews">No reviews yet. Be the first to comment!</div>';
      return;
    }

    let html = '';
    reviews.forEach(review => {
      html += this.renderReview(review);
    });
    container.innerHTML = html;

    // 绑定事件
    this.bindEvents();
  },

  // 更新当前用户头像
  updateUserAvatar: function() {
    const avatar = document.getElementById('currentUserAvatar');
    if (avatar) {
      const userName = this.getCurrentUserName();
      avatar.textContent = this.getAvatarLetter(userName);
    }
    const stickyAvatar = document.getElementById('stickyUserAvatar');
    if (stickyAvatar) {
      const userName = this.getCurrentUserName();
      stickyAvatar.textContent = this.getAvatarLetter(userName);
    }
  },

  // 初始化智能吸底评论栏（固定在浏览器窗口底部）
  initStickyBar: function() {
    const staticForm = document.getElementById('static-review-form');
    const stickyBar = document.getElementById('sticky-bottom-bar');
    const stickyInput = document.getElementById('sticky-review-text');
    const stickySubmit = document.getElementById('stickySubmitBtn');

    if (!staticForm || !stickyBar) return;

    // 监听静态表单在浏览器视口中的可见性
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // 静态表单可见，隐藏底部栏
          stickyBar.classList.remove('visible');
          stickyBar.setAttribute('aria-hidden', 'true');
        } else {
          // 静态表单不可见（离开视口），显示底部栏
          stickyBar.classList.add('visible');
          stickyBar.setAttribute('aria-hidden', 'false');
        }
      });
    }, {
      root: null, // 使用浏览器视口作为根容器
      threshold: 0 // 当静态表单完全离开视口时触发
    });

    observer.observe(staticForm);

    // 底部栏提交功能
    if (stickySubmit && stickyInput) {
      stickySubmit.addEventListener('click', () => {
        const text = stickyInput.value.trim();
        if (!text) {
          alert('Please enter your comment');
          return;
        }
        this.addReview(text);
        stickyInput.value = '';
        // 同步主输入框清空
        const mainInput = document.getElementById('review-text');
        if (mainInput) mainInput.value = '';
        this.renderReviews();
      });

      // Ctrl+Enter 快速发送
      stickyInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
          stickySubmit.click();
        }
      });
    }
  },

  // 绑定事件监听器
  bindEvents: function() {
    // 点赞按钮
    document.querySelectorAll('.comment-like-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const reviewId = parseInt(btn.getAttribute('data-review-id'));
        this.handleLike(reviewId);
      });
    });

    // 回复按钮
    document.querySelectorAll('.comment-reply-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const reviewId = parseInt(btn.getAttribute('data-review-id'));
        this.showReplyForm(reviewId);
      });
    });

    // 提交回复按钮
    document.querySelectorAll('.reply-submit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const reviewId = parseInt(btn.getAttribute('data-review-id'));
        this.handleReply(reviewId);
      });
    });

    // 取消回复按钮
    document.querySelectorAll('.reply-cancel-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const reviewId = parseInt(btn.getAttribute('data-review-id'));
        this.hideReplyForm(reviewId);
      });
    });
  },

  // 处理点赞
  handleLike: function(reviewId) {
    const newLikes = this.toggleLike(reviewId);
    const reviews = this.getReviews();
    const review = reviews.find(r => r.id === reviewId);
    
    if (review) {
      const isLiked = this.isLiked(review);
      const likeBtn = document.querySelector(`.comment-like-btn[data-review-id="${reviewId}"]`);
      const likeIcon = likeBtn.querySelector('.like-icon');
      const likeCount = likeBtn.querySelector('.like-count');

      if (isLiked) {
        likeBtn.classList.add('liked');
        likeIcon.textContent = '❤️';
      } else {
        likeBtn.classList.remove('liked');
        likeIcon.textContent = '🤍';
      }
      likeCount.textContent = newLikes;
    }
  },

  // 显示回复表单
  showReplyForm: function(reviewId) {
    document.querySelectorAll('.comment-reply-form').forEach(form => {
      form.style.display = 'none';
    });
    
    const form = document.getElementById(`reply-form-${reviewId}`);
    if (form) {
      form.style.display = 'block';
      form.querySelector('.reply-textarea').focus();
    }
  },

  // 隐藏回复表单
  hideReplyForm: function(reviewId) {
    const form = document.getElementById(`reply-form-${reviewId}`);
    if (form) {
      form.style.display = 'none';
      form.querySelector('.reply-textarea').value = '';
    }
  },

  // 处理回复
  handleReply: function(reviewId) {
    const form = document.getElementById(`reply-form-${reviewId}`);
    if (!form) return;

    const textInput = form.querySelector('.reply-textarea');
    const text = textInput.value.trim();

    if (!text) {
      alert('Please enter your reply');
      return;
    }

    this.addReply(reviewId, text);
    this.hideReplyForm(reviewId);
    this.renderReviews();
  },

  // HTML 转义
  escapeHtml: function(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // 初始化
  init: function() {
    // 更新用户头像
    this.updateUserAvatar();

    // 渲染评论
    this.renderReviews();

    // 初始化容器内智能吸底快速回复栏
    this.initStickyBar();

    // 绑定提交评论按钮
    const submitBtn = document.getElementById('submitReviewBtn');
    const textInput = document.getElementById('review-text');
    
    if (submitBtn && textInput) {
      submitBtn.addEventListener('click', () => {
        const text = textInput.value.trim();
        if (!text) {
          alert('Please enter your comment');
          return;
        }
        this.addReview(text);
        textInput.value = '';
        // 同步底部栏输入框清空
        const stickyInput = document.getElementById('sticky-review-text');
        if (stickyInput) stickyInput.value = '';
        this.renderReviews();
      });

      // 支持 Enter + Ctrl 提交
      textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
          submitBtn.click();
        }
      });
    }
  }
};

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', function() {
  ReviewsManager.init();
});

