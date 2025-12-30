from datetime import datetime

from flask import render_template, session, request, jsonify
from sqlalchemy.exc import IntegrityError

from auth import db_session, User, Review, ReviewLike, AboutContent


def init_review_routes(app) -> None:
    """
    Register review page and review-related API routes.
    """

    # ===========================================================================
    # Review Page Route
    # ===========================================================================

    @app.route("/reviews")
    def reviews():
        """
        Review page: read main comments and replies from database,
        build nested structure for frontend.

        Important: queries review_likes table to get list of reviews
        liked by current logged-in user.
        This ensures that after page refresh,
        liked reviews correctly display heart icon.

        Time complexity: O(n + m), where n is number of reviews,
        m is current user's likes count
        """
        db = db_session()
        try:
            # Query all reviews (including author avatar)
            rows = (
                db.query(Review, User.username, User.avatar_url)
                .join(User, Review.user_id == User.id)
                .order_by(Review.date.asc())
                .all()
            )

            # Get list of review IDs liked by current logged-in user
            # Query from review_likes table, not from session
            user_id = session.get("user_id")
            liked_review_ids = set()

            if user_id:
                # Query all review IDs liked by current user
                liked_rows = (
                    db.query(ReviewLike.review_id)
                    .filter(ReviewLike.user_id == user_id)
                    .all()
                )
                liked_review_ids = {row[0] for row in liked_rows}
                print(
                    f"[reviews] User {user_id} liked reviews: "
                    f"{liked_review_ids}"
                )

            # Build comment dictionary
            items_by_id = {}
            for review, username, avatar_url in rows:
                # Check if current user has liked this review
                is_liked = review.id in liked_review_ids

                items_by_id[review.id] = {
                    "id": review.id,
                    "author": username or "User",
                    "avatar_url": avatar_url or "",  # Author avatar
                    "text": review.content,
                    "date": review.date.isoformat() if review.date else "",
                    "likes": review.likes_count or 0,
                    "likedBy": [],
                    # Mark whether current user has liked
                    "is_liked": is_liked,
                    "replies": [],
                    "parent_id": review.parent_id,
                }

            # Assemble into main comment + child replies structure
            # based on parent_id
            roots = []
            for item in items_by_id.values():
                parent_id = item.pop("parent_id", None)
                if parent_id:
                    parent = items_by_id.get(parent_id)
                    if parent:
                        parent.setdefault("replies", []).append(item)
                    else:
                        roots.append(item)
                else:
                    roots.append(item)

            # Main comments displayed in reverse chronological order
            roots.sort(
                key=lambda r: r.get("date") or "", reverse=True
            )

            # Get article list (for right sidebar display, randomly select 5)
            import random
            about_contents = db.query(AboutContent).order_by(
                AboutContent.id.asc()
            ).all()
            all_articles = []
            for content in about_contents:
                # Exclude Chef-related content
                # (only show article-type content)
                section_lower = content.section_name.lower()
                if not section_lower.startswith('chef'):
                    all_articles.append({
                        'id': content.id,
                        'section_name': content.section_name,
                        'title': content.title,
                        'image_url': content.image_url or '',
                        'updated_at': (
                            content.updated_at.strftime('%Y-%m-%d')
                            if content.updated_at else ''
                        )
                    })
            # Randomly select up to 5
            articles_list = (
                random.sample(all_articles, min(5, len(all_articles)))
                if all_articles else []
            )

        finally:
            db.close()

        return render_template(
            "reviews.html",
            initial_reviews=roots,
            articles_list=articles_list
        )

    # ===========================================================================
    # Create Review API
    # ===========================================================================

    @app.route("/api/reviews", methods=["POST"])
    def api_create_review():
        """
        Create new comment or reply.
        Requires user login.
        """
        if not session.get("user_id"):
            return jsonify(
                {"error": "You must be logged in to post a review."}
            ), 401

        data = request.get_json(silent=True) or {}
        content = (data.get("content") or "").strip()
        raw_parent = data.get("parentId") or data.get("parent_id")
        parent_id = None
        if raw_parent not in (None, "", 0, "0"):
            try:
                parent_id = int(raw_parent)
            except (TypeError, ValueError):
                parent_id = None

        if not content:
            return jsonify({"error": "Content is required."}), 400

        db = db_session()
        try:
            review = Review(
                user_id=session["user_id"],
                content=content,
                date=datetime.utcnow(),
                likes_count=0,
                parent_id=parent_id,
            )
            db.add(review)
            db.commit()
            db.refresh(review)

            user = db.query(User).get(session["user_id"])

            return jsonify(
                {
                    "id": review.id,
                    "author": user.username if user else "User",
                    # Author avatar
                    "avatar_url": user.avatar_url if user else "",
                    "text": review.content,
                    "date": review.date.isoformat(),
                    "likes": review.likes_count or 0,
                    # Newly created comment, current user hasn't liked yet
                    "is_liked": False,
                    "parent_id": review.parent_id,
                }
            )
        finally:
            db.close()

    @app.route("/like_review/<int:review_id>", methods=["POST"])
    def like_review(review_id: int):
        """
        Like/Unlike API - Toggle mode

        Process flow:
        1. Verify user is logged in
        2. Query review_likes table to check if already liked
        3. If liked: delete record, likes_count - 1
        4. If not liked: insert record, likes_count + 1
        5. Return JSON with is_liked and new_likes

        Args:
            review_id (int): Unique identifier for the review

        Returns:
            JSON response:
            - Success: {"status": "success", "is_liked": true/false,
                       "new_likes": <count>}
            - Not logged in: {"status": "error", "message": "...",
                             "need_login": true}
            - Failure: {"status": "error", "message": "..."}

        HTTP status codes:
            - 200: Operation successful
            - 401: User not logged in
            - 404: Review not found
            - 500: Internal server error
        """
        # Authentication
        user_id = session.get("user_id")
        if not user_id:
            return jsonify({
                "status": "error",
                "message": "Please login to like reviews.",
                "need_login": True
            }), 401

        db = db_session()
        try:
            # Query if review exists
            review = db.query(Review).filter(Review.id == review_id).first()

            if not review:
                return jsonify({
                    "status": "error",
                    "message": f"Review with ID {review_id} not found."
                }), 404

            # Query if already liked
            existing_like = (
                db.query(ReviewLike)
                .filter(
                    ReviewLike.user_id == user_id,
                    ReviewLike.review_id == review_id
                )
                .first()
            )

            current_likes = review.likes_count or 0

            # Toggle logic
            if existing_like:
                # Already liked -> unlike
                db.delete(existing_like)
                new_likes = max(0, current_likes - 1)
                review.likes_count = new_likes
                is_liked = False
                action = "unliked"
                print(
                    f"[like_review] User {user_id} unliked review "
                    f"{review_id}"
                )
            else:
                # Not liked -> add like
                # Double check: prevent duplicate insertion
                # from concurrent requests
                # Query again to ensure record doesn't exist
                # (handle concurrency)
                double_check = (
                    db.query(ReviewLike)
                    .filter(
                        ReviewLike.user_id == user_id,
                        ReviewLike.review_id == review_id
                    )
                    .first()
                )

                if double_check:
                    # If found existing (possibly concurrent request),
                    # treat as already liked
                    new_likes = current_likes
                    is_liked = True
                    action = "already_liked"
                    print(
                        f"[like_review] User {user_id} already liked "
                        f"review {review_id} (concurrent request)"
                    )
                else:
                    # Truly doesn't exist, perform insert
                    new_like = ReviewLike(
                        user_id=user_id,
                        review_id=review_id,
                        created_at=datetime.utcnow()
                    )
                    db.add(new_like)
                    new_likes = current_likes + 1
                    review.likes_count = new_likes
                    is_liked = True
                    action = "liked"
                    print(
                        f"[like_review] User {user_id} liked review "
                        f"{review_id}"
                    )

            # Commit transaction
            try:
                db.commit()
            except IntegrityError:
                # Catch uniqueness constraint error
                # (caused by concurrent requests)
                db.rollback()
                # Re-query current state
                final_check = (
                    db.query(ReviewLike)
                    .filter(
                        ReviewLike.user_id == user_id,
                        ReviewLike.review_id == review_id
                    )
                    .first()
                )

                if final_check:
                    # Record exists, treat as already liked
                    review = db.query(Review).filter(
                        Review.id == review_id
                    ).first()
                    current_likes = review.likes_count or 0
                    return jsonify({
                        "status": "success",
                        "is_liked": True,
                        "new_likes": current_likes,
                        "review_id": review_id,
                        "action": "already_liked",
                        "message": "Like already exists."
                    }), 200
                else:
                    # Other error, re-raise
                    raise

            # Return response
            return jsonify({
                "status": "success",
                "is_liked": is_liked,
                "new_likes": new_likes,
                "review_id": review_id,
                "action": action,
                "message": f"Review {action} successfully!"
            }), 200

        except Exception as e:
            db.rollback()
            print(f"[like_review] Error: {str(e)}")
            return jsonify({
                "status": "error",
                "message": f"An error occurred: {str(e)}"
            }), 500

        finally:
            db.close()

    @app.delete("/api/reviews/<int:review_id>")
    def api_delete_review(review_id: int):
        """
        Delete a review. Only the author can delete their own reviews.
        """
        user_id = session.get("user_id")
        if not user_id:
            return jsonify({"error": "Not logged in"}), 401

        db = db_session()
        try:
            # Check if review exists and belongs to current user
            review = (
                db.query(Review)
                .filter(Review.id == review_id, Review.user_id == user_id)
                .first()
            )

            if not review:
                return jsonify({
                    "error": "Review not found or not authorized"
                }), 404

            # Get all replies to this review
            replies = (
                db.query(Review)
                .filter(Review.parent_id == review_id)
                .all()
            )

            # Delete likes for all replies first
            if replies:
                reply_ids = [reply.id for reply in replies]
                db.query(ReviewLike).filter(
                    ReviewLike.review_id.in_(reply_ids)
                ).delete(synchronize_session=False)

            # Delete likes for the main review
            db.query(ReviewLike).filter(
                ReviewLike.review_id == review_id
            ).delete()

            # Delete all replies
            for reply in replies:
                db.delete(reply)

            # Delete the main review
            db.delete(review)
            db.commit()

            return jsonify({"ok": True})
        finally:
            db.close()
