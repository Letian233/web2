import os
import logging
from datetime import timedelta
from logging.handlers import RotatingFileHandler

from flask import Flask, has_request_context, session as flask_session
from sqlalchemy import event
from flask_babel import Babel

from auth import init_db, init_auth_routes, db_session, SessionLocal
from main_routes import init_main_routes
from review_routes import init_review_routes
from order_routes import init_order_routes
from admin import init_admin

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

    # -------------- Logging --------------
    # Write to logs/app.log and logs/user_log.log
    # (auto-create directory), prevent duplicate handlers
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        log_dir = os.path.join(base_dir, "logs")
        os.makedirs(log_dir, exist_ok=True)
        log_file = os.path.join(log_dir, "app.log")
        user_log_file = os.path.join(log_dir, "user_log.log")

        has_file_handler = any(
            isinstance(h, RotatingFileHandler)
            for h in app.logger.handlers
        )
        if not has_file_handler:
            file_handler = RotatingFileHandler(
                log_file, maxBytes=1_000_000, backupCount=5,
                encoding="utf-8"
            )
            formatter = logging.Formatter(
                "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
            )
            file_handler.setFormatter(formatter)
            file_handler.setLevel(logging.INFO)
            app.logger.addHandler(file_handler)
            app.logger.setLevel(logging.INFO)
            app.logger.info("Logging initialized, output -> %s", log_file)

        # Separate user activity logger (login, logout, CRUD),
        # write to user_log.log
        activity_logger = logging.getLogger("user_activity")
        activity_logger.propagate = False
        has_user_handler = any(
            isinstance(h, RotatingFileHandler) and
            getattr(h, "baseFilename", None) ==
            os.path.abspath(user_log_file)
            for h in activity_logger.handlers
        )
        if not has_user_handler:
            user_handler = RotatingFileHandler(
                user_log_file, maxBytes=1_000_000, backupCount=5,
                encoding="utf-8"
            )
            user_handler.setFormatter(logging.Formatter(
                "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
            ))
            user_handler.setLevel(logging.INFO)
            activity_logger.addHandler(user_handler)
        activity_logger.setLevel(logging.INFO)
        activity_logger.info(
            "User activity logging initialized, output -> %s",
            user_log_file
        )
    except Exception as e:
        # Prevent logging initialization failure from blocking app startup
        print("Logging setup failed:", e)

    # Basic secret key for sessions
    # (replace with env var in production)
    app.config["SECRET_KEY"] = os.environ.get(
        "SECRET_KEY", "dev-secret-key-change-me"
    )

    # Session configuration: ensure like status persists after refresh
    app.config["SESSION_PERMANENT"] = True
    # Session lasts 7 days
    app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=7)

    # Flask-Babel configuration (required by Flask-Admin)
    app.config['BABEL_DEFAULT_LOCALE'] = 'en'
    app.config['BABEL_DEFAULT_TIMEZONE'] = 'UTC'

    # Flask-Admin static files configuration
    # (fix PythonAnywhere style loss issue)
    # Use CDN to load static files, ensure styles display correctly
    app.config['FLASK_ADMIN_SWATCH'] = 'cerulean'  # Optional: set theme

    # Initialize Flask-Babel (must be before init_admin)
    babel.init_app(app)

    # Ensure database connection is available
    init_db()

    # -------------- DB CRUD Logging --------------
    def _current_user_ctx():
        if not has_request_context():
            return "user=system"
        uid = flask_session.get("user_id")
        uname = flask_session.get("username")
        if uid:
            return f"user_id={uid}, username={uname}"
        return "user=anonymous"

    def _describe(obj):
        model = obj.__class__.__name__
        obj_id = getattr(obj, "id", None)
        return f"{model}(id={obj_id})"

    def log_db_operations(session, flush_context):
        # session.new / dirty / deleted are populated right before commit
        activity_logger = logging.getLogger("user_activity")
        additions = [_describe(o) for o in session.new]
        updates = [
            _describe(o)
            for o in session.dirty
            if session.is_modified(o, include_collections=False)
        ]
        deletions = [_describe(o) for o in session.deleted]
        if not additions and not updates and not deletions:
            return
        app.logger.info(
            "DB change (%s) add=%s update=%s delete=%s",
            _current_user_ctx(),
            additions,
            updates,
            deletions,
        )
        activity_logger.info(
            "DB change (%s) add=%s update=%s delete=%s",
            _current_user_ctx(),
            additions,
            updates,
            deletions,
        )

    # Prevent duplicate event listener registration
    if not getattr(SessionLocal, "_db_logging_attached", False):
        event.listen(SessionLocal, "after_flush", log_db_operations)
        SessionLocal._db_logging_attached = True

    # Attach auth-related routes from separate module
    init_auth_routes(app)

    # Register page, review, and order related routes
    init_main_routes(app)
    init_review_routes(app)
    init_order_routes(app)

    # Initialize Flask-Admin backend management system
    init_admin(app)

    # Add teardown_appcontext hook to automatically clean up
    # scoped_session at end of each request
    @app.teardown_appcontext
    def shutdown_session(exception=None):
        """
        Automatically call db_session.remove() at the end of each request
        to clean up session.
        This ensures each request has an independent database session,
        avoiding thread safety issues.
        """
        db_session.remove()

    return app


if __name__ == "__main__":
    # Minimal dev server for local testing.
    app = create_app()
    app.run(debug=True)
