from flask import render_template, session, url_for

from auth import SessionLocal, MenuItem


def init_main_routes(app) -> None:
    """
    注册站点的主要页面路由（首页 / 菜单 / 关于等），
    并把当前登录用户信息注入到所有模板中。
    """

    # 将当前用户信息注入到所有模板（供导航栏头像、用户菜单使用）
    @app.context_processor
    def inject_current_user():
        return {
            "current_user": {
                "id": session.get("user_id"),
                "username": session.get("username"),
                "email": session.get("email"),
                "is_admin": session.get("is_admin"),
            }
        }

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


