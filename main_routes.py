import os
from datetime import datetime

from flask import jsonify, render_template, request, session, url_for
from werkzeug.utils import secure_filename

from auth import Address, SessionLocal, MenuItem, User
from menu_utils import (
    filter_and_sort_menu,
    get_unique_categories,
    get_price_range,
)
from recommendation import get_recommendations


def init_main_routes(app) -> None:
    """
    注册站点的主要页面路由（首页 / 菜单 / 关于等），
    并把当前登录用户信息注入到所有模板中。
    """

    # 将当前用户信息注入到所有模板（供导航栏头像、用户菜单使用）
    @app.context_processor
    def inject_current_user():
        user_id = session.get("user_id")
        if not user_id:
            return {"current_user": None}

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                # Session stale
                session.clear()
                return {"current_user": None}
            return {
                "current_user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "phone": user.phone,
                    "avatar_url": user.avatar_url,
                    "is_admin": bool(user.is_admin),
                }
            }
        finally:
            db.close()

    def _require_login():
        if not session.get("user_id"):
            return jsonify({"error": "Not logged in"}), 401
        return None

    @app.get("/api/me")
    def api_me():
        guard = _require_login()
        if guard:
            return guard

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == session["user_id"]).first()
            if not user:
                session.clear()
                return jsonify({"error": "Not logged in"}), 401
            return jsonify(
                {
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "phone": user.phone,
                        "avatar_url": user.avatar_url,
                        "is_admin": bool(user.is_admin),
                    }
                }
            )
        finally:
            db.close()

    @app.put("/api/profile")
    def api_update_profile():
        guard = _require_login()
        if guard:
            return guard

        payload = request.get_json(silent=True) or {}
        username = (payload.get("username") or "").strip()
        phone = (payload.get("phone") or "").strip() or None

        if not username:
            return jsonify({"error": "Username is required"}), 400

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == session["user_id"]).first()
            if not user:
                session.clear()
                return jsonify({"error": "Not logged in"}), 401

            # Uniqueness checks (only for username, email cannot be changed)
            existing_username = (
                db.query(User)
                .filter(User.username == username, User.id != user.id)
                .first()
            )
            if existing_username:
                return jsonify({"error": "Username is already taken"}), 400

            # Update only username and phone, email remains unchanged
            user.username = username
            user.phone = phone
            db.commit()

            # keep session basics in sync (email stays the same)
            session["username"] = username

            return jsonify(
                {
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "phone": user.phone,
                        "avatar_url": user.avatar_url,
                        "is_admin": bool(user.is_admin),
                    }
                }
            )
        finally:
            db.close()

    @app.post("/api/profile/avatar")
    def api_upload_avatar():
        guard = _require_login()
        if guard:
            return guard

        if "avatar" not in request.files:
            return jsonify({"error": "Missing file field 'avatar'"}), 400

        file = request.files["avatar"]
        if not file or file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        filename = secure_filename(file.filename)
        _, ext = os.path.splitext(filename.lower())
        if ext not in {".png", ".jpg", ".jpeg", ".webp", ".gif"}:
            return jsonify({"error": "Unsupported file type"}), 400

        user_id = int(session["user_id"])
        ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        stored_name = f"user_{user_id}_{ts}{ext}"

        upload_dir = os.path.join(app.static_folder, "uploads", "avatars")
        os.makedirs(upload_dir, exist_ok=True)
        save_path = os.path.join(upload_dir, stored_name)
        file.save(save_path)

        avatar_url = url_for("static", filename=f"uploads/avatars/{stored_name}")

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                session.clear()
                return jsonify({"error": "Not logged in"}), 401
            user.avatar_url = avatar_url
            db.commit()
            return jsonify({"avatar_url": avatar_url})
        finally:
            db.close()

    @app.get("/api/addresses")
    def api_list_addresses():
        guard = _require_login()
        if guard:
            return guard

        db = SessionLocal()
        try:
            rows = (
                db.query(Address)
                .filter(Address.user_id == session["user_id"])
                .order_by(Address.is_default.desc(), Address.id.asc())
                .all()
            )
            return jsonify(
                {
                    "addresses": [
                        {
                            "id": a.id,
                            "title": a.title,
                            "recipient_name": a.recipient_name,
                            "phone": a.phone,
                            "address_line": a.address_line,
                            "city": a.city,
                            "state": a.state,
                            "zip_code": a.zip_code,
                            "is_default": bool(a.is_default),
                        }
                        for a in rows
                    ]
                }
            )
        finally:
            db.close()

    @app.post("/api/addresses")
    def api_create_address():
        guard = _require_login()
        if guard:
            return guard

        payload = request.get_json(silent=True) or {}
        title = (payload.get("title") or "").strip()
        recipient_name = (payload.get("recipient_name") or "").strip()
        phone = (payload.get("phone") or "").strip()
        address_line = (payload.get("address_line") or "").strip()
        city = (payload.get("city") or "").strip()
        state = (payload.get("state") or "").strip()
        zip_code = (payload.get("zip_code") or "").strip()
        is_default = bool(payload.get("is_default"))

        if not all([title, recipient_name, phone, address_line, city, state, zip_code]):
            return jsonify({"error": "All address fields are required"}), 400

        db = SessionLocal()
        try:
            if is_default:
                db.query(Address).filter(Address.user_id == session["user_id"]).update(
                    {"is_default": False}
                )
            addr = Address(
                user_id=session["user_id"],
                title=title,
                recipient_name=recipient_name,
                phone=phone,
                address_line=address_line,
                city=city,
                state=state,
                zip_code=zip_code,
                is_default=is_default,
            )
            db.add(addr)
            db.commit()
            return jsonify({"id": addr.id})
        finally:
            db.close()

    @app.put("/api/addresses/<int:address_id>")
    def api_update_address(address_id: int):
        guard = _require_login()
        if guard:
            return guard

        payload = request.get_json(silent=True) or {}
        db = SessionLocal()
        try:
            addr = (
                db.query(Address)
                .filter(Address.id == address_id, Address.user_id == session["user_id"])
                .first()
            )
            if not addr:
                return jsonify({"error": "Address not found"}), 404

            for key, field in [
                ("title", "title"),
                ("recipient_name", "recipient_name"),
                ("phone", "phone"),
                ("address_line", "address_line"),
                ("city", "city"),
                ("state", "state"),
                ("zip_code", "zip_code"),
            ]:
                if key in payload:
                    setattr(addr, field, (payload.get(key) or "").strip())

            if "is_default" in payload and bool(payload.get("is_default")):
                db.query(Address).filter(Address.user_id == session["user_id"]).update(
                    {"is_default": False}
                )
                addr.is_default = True

            db.commit()
            return jsonify({"ok": True})
        finally:
            db.close()

    @app.delete("/api/addresses/<int:address_id>")
    def api_delete_address(address_id: int):
        guard = _require_login()
        if guard:
            return guard

        db = SessionLocal()
        try:
            addr = (
                db.query(Address)
                .filter(Address.id == address_id, Address.user_id == session["user_id"])
                .first()
            )
            if not addr:
                return jsonify({"error": "Address not found"}), 404
            db.delete(addr)
            db.commit()
            return jsonify({"ok": True})
        finally:
            db.close()

    @app.route("/")
    def index():
        """
        首页：从 menu_items 表读取部分菜品，用于 Popular Categories 区域。
        
        新增功能：「猜你喜歡」推薦系統
        - 如果用戶已登入且有購買記錄：顯示基於協同過濾的個性化推薦
        - 如果用戶未登入或無購買記錄：顯示熱門菜品（冷啟動處理）
        """
        db = SessionLocal()
        try:
            popular_items = (
                db.query(MenuItem).order_by(MenuItem.id.asc()).limit(3).all()
            )
        finally:
            db.close()

        # 獲取推薦菜品
        user_id = session.get("user_id")
        recommended_items, recommendation_type = get_recommendations(user_id, limit=3)

        return render_template(
            "index.html",
            popular_items=popular_items,
            recommended_items=recommended_items,
            recommendation_type=recommendation_type
        )

    @app.route("/about")
    def about():
        """
        About 页面路由 - 从数据库获取内容并渲染。
        
        支持的 section_name:
        - 'History': 历史故事部分
        - 'Chef': 厨师介绍部分（单个）
        - 'Chef1', 'Chef2', 'Chef3': 多个厨师介绍（可选）
        - 'Vision': 愿景部分（可选）
        """
        from auth import SessionLocal, AboutContent
        
        db = SessionLocal()
        try:
            import random
            
            # 从数据库获取所有 about_content 数据，按 id 排序
            about_contents = db.query(AboutContent).order_by(AboutContent.id.asc()).all()
            
            # 将数据转换为字典，以 section_name 为键
            content_dict = {}
            chef_contents = []  # 存储所有 Chef 相关的内容（用于 Chef 区块显示）
            all_contents_list = []  # 存储所有内容列表（排除 Chef，用于随机显示）
            
            for content in about_contents:
                content_data = {
                    'id': content.id,
                    'section_name': content.section_name,
                    'title': content.title,
                    'content': content.content,
                    'image_url': content.image_url or '',
                    'updated_at': content.updated_at.isoformat() if content.updated_at else None
                }
                content_dict[content.section_name] = content_data
                
                # 收集所有 Chef 相关的内容（Chef, Chef1, Chef2, Chef3 等）
                # 不区分大小写匹配（用于 Chef 区块显示）
                section_lower = content.section_name.lower()
                if section_lower.startswith('chef'):
                    chef_contents.append(content_data)
                else:
                    # 非 Chef 内容加入随机显示列表
                    all_contents_list.append(content_data)
            
            # 随机选择一篇推文显示
            random_content = {}
            if all_contents_list:
                random_content = random.choice(all_contents_list)
            
            # 获取特定区块的内容（如果存在）
            history_content = content_dict.get('History', {})
            chef_content = content_dict.get('Chef', {})  # 单个 Chef 区块
            vision_content = content_dict.get('Vision', {})
            
            # 如果没有单个 Chef 区块，但有多个 Chef 记录，使用第一个
            if not chef_content and chef_contents:
                chef_content = chef_contents[0]
            
            return render_template(
                "about.html",
                history_content=history_content,
                chef_content=chef_content,
                chef_contents=chef_contents,  # 传递所有厨师数据
                vision_content=vision_content,
                all_content=content_dict,  # 传递所有内容以便模板灵活使用
                random_content=random_content,  # 随机选择的一篇推文
                all_contents_list=all_contents_list  # 传递所有推文列表用于切换
            )
        finally:
            db.close()

    def _get_all_menu_items_from_db() -> list:
        """
        從數據庫獲取所有菜單項目並轉換為 Python 字典列表。
        
        這是數據獲取層，不使用 SQL ORDER BY（排序在應用層完成）。
        時間複雜度: O(n)，其中 n 為數據庫記錄數
        """
        db = SessionLocal()
        try:
            # 注意：不使用 ORDER BY，排序將在 Python 層完成
            items = db.query(MenuItem).all()
            menu_items = [
                {
                    "id": item.id,
                    "name": item.name,
                    "price": float(item.price),
                    "description": item.description or "",
                    "image_url": url_for(
                        "static",
                        filename=(item.image_url or "").replace("../", ""),
                    ),
                    "category": item.category or "",
                    "rating": float(item.rating or 0),
                }
                for item in items
            ]
            return menu_items
        finally:
            db.close()

    @app.route("/menu")
    def menu():
        """
        菜单页：从数据库的 menu_items 表读取所有菜品，传给前端 JS 使用。
        支持通过 URL 参数进行过滤和排序。
        
        新增功能：「猜你喜歡」推薦系統
        - 如果用戶已登入且有購買記錄：顯示基於協同過濾的個性化推薦
        - 如果用戶未登入或無購買記錄：顯示熱門菜品（冷啟動處理）
        """
        menu_items = _get_all_menu_items_from_db()
        
        # 獲取推薦菜品
        user_id = session.get("user_id")
        recommended_items, recommendation_type = get_recommendations(user_id, limit=3)
        
        return render_template(
            "menu.html",
            menu_items=menu_items,
            recommended_items=recommended_items,
            recommendation_type=recommendation_type
        )

    @app.route("/api/menu")
    def api_menu():
        """
        菜單 API：支持過濾和排序的 RESTful 端點。
        
        查詢參數：
        - category: 過濾類別（如 "Main Course", "Dessert"）
        - min_price: 最低價格
        - max_price: 最高價格
        - search: 搜索關鍵詞（在名稱和描述中搜索）
        - sort_by: 排序字段（"price" 或 "rating"）
        - sort_order: 排序方向（"asc" 或 "desc"）
        
        響應格式：
        {
            "items": [...],
            "total": 數量,
            "categories": 可用類別列表,
            "price_range": {"min": 最低價, "max": 最高價},
            "filters_applied": {...},
            "sort_applied": {...}
        }
        
        時間複雜度分析（見 menu_utils.py）：
        - 數據獲取: O(n)
        - 過濾: O(n)
        - 排序: O(m log m)，m 為過濾後項目數
        - 總體: O(n + m log m)
        """
        # 獲取查詢參數
        category = request.args.get("category", "").strip() or None
        search_query = request.args.get("search", "").strip() or None
        sort_by = request.args.get("sort_by", "price").strip()
        sort_order = request.args.get("sort_order", "asc").strip()
        
        # 解析價格範圍參數
        min_price = None
        max_price = None
        try:
            min_price_str = request.args.get("min_price", "").strip()
            if min_price_str:
                min_price = float(min_price_str)
        except ValueError:
            pass
        
        try:
            max_price_str = request.args.get("max_price", "").strip()
            if max_price_str:
                max_price = float(max_price_str)
        except ValueError:
            pass
        
        # 驗證排序參數
        if sort_by not in ("price", "rating"):
            sort_by = "price"
        if sort_order not in ("asc", "desc"):
            sort_order = "asc"
        
        # 從數據庫獲取原始數據（不使用 SQL ORDER BY）
        all_items = _get_all_menu_items_from_db()
        
        # 使用手動實現的快速排序進行過濾和排序
        result = filter_and_sort_menu(
            items=all_items,
            category=category,
            min_price=min_price,
            max_price=max_price,
            search_query=search_query,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        # 獲取所有可用類別（用於前端過濾下拉選單）
        categories = get_unique_categories(all_items)
        
        # 獲取價格範圍（用於前端價格滑塊）
        price_range = get_price_range(all_items)
        
        # 處理無搜索結果的情況
        if result["total"] == 0:
            return jsonify({
                "items": [],
                "total": 0,
                "message": "No items found matching your criteria.",
                "categories": categories,
                "price_range": price_range,
                "filters_applied": result["filters_applied"],
                "sort_applied": result["sort_applied"]
            })
        
        return jsonify({
            "items": result["items"],
            "total": result["total"],
            "categories": categories,
            "price_range": price_range,
            "filters_applied": result["filters_applied"],
            "sort_applied": result["sort_applied"]
        })

    @app.route("/gallery")
    def gallery():
        return render_template("gallery.html")

    @app.route("/contact")
    def contact():
        return render_template("contact.html")

    @app.route("/profile")
    def profile():
        """
        个人主页：需要登录才能访问。
        具体数据（订单历史等）通过前端调用 API 获取。
        """
        if not session.get("user_id"):
            from flask import redirect

            return redirect(url_for("login"))
        return render_template("profile.html")


