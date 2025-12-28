"""
評論系統路由模組

此模組展示了以下關鍵技術點：
1. RESTful API 設計 - 符合 REST 規範的路由設計
2. 資料庫事務處理 - 使用 SQLAlchemy ORM 進行原子操作
3. 用戶身份驗證 - 通過 session 驗證用戶登入狀態
4. 關聯表查詢 - 使用 review_likes 表實現多對多關係
5. Toggle 模式 - 點讚/取消點讚的切換邏輯
"""

from datetime import datetime

from flask import render_template, session, request, jsonify
from sqlalchemy.exc import IntegrityError

from auth import SessionLocal, User, Review, ReviewLike


def init_review_routes(app) -> None:
    """
    注冊評論頁和與評論相關的 API 路由。
    """

    # ===========================================================================
    # 評論頁面路由
    # ===========================================================================

    @app.route("/reviews")
    def reviews():
        """
        評論頁：從資料庫讀取主評論和回復，構建嵌套結構傳給前端。
        
        重要：會查詢 review_likes 表，獲取當前登入用戶已點讚的評論列表。
        這樣刷新頁面後，已點讚的評論會正確顯示紅心圖標。
        
        時間複雜度：O(n + m)，n 為評論數，m 為當前用戶的點讚數
        """
        db = SessionLocal()
        try:
            # 查詢所有評論
            rows = (
                db.query(Review, User.username)
                .join(User, Review.user_id == User.id)
                .order_by(Review.date.asc())
                .all()
            )

            # 獲取當前登入用戶已點讚的評論 ID 列表
            # 從 review_likes 表查詢，而不是 session
            user_id = session.get("user_id")
            liked_review_ids = set()
            
            if user_id:
                # 查詢當前用戶點讚過的所有評論 ID
                liked_rows = (
                    db.query(ReviewLike.review_id)
                    .filter(ReviewLike.user_id == user_id)
                    .all()
                )
                liked_review_ids = {row[0] for row in liked_rows}
                print(f"[reviews] User {user_id} liked reviews: {liked_review_ids}")

            # 構建評論字典
            items_by_id = {}
            for review, username in rows:
                # 檢查當前用戶是否已點讚此評論
                is_liked = review.id in liked_review_ids
                
                items_by_id[review.id] = {
                    "id": review.id,
                    "author": username or "User",
                    "text": review.content,
                    "date": review.date.isoformat() if review.date else "",
                    "likes": review.likes_count or 0,
                    "likedBy": [],
                    "is_liked": is_liked,  # 標記當前用戶是否已點讚
                    "replies": [],
                    "parent_id": review.parent_id,
                }

            # 根據 parent_id 組裝成主評論 + 子回復的結構
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

            # 主評論按時間倒序顯示
            roots.sort(key=lambda r: r.get("date") or "", reverse=True)

        finally:
            db.close()

        return render_template("reviews.html", initial_reviews=roots)

    # ===========================================================================
    # 創建評論 API
    # ===========================================================================

    @app.route("/api/reviews", methods=["POST"])
    def api_create_review():
        """
        創建新評論或回復。
        需要用戶登入。
        """
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
                    "is_liked": False,  # 新創建的評論，當前用戶尚未點讚
                    "parent_id": review.parent_id,
                }
            )
        finally:
            db.close()

    # ===========================================================================
    # AJAX 點讚功能 - 使用 review_likes 表實現
    # ===========================================================================
    #
    # 此路由展示了以下關鍵技術點：
    # 1. 身份驗證 - 只有登入用戶可以點讚
    # 2. Toggle 模式 - 已點讚則取消，未點讚則添加
    # 3. 關聯表操作 - 使用 review_likes 表記錄點讚關係
    # 4. 事務處理 - 同時更新 review_likes 和 reviews.likes_count
    # 5. JSON 響應 - 返回當前狀態和點讚數
    #
    # 時間複雜度：O(1) - 主鍵查詢
    # 空間複雜度：O(1)
    # ===========================================================================

    @app.route("/like_review/<int:review_id>", methods=["POST"])
    def like_review(review_id: int):
        """
        AJAX 點讚/取消點讚 API - Toggle 模式
        
        處理流程：
        1. 驗證用戶已登入
        2. 查詢 review_likes 表，判斷是否已點讚
        3. 如果已點讚：刪除記錄，likes_count - 1
        4. 如果未點讚：插入記錄，likes_count + 1
        5. 返回 JSON，包含 is_liked 和 new_likes
        
        Args:
            review_id (int): 評論的唯一標識符
            
        Returns:
            JSON 響應：
            - 成功：{"status": "success", "is_liked": true/false, "new_likes": <數量>}
            - 未登入：{"status": "error", "message": "...", "need_login": true}
            - 失敗：{"status": "error", "message": "..."}
            
        HTTP 狀態碼：
            - 200: 操作成功
            - 401: 用戶未登入
            - 404: 評論不存在
            - 500: 服務器內部錯誤
        """
        # ===== 步驟 1：身份驗證 =====
        user_id = session.get("user_id")
        if not user_id:
            return jsonify({
                "status": "error",
                "message": "Please login to like reviews.",
                "need_login": True
            }), 401

        db = SessionLocal()
        try:
            # ===== 步驟 2：查詢評論是否存在 =====
            review = db.query(Review).filter(Review.id == review_id).first()
            
            if not review:
                return jsonify({
                    "status": "error",
                    "message": f"Review with ID {review_id} not found."
                }), 404
            
            # ===== 步驟 3：查詢是否已點讚 =====
            existing_like = (
                db.query(ReviewLike)
                .filter(
                    ReviewLike.user_id == user_id,
                    ReviewLike.review_id == review_id
                )
                .first()
            )

            current_likes = review.likes_count or 0
            
            # ===== 步驟 4：Toggle 邏輯 =====
            if existing_like:
                # 已點讚 -> 取消點讚
                db.delete(existing_like)
                new_likes = max(0, current_likes - 1)
                review.likes_count = new_likes
                is_liked = False
                action = "unliked"
                print(f"[like_review] User {user_id} unliked review {review_id}")
            else:
                # 未點讚 -> 添加點讚
                # 雙重檢查：防止並發請求導致重複插入
                # 再次查詢確保記錄不存在（處理並發情況）
                double_check = (
                    db.query(ReviewLike)
                    .filter(
                        ReviewLike.user_id == user_id,
                        ReviewLike.review_id == review_id
                    )
                    .first()
                )
                
                if double_check:
                    # 如果發現已存在（可能是並發請求），視為已點讚
                    new_likes = current_likes
                    is_liked = True
                    action = "already_liked"
                    print(f"[like_review] User {user_id} already liked review {review_id} (concurrent request)")
                else:
                    # 確實不存在，執行插入
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
                    print(f"[like_review] User {user_id} liked review {review_id}")
            
            # ===== 步驟 5：提交事務 =====
            try:
                db.commit()
            except IntegrityError as e:
                # 捕獲唯一性約束錯誤（並發請求導致）
                db.rollback()
                # 重新查詢當前狀態
                final_check = (
                    db.query(ReviewLike)
                    .filter(
                        ReviewLike.user_id == user_id,
                        ReviewLike.review_id == review_id
                    )
                    .first()
                )
                
                if final_check:
                    # 記錄已存在，視為已點讚
                    review = db.query(Review).filter(Review.id == review_id).first()
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
                    # 其他錯誤，重新拋出
                    raise
            
            # ===== 步驟 6：返回響應 =====
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

    # ===========================================================================
    # 舊版 API（保留兼容性）
    # ===========================================================================

    @app.route("/api/reviews/<int:review_id>/like", methods=["POST"])
    def api_like_review(review_id: int):
        """
        舊版點讚 API（保留兼容性）。
        建議使用新的 /like_review/<id> 路由。
        """
        # 重定向到新的點讚邏輯
        return like_review(review_id)
