import os
from datetime import datetime

from flask import jsonify, render_template, request, session, url_for
from werkzeug.utils import secure_filename

from auth import Address, SessionLocal, MenuItem, User


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
        """
        db = SessionLocal()
        try:
            popular_items = (
                db.query(MenuItem).order_by(MenuItem.id.asc()).limit(3).all()
            )
        finally:
            db.close()

        return render_template("index.html", popular_items=popular_items)

    @app.route("/about")
    def about():
        return render_template("about.html")

    @app.route("/menu")
    def menu():
        """
        菜单页：从数据库的 menu_items 表读取所有菜品，传给前端 JS 使用。
        """
        db = SessionLocal()
        try:
            items = db.query(MenuItem).order_by(MenuItem.id.asc()).all()
            menu_items = [
                {
                    "id": item.id,
                    "name": item.name,
                    "price": float(item.price),
                    "description": item.description or "",
                    # 将数据库中的相对路径（如 '../images/pizza1.jpg'）
                    # 转成 Flask 静态资源 URL（如 '/static/images/pizza1.jpg'）
                    "image_url": url_for(
                        "static",
                        filename=(item.image_url or "").replace("../", ""),
                    ),
                    "category": item.category or "",
                    "rating": float(item.rating or 0),
                }
                for item in items
            ]
        finally:
            db.close()

        return render_template("menu.html", menu_items=menu_items)

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


