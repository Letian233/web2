import logging

from flask import render_template, request, redirect, url_for, session
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Boolean,
    Text,
    Float,
    Numeric,
    DateTime,
    ForeignKey,
    text,
)
from sqlalchemy.orm import sessionmaker, scoped_session, declarative_base


# ==================== SQLAlchemy Configuration ====================

DB_NAME = "Web2"
DB_USER = "root"
DB_PASSWORD = "root"
DB_HOST = "localhost"

# Use SQLAlchemy + PyMySQL to connect to MySQL
DATABASE_URL = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"
    f"?charset=utf8mb4"
)

engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,  # Detect failed connections
    # Recycle connections after 1 hour to avoid "MySQL has gone away"
    pool_recycle=3600,
)
# Create sessionmaker (factory for creating sessions)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
# Create scoped_session (thread-safe session manager)
db_session = scoped_session(SessionLocal)
Base = declarative_base()


class User(Base):
    """
    ORM mapping to existing users table.
    Does not auto-create tables or modify structure
    (we don't call Base.metadata.create_all).
    """

    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(80), unique=True, nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    is_admin = Column(Boolean, default=False)
    # Optional columns (see sql/Users.sql ALTER TABLE)
    phone = Column(String(20), nullable=True)
    avatar_url = Column(String(255), nullable=True)


class MenuItem(Base):
    """
    ORM mapping to existing menu_items table,
    used for homepage Popular Categories section.
    """

    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    description = Column(Text)
    image_url = Column(String(200))
    category = Column(String(50))
    rating = Column(Float)


class Review(Base):
    """
    ORM mapping to existing reviews table,
    used for comment section database interactions.
    """

    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    date = Column(DateTime)
    likes_count = Column(Integer, default=0)
    parent_id = Column(Integer, ForeignKey("reviews.id"), nullable=True)


class ReviewLike(Base):
    """
    ORM mapping to review_likes table,
    used to track user like status for reviews.
    Composite primary key (user_id, review_id) ensures
    each user can only like each review once.
    """

    __tablename__ = "review_likes"

    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    review_id = Column(
        Integer, ForeignKey("reviews.id", ondelete="CASCADE"), primary_key=True
    )
    created_at = Column(DateTime)


class ChefSpecialty(Base):
    """
    ORM mapping to chef_specialty table,
    used for dynamic display of "Chef's Specialty" on menu page.
    """

    __tablename__ = "chef_specialty"

    id = Column(Integer, primary_key=True)
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    image_url = Column(String(255))
    updated_at = Column(DateTime)


class Order(Base):
    """
    ORM mapping to existing orders table (does not auto-create).
    """

    __tablename__ = "orders"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(DateTime)
    total_amount = Column(Numeric(10, 2), nullable=False)
    status = Column(String(20))


class OrderItem(Base):
    """
    ORM mapping to existing order_items table (does not auto-create).
    """

    __tablename__ = "order_items"

    order_id = Column(
        Integer, ForeignKey("orders.id"), primary_key=True
    )
    menu_item_id = Column(
        Integer, ForeignKey("menu_items.id"), primary_key=True
    )
    quantity = Column(Integer, nullable=False)
    price_at_purchase = Column(Numeric(10, 2), nullable=False)


class Address(Base):
    """
    ORM mapping to existing addresses table (does not auto-create).
    """

    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(50), nullable=False)
    recipient_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    address_line = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    zip_code = Column(String(20), nullable=False)
    is_default = Column(Boolean, default=False)


class AboutContent(Base):
    """
    ORM mapping to existing about_content table (does not auto-create).
    Used to store content blocks for About page.
    """

    __tablename__ = "about_content"

    id = Column(Integer, primary_key=True)
    section_name = Column(String(50), unique=True, nullable=False)
    title = Column(String(100), nullable=False)  # Article title
    content = Column(Text, nullable=False)  # Article content
    image_url = Column(String(200), nullable=True)  # Image path
    updated_at = Column(DateTime)


def init_db() -> None:
    """
    Only check if database connection is available,
    do not create database or tables.

    You have already manually created the database and tables in MySQL.
    This only attempts to connect once. If configuration is wrong,
    it will raise an exception at startup for easy detection.
    """
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))


def init_auth_routes(app) -> None:
    """
    Attach authentication-related routes (login, register, logout)
    to the given Flask app instance.
    """

    @app.route("/register", methods=["GET", "POST"])
    def register():
        if request.method == "POST":
            username = request.form.get("username", "").strip()
            email = request.form.get("email", "").strip().lower()
            password = request.form.get("password", "")
            confirm_password = request.form.get("confirmPassword", "")

            # Basic validation
            if (not username or not email or not password or
                    not confirm_password):
                return render_template(
                    "register.html",
                    error="All fields are required.",
                )

            if password != confirm_password:
                return render_template(
                    "register.html",
                    error="Passwords do not match.",
                )

            if len(password) < 6:
                return render_template(
                    "register.html",
                    error="Password must be at least 6 characters long.",
                )

            # Use scoped_session to get current thread's database session
            db = db_session()
            try:
                # Check if username or email already exists
                existing = (
                    db.query(User)
                    .filter(
                        (User.username == username) | (User.email == email)
                    )
                    .first()
                )
                if existing:
                    return render_template(
                        "register.html",
                        error="Username or email is already registered.",
                    )

                # Create new user
                password_hash = generate_password_hash(password)
                new_user = User(
                    username=username,
                    email=email,
                    password_hash=password_hash,
                    is_admin=False,
                )
                db.add(new_user)
                db.commit()

            finally:
                db.close()

            # After successful registration,
            # show login page with success message
            return render_template(
                "login.html",
                success="Registration successful! Please log in.",
            )

        # GET
        return render_template("register.html")

    @app.route("/login", methods=["GET", "POST"])
    def login():
        if request.method == "POST":
            email = request.form.get("email", "").strip().lower()
            password = request.form.get("password", "")

            if not email or not password:
                return render_template(
                    "login.html",
                    error="Please enter both email and password.",
                )

            db = db_session()
            try:
                user = db.query(User).filter(User.email == email).first()
            finally:
                db.close()

            if (user is None or
                    not check_password_hash(user.password_hash, password)):
                logger = logging.getLogger("user_activity")
                logger.info(
                    "Login failed: email=%s ip=%s",
                    email,
                    request.remote_addr,
                )
                return render_template(
                    "login.html",
                    error="Invalid email or password.",
                )

            # Login success: store minimal info in session
            session.clear()
            session["user_id"] = user.id
            session["username"] = user.username
            session["email"] = user.email
            session["is_admin"] = bool(user.is_admin)

            logger = logging.getLogger("user_activity")
            logger.info(
                "Login success: user_id=%s username=%s email=%s ip=%s",
                user.id,
                user.username,
                user.email,
                request.remote_addr,
            )

            return redirect(url_for("index"))

        # GET
        return render_template("login.html")

    @app.route("/logout")
    def logout():
        logger = logging.getLogger("user_activity")
        logger.info(
            "Logout: user_id=%s username=%s ip=%s",
            session.get("user_id"),
            session.get("username"),
            request.remote_addr,
        )
        session.clear()
        return redirect(url_for("index"))
