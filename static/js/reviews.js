// ==================== Bilibili 风格评论系统 ====================

// ==================== 初始评论数据 ====================
// 现在评论完全来自数据库，前端不再内置任何静态示例评论。
// 后端通过 window.INITIAL_REVIEWS_FROM_DB 注入；未注入时默认为空列表。
// 注意：不要在这里直接读取 window.INITIAL_REVIEWS_FROM_DB（脚本加载顺序可能导致为 undefined），
// 真正的初始化逻辑放在 getReviews() 里面，运行时再读取。
const INITIAL_REVIEWS = [];

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
    // 优先使用后端登录用户（Flask session 注入的 CURRENT_USER）
    if (window.CURRENT_USER && window.CURRENT_USER.username) {
      return window.CURRENT_USER.username;
    }
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

  // 获取评论（优先使用内存中的缓存，初始值来自后端注入的 INITIAL_REVIEWS_FROM_DB）
  getReviews: function() {
    if (!this._reviews) {
      // 运行时读取 window.INITIAL_REVIEWS_FROM_DB，避免脚本加载顺序问题
      const source = window.INITIAL_REVIEWS_FROM_DB || INITIAL_REVIEWS;
      const base = Array.isArray(source) ? source.slice() : [];
      base.sort((a, b) => new Date(b.date) - new Date(a.date));
      this._reviews = base;
      }
    return this._reviews;
  },

  // 保存评论到内存缓存
  saveReviews: function(reviews) {
    this._reviews = reviews;
  },

  // 将后端返回的新主评论添加到本地列表
  addReview: function(serverReview) {
    const reviews = this.getReviews();
    const newReview = {
      id: serverReview.id,
      author: serverReview.author,
      text: serverReview.text,
      date: serverReview.date,
      likes: serverReview.likes || 0,
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
    if (!review) return { likes: 0, delta: 0 };

    const userId = this.getUserIdentifier();
    const index = review.likedBy.indexOf(userId);

    let delta = 0;

    if (index > -1) {
      review.likedBy.splice(index, 1);
      review.likes--;
      delta = -1;
    } else {
      review.likedBy.push(userId);
      review.likes++;
      delta = 1;
    }

    this.saveReviews(reviews);
    return { likes: review.likes, delta };
  },

  // 将后端返回的新回复插入到本地父评论的 replies 中
  addReply: function(parentId, serverReply) {
    const reviews = this.getReviews();
    const review = reviews.find(r => r.id === parentId);
    if (!review) return null;

    if (!review.replies) {
      review.replies = [];
    }

    const replyObj = {
      id: serverReply.id,
      author: serverReply.author,
      text: serverReply.text,
      date: serverReply.date
    };

    review.replies.push(replyObj);
    this.saveReviews(reviews);
    return replyObj;
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
            <textarea class="reply-textarea" placeholder="Write your reply..." rows="1" style="height: 100%;"></textarea>
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

    // 底部栏提交功能（点击按钮或按 Enter 时发送，Shift+Enter 换行）
    if (stickySubmit && stickyInput) {
      const sendStickyComment = () => {
        const text = stickyInput.value.trim();
        if (!text) {
          alert('Please enter your comment');
          return;
        }

        fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ content: text })
        })
          .then(res => res.json().then(data => ({ ok: res.ok, data })))
          .then(result => {
            if (!result.ok) {
              alert(result.data.error || 'Failed to submit comment');
              return;
            }
            // 用后端数据添加到本地列表
            ReviewsManager.addReview(result.data);
        stickyInput.value = '';
        const mainInput = document.getElementById('review-text');
        if (mainInput) mainInput.value = '';
            ReviewsManager.renderReviews();
          })
          .catch(() => {
            alert('Network error, please try again.');
      });
      };

      stickySubmit.addEventListener('click', sendStickyComment);

      stickyInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendStickyComment();
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

    // 提交回复按钮（点击发送回复）
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

    // 在回复输入框中按 Enter 直接发送，Shift+Enter 换行
    document.querySelectorAll('.comment-reply-form .reply-textarea').forEach(textarea => {
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const form = e.target.closest('.comment-reply-form');
          if (!form) return;
          const submitBtn = form.querySelector('.reply-submit-btn');
          if (submitBtn) {
            submitBtn.click();
          }
        }
      });
    });
  },

  // 处理点赞
  handleLike: function(reviewId) {
    const result = this.toggleLike(reviewId);
    const newLikes = result.likes;
    const delta = result.delta;
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

      // 将点赞变更同步到后端（仅聚合计数）
      if (delta !== 0) {
        try {
          fetch(`/api/reviews/${reviewId}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ delta })
          }).catch(() => {});
        } catch (e) {
          // 忽略网络错误
        }
      }
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

  // 处理回复（发送到后端并更新本地数据）
  handleReply: function(reviewId) {
    const form = document.getElementById(`reply-form-${reviewId}`);
    if (!form) return;

    const textInput = form.querySelector('.reply-textarea');
    const text = textInput.value.trim();

    if (!text) {
      alert('Please enter your reply');
      return;
    }

    // 先乐观地关闭表单
    this.hideReplyForm(reviewId);

    // 调用后端创建回复（复用 /api/reviews，传 parentId）
    fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ content: text, parentId: reviewId })
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(result => {
        if (!result.ok) {
          alert(result.data.error || 'Failed to submit reply');
          return;
        }
        // 使用后端返回的数据更新本地 replies 列表
        this.addReply(reviewId, result.data);
    this.renderReviews();
      })
      .catch(() => {
        alert('Network error, please try again.');
      });
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

    // 绑定提交评论按钮（点击按钮或按 Enter 发送，Shift+Enter 换行）
    const submitBtn = document.getElementById('submitReviewBtn');
    const textInput = document.getElementById('review-text');
    
    if (submitBtn && textInput) {
      const sendMainComment = () => {
        const text = textInput.value.trim();
        if (!text) {
          alert('Please enter your comment');
          return;
        }
        fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ content: text })
        })
          .then(res => res.json().then(data => ({ ok: res.ok, data })))
          .then(result => {
            if (!result.ok) {
              alert(result.data.error || 'Failed to submit comment');
              return;
            }
            // 用后端返回的数据添加到本地列表
            ReviewsManager.addReview(result.data);
        textInput.value = '';
        const stickyInput = document.getElementById('sticky-review-text');
            if (stickyInput) {
              stickyInput.value = '';
            }
            ReviewsManager.renderReviews();
          })
          .catch(() => {
            alert('Network error, please try again.');
          });
      };

      // 点击按钮发送
      submitBtn.addEventListener('click', sendMainComment);

      // 按 Enter 直接发送，Shift + Enter 换行
      textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMainComment();
        }
      });
    }
  }
};

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', function() {
  ReviewsManager.init();
});

