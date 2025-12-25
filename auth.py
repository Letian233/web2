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
from sqlalchemy.orm import sessionmaker, declarative_base


# ==================== SQLAlchemy 配置 ====================

# NOTE: DB_NAME 必须与你已经创建的数据库名称一致
DB_NAME = "Web2"
DB_USER = "root"
DB_PASSWORD = "root"
DB_HOST = "localhost"

# 使用 SQLAlchemy + PyMySQL 连接 MySQL
DATABASE_URL = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}?charset=utf8mb4"
)

engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,  # 探测失效连接
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


class User(Base):
    """
    ORM 映射到已存在的 users 表。
    不会自动建表，也不会修改结构（我们不调用 Base.metadata.create_all）。
    """

    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(80), unique=True, nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    # 实际数据库中可以是 VARCHAR(255) 或 TEXT，ORM 这里用 Text 兼容
    password_hash = Column(Text, nullable=False)
    is_admin = Column(Boolean, default=False)


class MenuItem(Base):
    """
    ORM 映射到已存在的 menu_items 表，用于首页 Popular Categories 区域。
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
    ORM 映射到已存在的 reviews 表，用于评论区与数据库交互。
    """

    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    date = Column(DateTime)
    likes_count = Column(Integer, default=0)
    parent_id = Column(Integer, ForeignKey("reviews.id"), nullable=True)


class Order(Base):
    """
    ORM 映射到已存在的 orders 表（不自动建表）。
    """

    __tablename__ = "orders"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(DateTime)
    total_amount = Column(Numeric(10, 2), nullable=False)
    status = Column(String(20))


class OrderItem(Base):
    """
    ORM 映射到已存在的 order_items 表（不自动建表）。
    """

    __tablename__ = "order_items"

    order_id = Column(Integer, ForeignKey("orders.id"), primary_key=True)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), primary_key=True)
    quantity = Column(Integer, nullable=False)
    price_at_purchase = Column(Numeric(10, 2), nullable=False)


def init_db() -> None:
    """
    仅检查数据库连接是否可用，不做任何建库 / 建表操作。

    你已经在 MySQL 中手动创建好了数据库和数据表，这里只尝试连一次，
    如果配置错误会在启动时抛出异常，方便你及时发现。
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
            if not username or not email or not password or not confirm_password:
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

            # 使用 SQLAlchemy 会话访问数据库
            db = SessionLocal()
            try:
                # 检查用户名或邮箱是否已存在
                existing = (
                    db.query(User)
                    .filter((User.username == username) | (User.email == email))
                    .first()
                )
                if existing:
                    return render_template(
                        "register.html",
                        error="Username or email is already registered.",
                    )

                # 创建新用户
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

            # After successful registration, show login page with success message
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

            db = SessionLocal()
            try:
                user = db.query(User).filter(User.email == email).first()
            finally:
                db.close()

            if user is None or not check_password_hash(user.password_hash, password):
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

            return redirect(url_for("index"))

        # GET
        return render_template("login.html")

    @app.route("/logout")
    def logout():
        session.clear()
        return redirect(url_for("index"))


