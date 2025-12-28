import os
from datetime import timedelta

from flask import Flask
from flask_babel import Babel

from auth import init_db, init_auth_routes
from main_routes import init_main_routes
from review_routes import init_review_routes
from order_routes import init_order_routes
from admin import init_admin

# 创建全局 Babel 实例（应用工厂模式）
babel = Babel()


def create_app() -> Flask:
    """
    Application factory.
    Provides basic Flask framework, page routes,
    and minimal login / registration functionality.
    """
    app = Flask(
        __name__,
        static_folder="static",
        template_folder="templates",
    )

    # Basic secret key for sessions (replace with env var in production)
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-key-change-me")
    
    # Session 配置：確保點讚狀態在刷新後保持
    app.config["SESSION_PERMANENT"] = True
    app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=7)  # Session 保持 7 天
    
    # Flask-Babel 配置（Flask-Admin 需要）
    app.config['BABEL_DEFAULT_LOCALE'] = 'en'
    app.config['BABEL_DEFAULT_TIMEZONE'] = 'UTC'
    
    # Flask-Admin 静态文件配置（解决 PythonAnywhere 样式丢失问题）
    # 使用 CDN 来加载静态文件，确保样式正常显示
    app.config['FLASK_ADMIN_SWATCH'] = 'cerulean'  # 可选：设置主题
    
    # 初始化 Flask-Babel（必须在 init_admin 之前）
    babel.init_app(app)

    # Ensure database connection is available
    init_db()

    # Attach auth-related routes from separate module
    init_auth_routes(app)

    # 注册页面、评论和订单相关的路由
    init_main_routes(app)
    init_review_routes(app)
    init_order_routes(app)
    
    # 初始化 Flask-Admin 后台管理系统
    init_admin(app)

    return app


if __name__ == "__main__":
    # Minimal dev server for local testing.
    app = create_app()
    app.run(debug=True)
