// Track whether each review's like button is in cooldown period
const likeDebounceState = {};

// Request tracker in progress - prevent concurrent requests
const likeRequestInProgress = {};

const DEBOUNCE_COOLDOWN_MS = 300;

/**
 * @param {number} reviewId - 要點讚的評論 ID
 * @returns {Promise<void>}
 */
async function likeReview(reviewId) {
    // Only check if there's a request in progress, don't check debounce state (allow rapid toggling)
    if (likeRequestInProgress[reviewId]) {
        console.log(`[likeReview] Review ${reviewId} has request in progress, ignoring click.`);
        return;
    }
    
    // Set request in progress flag (prevent concurrent requests)
    likeRequestInProgress[reviewId] = true;
    
    // Get DOM elements and show loading state
    const likeBtn = document.querySelector(`.like-btn[data-review-id="${reviewId}"]`);
    const likeCountSpan = document.getElementById(`like-count-${reviewId}`);
    
    // Save current state (for optimistic update)
    const currentIsLiked = likeBtn ? likeBtn.classList.contains('liked') : false;
    const currentLikes = likeCountSpan ? parseInt(likeCountSpan.textContent) || 0 : 0;
    
    // Optimistic update: immediately toggle UI state (will revert in catch if backend fails)
    if (likeBtn && likeCountSpan) {
        const likeIcon = likeBtn.querySelector('.like-icon');
        const newIsLiked = !currentIsLiked;
        const newLikes = newIsLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
        
        // Immediately update UI
        if (newIsLiked) {
            likeBtn.classList.add('liked');
            if (likeIcon) likeIcon.textContent = '❤️';
            likeBtn.title = 'Click to unlike';
        } else {
            likeBtn.classList.remove('liked');
            if (likeIcon) likeIcon.textContent = '🤍';
            likeBtn.title = 'Click to like';
        }
        likeCountSpan.textContent = newLikes;
    }
    
    if (likeBtn) {
        likeBtn.disabled = true;
        likeBtn.classList.add('loading');
    }
    
    try {
        // Send Fetch request
        const response = await fetch(`/like_review/${reviewId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'same-origin'
        });
        
        const data = await response.json();
        
        // Handle not logged in case
        if (response.status === 401 && data.need_login) {
            // Revert optimistic update state
            if (likeBtn && likeCountSpan) {
                const likeIcon = likeBtn.querySelector('.like-icon');
                if (currentIsLiked) {
                    likeBtn.classList.add('liked');
                    if (likeIcon) likeIcon.textContent = '❤️';
                    likeBtn.title = 'Click to unlike';
                } else {
                    likeBtn.classList.remove('liked');
                    if (likeIcon) likeIcon.textContent = '🤍';
                    likeBtn.title = 'Click to like';
                }
                likeCountSpan.textContent = currentLikes;
            }
            // Show alert and redirect to login page
            const shouldLogin = confirm('Please login to like reviews. Go to login page?');
            if (shouldLogin) {
                window.location.href = '/login';
            }
            return;
        }
        
        // Handle successful response - Toggle logic
        if (response.ok && data.status === 'success') {
            const isLiked = data.is_liked;
            const action = data.action;
            const isAlreadyLiked = action === 'already_liked';
            
            if (isAlreadyLiked) {
                console.log(`[likeReview] Review ${reviewId} already liked (concurrent request handled).`);
            } else {
                console.log(`[likeReview] Success! Review ${reviewId} ${action}. New likes: ${data.new_likes}`);
            }
            
            // Update button state and icon (force update to ensure correct state)
            if (likeBtn) {
                const likeIcon = likeBtn.querySelector('.like-icon');
                
                // Force remove all state classes, then re-add correct state
                likeBtn.classList.remove('liked');
                
                if (isLiked) {
                    // Like successful: show red heart
                    likeBtn.classList.add('liked');
                    if (likeIcon) likeIcon.textContent = '❤️';
                    likeBtn.title = 'Click to unlike';
                } else {
                    // Unlike: show white heart (ensure removed)
                    if (likeIcon) likeIcon.textContent = '🤍';
                    likeBtn.title = 'Click to like';
                }
                
                // Force browser repaint to ensure state update
                void likeBtn.offsetHeight;
                
                // Only play animation if not already_liked
                if (!isAlreadyLiked) {
                    requestAnimationFrame(() => {
                        const animClass = isLiked ? 'liked-animation' : 'unliked-animation';
                        likeBtn.classList.add(animClass);
                        setTimeout(() => {
                            likeBtn.classList.remove(animClass);
                        }, 400);
                    });
                }
            }
            
            // Update like count
            if (likeCountSpan) {
                likeCountSpan.textContent = data.new_likes;
                // Only play animation if not already_liked
                if (!isAlreadyLiked) {
                    requestAnimationFrame(() => {
                        const countClass = isLiked ? 'like-count-updated' : 'like-count-downdated';
                        likeCountSpan.classList.add(countClass);
                        setTimeout(() => {
                            likeCountSpan.classList.remove(countClass);
                        }, 300);
                    });
                }
            }
            
            // Sync update ReviewsManager local data
            if (typeof ReviewsManager !== 'undefined' && ReviewsManager._reviews) {
                const review = ReviewsManager._reviews.find(r => r.id === reviewId);
                if (review) {
                    review.likes = data.new_likes;
                    review.is_liked = isLiked;
                }
            }
            
        } else {
            // Other errors: revert optimistic update state
            console.error(`[likeReview] Error: ${data.message || 'Unknown error'}`);
            if (likeBtn && likeCountSpan) {
                const likeIcon = likeBtn.querySelector('.like-icon');
                if (currentIsLiked) {
                    likeBtn.classList.add('liked');
                    if (likeIcon) likeIcon.textContent = '❤️';
                    likeBtn.title = 'Click to unlike';
                } else {
                    likeBtn.classList.remove('liked');
                    if (likeIcon) likeIcon.textContent = '🤍';
                    likeBtn.title = 'Click to like';
                }
                likeCountSpan.textContent = currentLikes;
            }
            alert(data.message || 'Failed to process like. Please try again.');
        }
        
    } catch (error) {
        console.error('[likeReview] Network error:', error);
        
        // Revert optimistic update state (network error)
        if (likeBtn && likeCountSpan) {
            const likeIcon = likeBtn.querySelector('.like-icon');
            if (currentIsLiked) {
                likeBtn.classList.add('liked');
                if (likeIcon) likeIcon.textContent = '❤️';
                likeBtn.title = 'Click to unlike';
            } else {
                likeBtn.classList.remove('liked');
                if (likeIcon) likeIcon.textContent = '🤍';
                likeBtn.title = 'Click to like';
            }
            likeCountSpan.textContent = currentLikes;
        }
        
        alert('Network error. Please check your connection and try again.');
        
    } finally {
        // Cleanup state
        // Immediately clear request in progress flag, allow next operation (but keep brief debounce)
        likeRequestInProgress[reviewId] = false;
        
        if (likeBtn) {
            likeBtn.disabled = false;
            likeBtn.classList.remove('loading');
        }
        
        // Brief debounce: prevent rapid repeated clicks (300ms)
        likeDebounceState[reviewId] = true;
        setTimeout(() => {
            likeDebounceState[reviewId] = false;
        }, DEBOUNCE_COOLDOWN_MS);
    }
}

// Expose likeReview function to global scope
window.likeReview = likeReview;

/**
 * Delete a review. Only the author can delete their own reviews.
 * @param {number} reviewId - The ID of the review to delete
 */
async function deleteReview(reviewId) {
    // Save the review data in case we need to restore it
    const reviews = ReviewsManager.getReviews();
    const reviewToDelete = reviews.find(r => r.id === reviewId);
    
    // Optimistic UI update: immediately remove from DOM with fade animation
    const reviewElement = document.querySelector(`[data-review-id="${reviewId}"]`);
    if (reviewElement) {
        reviewElement.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        reviewElement.style.opacity = '0';
        reviewElement.style.transform = 'translateX(-20px)';
        setTimeout(() => {
            if (reviewElement.parentNode) {
                reviewElement.remove();
            }
        }, 200);
    }

    // Remove from memory immediately
    ReviewsManager.removeReview(reviewId);

    try {
        const response = await fetch(`/api/reviews/${reviewId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'same-origin'
        });

        const data = await response.json();

        if (response.ok && data.ok) {
            // Show success message
            if (window.Toast) {
                window.Toast.show('Review deleted successfully');
            }
        } else {
            // Handle errors - restore UI if deletion failed
            if (response.status === 401) {
                alert('Please log in to delete reviews.');
                window.location.href = '/login';
                // Restore the review
                if (reviewToDelete) {
                    const reviews = ReviewsManager.getReviews();
                    reviews.push(reviewToDelete);
                    reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
                    ReviewsManager.saveReviews(reviews);
                    ReviewsManager.renderReviews();
                }
            } else {
                // Restore the review on error
                if (reviewToDelete) {
                    const reviews = ReviewsManager.getReviews();
                    reviews.push(reviewToDelete);
                    reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
                    ReviewsManager.saveReviews(reviews);
                }
                ReviewsManager.renderReviews();
                alert(data.error || 'Failed to delete review. Please try again.');
            }
        }
    } catch (error) {
        console.error('Error deleting review:', error);
        // Restore the review on network error
        if (reviewToDelete) {
            const reviews = ReviewsManager.getReviews();
            reviews.push(reviewToDelete);
            reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
            ReviewsManager.saveReviews(reviews);
        }
        ReviewsManager.renderReviews();
        alert('An error occurred while deleting the review. Please try again.');
    }
}

// Expose deleteReview function to global scope
window.deleteReview = deleteReview;

const INITIAL_REVIEWS = [];

// ==================== Review Manager ====================
const ReviewsManager = {
  // Get unique ID
  getNextId: function() {
    const reviews = this.getReviews();
    if (reviews.length === 0) return 1;
    return Math.max(...reviews.map(r => r.id)) + 1;
  },

  // Get unique ID for reply
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

  // Get user unique identifier
  getUserIdentifier: function() {
    let userId = localStorage.getItem('reviewUserId');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('reviewUserId', userId);
    }
    return userId;
  },

  // Get current username (for displaying avatar)
  getCurrentUserName: function() {
    // Prioritize backend logged-in user (CURRENT_USER injected by Flask session)
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

  // Get reviews (prioritize in-memory cache, initial value from backend-injected INITIAL_REVIEWS_FROM_DB)
  getReviews: function() {
    if (!this._reviews) {
      // Read window.INITIAL_REVIEWS_FROM_DB at runtime to avoid script loading order issues
      const source = window.INITIAL_REVIEWS_FROM_DB || INITIAL_REVIEWS;
      const base = Array.isArray(source) ? source.slice() : [];
      base.sort((a, b) => new Date(b.date) - new Date(a.date));
      this._reviews = base;
      }
    return this._reviews;
  },

  // Save reviews to memory cache
  saveReviews: function(reviews) {
    this._reviews = reviews;
  },

  // Add new main review returned from backend to local list
  addReview: function(serverReview) {
    const reviews = this.getReviews();
    const newReview = {
      id: serverReview.id,
      author: serverReview.author,
      avatar_url: serverReview.avatar_url || "",  // Author avatar
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

  // Remove a review from memory (including all its replies)
  removeReview: function(reviewId) {
    const reviews = this.getReviews();
    const filtered = reviews.filter(review => review.id !== reviewId);
    this.saveReviews(filtered);
  },

  // Toggle like state
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

  // Insert new reply returned from backend into local parent review's replies
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
      avatar_url: serverReply.avatar_url || "",  // Reply author avatar
      text: serverReply.text,
      date: serverReply.date
    };

    review.replies.push(replyObj);
    this.saveReviews(reviews);
    return replyObj;
  },

  // Check if user has liked
  // Prioritize backend-returned is_liked field (still valid after page refresh)
  // If no is_liked, fallback to checking likedBy array
  isLiked: function(review) {
    // Prioritize backend-returned is_liked field (based on session)
    if (review.hasOwnProperty('is_liked')) {
      return review.is_liked === true;
    }
    
    // Fallback: check likedBy array (for dynamically added reviews)
    const userId = this.getUserIdentifier();
    return review.likedBy && review.likedBy.indexOf(userId) > -1;
  },

  // Format date
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

  // Get avatar initial letter
  getAvatarLetter: function(name) {
    return name ? name.charAt(0).toUpperCase() : 'U';
  },

  // Render avatar (show image if avatar_url exists, otherwise show initial letter)
  renderAvatar: function(author, avatarUrl) {
    const letter = this.getAvatarLetter(author);
    if (avatarUrl && avatarUrl.trim()) {
      return `<img src="${this.escapeHtml(avatarUrl)}" alt="${this.escapeHtml(author)}" class="avatar-img">`;
    }
    return letter;
  },

  // Render single review
  // Like button uses onclick="likeReview(id)" to trigger AJAX request
  // Each button has unique id="like-btn-{reviewId}" and data-review-id attribute
  renderReview: function(review) {
    const isLiked = this.isLiked(review);
    const heartIcon = isLiked ? '❤️' : '🤍';
    const avatarContent = this.renderAvatar(review.author, review.avatar_url);

    // Check if current user is the author of this review
    const currentUser = window.CURRENT_USER;
    const isCurrentUser = currentUser && currentUser.username === review.author;
    const deleteButton = isCurrentUser ? `<button class="comment-delete-btn" data-review-id="${review.id}" onclick="deleteReview(${review.id})" title="Delete this review">🗑️</button>` : '';

    // Render child comments
    let repliesHtml = '';
    if (review.replies && review.replies.length > 0) {
      repliesHtml = '<div class="comment-replies">';
      review.replies.forEach(reply => {
        const replyAvatarContent = this.renderAvatar(reply.author, reply.avatar_url);
        repliesHtml += `
          <div class="comment-reply-item">
            <div class="reply-avatar">${replyAvatarContent}</div>
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
          <div class="avatar-circle">${avatarContent}</div>
        </div>
        <div class="comment-content">
          <div class="comment-author">${this.escapeHtml(review.author)}</div>
          <div class="comment-text">${this.escapeHtml(review.text)}</div>
          <div class="comment-info">
            <span class="comment-date">${this.formatDate(review.date)}</span>
            
            <!-- AJAX like button - Toggle mode: like/unlike -->
            <button 
              type="button"
              id="like-btn-${review.id}"
              class="comment-like-btn like-btn ${isLiked ? 'liked' : ''}" 
              data-review-id="${review.id}"
              onclick="likeReview(${review.id})"
              title="${isLiked ? 'Click to unlike' : 'Click to like'}"
            >
              <span class="like-icon">${heartIcon}</span>
              <span class="like-count" id="like-count-${review.id}">${review.likes}</span>
            </button>
            
            <button class="comment-reply-btn" data-review-id="${review.id}">Reply</button>
            ${deleteButton}
          </div>
          <div class="comment-reply-form" id="reply-form-${review.id}" style="display: none;">
            <label for="reply-textarea-${review.id}" class="visually-hidden">Reply</label>
            <textarea 
              id="reply-textarea-${review.id}"
              class="reply-textarea" 
              placeholder="Write your reply..." 
              rows="1" 
              style="height: 100%;"
            ></textarea>
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

  // Render all reviews
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

    // Bind events
    this.bindEvents();
  },

  // Update current user avatar
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

  // Initialize smart sticky comment bar (fixed at bottom of browser window)
  initStickyBar: function() {
    const staticForm = document.getElementById('static-review-form');
    const stickyBar = document.getElementById('sticky-bottom-bar');
    const stickyInput = document.getElementById('sticky-review-text');
    const stickySubmit = document.getElementById('stickySubmitBtn');

    if (!staticForm || !stickyBar) return;

    // Monitor static form visibility in browser viewport
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Static form visible, hide bottom bar
          stickyBar.classList.remove('visible');
          stickyBar.setAttribute('aria-hidden', 'true');
        } else {
          // Static form not visible (left viewport), show bottom bar
          stickyBar.classList.add('visible');
          stickyBar.setAttribute('aria-hidden', 'false');
        }
      });
    }, {
      root: null, // Use browser viewport as root container
      threshold: 0 // Trigger when static form completely leaves viewport
    });

    observer.observe(staticForm);

    // Bottom bar submit function (send on button click or Enter, Shift+Enter for new line)
    if (stickySubmit && stickyInput) {
      const sendStickyComment = () => {
        // Check login status
        if (typeof UserMenu !== 'undefined' && !UserMenu.requireLogin()) {
          return; // Not logged in, already redirected to login page
        }
        
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
            // Add to local list using backend data
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

  // Bind event listeners
  bindEvents: function() {
    // Like button
    document.querySelectorAll('.comment-like-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const reviewId = parseInt(btn.getAttribute('data-review-id'));
        this.handleLike(reviewId);
      });
    });

    // Reply button
    document.querySelectorAll('.comment-reply-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const reviewId = parseInt(btn.getAttribute('data-review-id'));
        this.showReplyForm(reviewId);
      });
    });

    // Submit reply button (click to send reply)
    document.querySelectorAll('.reply-submit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const reviewId = parseInt(btn.getAttribute('data-review-id'));
        this.handleReply(reviewId);
      });
    });

    // Cancel reply button
    document.querySelectorAll('.reply-cancel-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const reviewId = parseInt(btn.getAttribute('data-review-id'));
        this.hideReplyForm(reviewId);
      });
    });

    // Press Enter in reply input to send directly, Shift+Enter for new line
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

  // Handle like
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

      // Sync like changes to backend using new API
      if (delta !== 0) {
        try {
          fetch(`/like_review/${reviewId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin'
          }).catch(() => {});
        } catch (e) {
          // Ignore network errors
        }
      }
    }
  },

  // Show reply form
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

  // Hide reply form
  hideReplyForm: function(reviewId) {
    const form = document.getElementById(`reply-form-${reviewId}`);
    if (form) {
      form.style.display = 'none';
      form.querySelector('.reply-textarea').value = '';
    }
  },

  // Handle reply (send to backend and update local data)
  handleReply: function(reviewId) {
    // Check login status
    if (typeof UserMenu !== 'undefined' && !UserMenu.requireLogin()) {
      return; // Not logged in, already redirected to login page
    }
    
    const form = document.getElementById(`reply-form-${reviewId}`);
    if (!form) return;

    const textInput = form.querySelector('.reply-textarea');
    const text = textInput.value.trim();

    if (!text) {
      alert('Please enter your reply');
      return;
    }

    // Optimistically close form first
    this.hideReplyForm(reviewId);

    // Call backend to create reply (reuse /api/reviews, pass parentId)
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
        // Update local replies list using backend-returned data
        this.addReply(reviewId, result.data);
    this.renderReviews();
      })
      .catch(() => {
        alert('Network error, please try again.');
      });
  },

  // HTML escape
  escapeHtml: function(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // Initialize
  init: function() {
    // Update user avatar
    this.updateUserAvatar();

    // Render reviews
    this.renderReviews();

    // Initialize smart sticky quick reply bar in container
    this.initStickyBar();

    // Bind submit comment button (click button or press Enter to send, Shift+Enter for new line)
    const submitBtn = document.getElementById('submitReviewBtn');
    const textInput = document.getElementById('review-text');
    
    if (submitBtn && textInput) {
      const sendMainComment = () => {
        // Check login status
        if (typeof UserMenu !== 'undefined' && !UserMenu.requireLogin()) {
          return; // Not logged in, already redirected to login page
        }
        
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
            // Add to local list using backend-returned data
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

      // Click button to send
      submitBtn.addEventListener('click', sendMainComment);

      // Press Enter to send directly, Shift + Enter for new line
      textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMainComment();
        }
      });
    }
  }
};

// ==================== Initialization ====================
document.addEventListener('DOMContentLoaded', function() {
  ReviewsManager.init();
});

