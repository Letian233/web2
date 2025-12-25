import os

from flask import Flask

from auth import init_db, init_auth_routes
from main_routes import init_main_routes
from review_routes import init_review_routes
from order_routes import init_order_routes


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

    # Ensure database connection is available
    init_db()

    # Attach auth-related routes from separate module
    init_auth_routes(app)

    # 注册页面、评论和订单相关的路由
    init_main_routes(app)
    init_review_routes(app)
    init_order_routes(app)

    return app


if __name__ == "__main__":
    # Minimal dev server for local testing.
    app = create_app()
    app.run(debug=True)
