from datetime import datetime

from flask import render_template, session, request, jsonify

from auth import SessionLocal, User, Review


def init_review_routes(app) -> None:
    """
    注册评论页和与评论相关的 API 路由。
    """

    @app.route("/reviews")
    def reviews():
        """
        评论页：从数据库读取主评论和回复，构建嵌套结构传给前端。
        reviews 表中：parent_id 为 NULL 表示主评论，非 NULL 表示回复。
        """
        db = SessionLocal()
        try:
            rows = (
                db.query(Review, User.username)
                .join(User, Review.user_id == User.id)
                .order_by(Review.date.asc())
                .all()
            )

            # 先把所有评论做成字典，方便通过 id 查找父评论
            items_by_id = {}
            for review, username in rows:
                items_by_id[review.id] = {
                    "id": review.id,
                    "author": username or "User",
                    "text": review.content,
                    "date": review.date.isoformat() if review.date else "",
                    "likes": review.likes_count or 0,
                    "likedBy": [],
                    "replies": [],
                    "parent_id": review.parent_id,
                }

            # 再根据 parent_id 组装成主评论 + 子回复的结构
            roots = []
            for item in items_by_id.values():
                parent_id = item.pop("parent_id", None)
                if parent_id:
                    parent = items_by_id.get(parent_id)
                    if parent:
                        parent.setdefault("replies", []).append(item)
                    else:
                        # 没找到父评论时，退化为主评论
                        roots.append(item)
                else:
                    roots.append(item)

            # 主评论按时间倒序显示
            roots.sort(key=lambda r: r.get("date") or "", reverse=True)

        finally:
            db.close()

        return render_template("reviews.html", initial_reviews=roots)

    @app.route("/api/reviews", methods=["POST"])
    def api_create_review():
        """Create a new review (or reply) for the currently logged-in user."""
        if not session.get("user_id"):
            return jsonify({"error": "You must be logged in to post a review."}), 401

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

        db = SessionLocal()
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
                    "text": review.content,
                    "date": review.date.isoformat(),
                    "likes": review.likes_count or 0,
                    "parent_id": review.parent_id,
                }
            )
        finally:
            db.close()

    @app.route("/api/reviews/<int:review_id>/like", methods=["POST"])
    def api_like_review(review_id: int):
        """Update likes_count for a review (aggregate like count only)."""
        data = request.get_json(silent=True) or {}
        try:
            delta = int(data.get("delta", 0))
        except (TypeError, ValueError):
            delta = 0

        if delta not in (-1, 0, 1):
            return jsonify({"error": "Invalid delta."}), 400

        db = SessionLocal()
        try:
            review = db.query(Review).get(review_id)
            if not review:
                return jsonify({"error": "Review not found."}), 404

            current = review.likes_count or 0
            new_count = max(0, current + delta)
            review.likes_count = new_count
            db.commit()

            return jsonify({"likes": new_count})
        finally:
            db.close()


