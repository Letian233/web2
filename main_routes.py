import os
from datetime import datetime

from flask import jsonify, render_template, request, session, url_for
from werkzeug.utils import secure_filename

from auth import Address, db_session, MenuItem, User
from menu_utils import (
    filter_and_sort_menu,
    get_unique_categories,
    get_price_range,
)
from recommendation import get_recommendations


def init_main_routes(app) -> None:
    """
    Register main page routes for the site (homepage / menu / about etc.),
    and inject current logged-in user info into all templates.
    """

    # Inject current user info into all templates
    # (for navbar avatar, user menu)
    @app.context_processor
    def inject_current_user():
        user_id = session.get("user_id")
        if not user_id:
            return {"current_user": None}

        db = db_session()
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

        db = db_session()
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

        db = db_session()
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

        avatar_url = url_for(
            "static", filename=f"uploads/avatars/{stored_name}"
        )

        db = db_session()
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

        db = db_session()
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

        if not all([
            title, recipient_name, phone, address_line, city, state, zip_code
        ]):
            return jsonify({"error": "All address fields are required"}), 400

        db = db_session()
        try:
            if is_default:
                db.query(Address).filter(
                    Address.user_id == session["user_id"]
                ).update({"is_default": False})
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
        db = db_session()
        try:
            addr = (
                db.query(Address)
                .filter(
                    Address.id == address_id,
                    Address.user_id == session["user_id"]
                )
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
                db.query(Address).filter(
                    Address.user_id == session["user_id"]
                ).update({"is_default": False})
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

        db = db_session()
        try:
            addr = (
                db.query(Address)
                .filter(
                    Address.id == address_id,
                    Address.user_id == session["user_id"]
                )
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
        Homepage: read some menu items from menu_items table
        for Popular Categories section.

        New feature: "Recommended for You" recommendation system
        - If user is logged in and has purchase history:
          show personalized recommendations based on collaborative filtering
        - If user is not logged in or has no purchase history:
          show popular items (cold start handling)
        """
        db = db_session()
        try:
            popular_items = (
                db.query(MenuItem).order_by(MenuItem.id.asc()).limit(3).all()
            )
        finally:
            db.close()

        # Get recommended items
        user_id = session.get("user_id")
        recommended_items, recommendation_type = get_recommendations(
            user_id, limit=3
        )

        return render_template(
            "index.html",
            popular_items=popular_items,
            recommended_items=recommended_items,
            recommendation_type=recommendation_type
        )

    @app.route("/about")
    def about():
        """
        About page route - fetch content from database and render.

        Supported section_name:
        - 'History': History story section
        - 'Chef': Chef introduction section (single)
        - 'Chef1', 'Chef2', 'Chef3': Multiple chef introductions (optional)
        - 'Vision': Vision section (optional)
        """
        from auth import db_session, AboutContent

        db = db_session()
        try:
            import random

            # Get all about_content data from database, ordered by id
            about_contents = db.query(AboutContent).order_by(
                AboutContent.id.asc()
            ).all()

            # Convert data to dictionary, keyed by section_name
            content_dict = {}
            # Store all Chef-related content (for Chef section display)
            chef_contents = []
            # Store all content list (excluding Chef, for random display)
            all_contents_list = []

            for content in about_contents:
                content_data = {
                    'id': content.id,
                    'section_name': content.section_name,
                    'title': content.title,
                    'content': content.content,
                    'image_url': content.image_url or '',
                    'updated_at': (
                        content.updated_at.isoformat()
                        if content.updated_at else None
                    )
                }
                content_dict[content.section_name] = content_data

                # Collect all Chef-related content
                # (Chef, Chef1, Chef2, Chef3, etc.)
                # Case-insensitive matching (for Chef section display)
                section_lower = content.section_name.lower()
                if section_lower.startswith('chef'):
                    chef_contents.append(content_data)
                else:
                    # Non-Chef content added to random display list
                    all_contents_list.append(content_data)

            # Check if article ID is specified via URL parameter
            article_id = request.args.get('article', type=int)
            random_content = {}

            if article_id:
                # Try to find article with specified ID
                for content_data in all_contents_list:
                    if content_data.get('id') == article_id:
                        random_content = content_data
                        break
                # If not found, fall back to random selection
                if not random_content and all_contents_list:
                    random_content = random.choice(all_contents_list)
            elif all_contents_list:
                # No article ID specified,
                # randomly select one article to display
                random_content = random.choice(all_contents_list)

            # Get specific section content (if exists)
            history_content = content_dict.get('History', {})
            chef_content = content_dict.get('Chef', {})  # Single Chef section
            vision_content = content_dict.get('Vision', {})

            # If no single Chef section but multiple Chef records exist,
            # use first one
            if not chef_content and chef_contents:
                chef_content = chef_contents[0]

            return render_template(
                "about.html",
                history_content=history_content,
                chef_content=chef_content,
                chef_contents=chef_contents,  # Pass all chef data
                vision_content=vision_content,
                # Pass all content for flexible template use
                all_content=content_dict,
                random_content=random_content,  # Randomly selected article
                # Pass all article list for switching
                all_contents_list=all_contents_list
            )
        finally:
            db.close()

    def _get_all_menu_items_from_db() -> list:
        """
        Get all menu items from database and convert to Python dictionary list.

        This is the data access layer,
        does not use SQL ORDER BY (sorting done at application layer).
        Time complexity: O(n), where n is number of database records
        """
        db = db_session()
        try:
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
        Menu page: read all menu items from menu_items table,
        pass to frontend JS.
        Supports filtering and sorting via URL parameters.

        New feature: "Recommended for You" recommendation system
        - If user is logged in and has purchase history:
          show personalized recommendations based on collaborative filtering
        - If user is not logged in or has no purchase history:
          show popular items (cold start handling)
        """
        from auth import ChefSpecialty

        menu_items = _get_all_menu_items_from_db()

        # Get recommended items
        user_id = session.get("user_id")
        recommended_items, recommendation_type = get_recommendations(
            user_id, limit=3
        )

        # Get Chef's Specialty, ordered by updated_at descending
        db = db_session()
        try:
            chef_specialties = (
                db.query(ChefSpecialty)
                .order_by(ChefSpecialty.updated_at.desc())
                .limit(1)
                .all()
            )
        finally:
            db.close()

        return render_template(
            "menu.html",
            menu_items=menu_items,
            recommended_items=recommended_items,
            recommendation_type=recommendation_type,
            chef_specialties=chef_specialties
        )

    @app.route("/api/menu")
    def api_menu():
        """
        Menu API: RESTful endpoint supporting filtering and sorting.

        Query parameters:
        - category: Filter category (e.g., "Main Course", "Dessert")
        - min_price: Minimum price
        - max_price: Maximum price
        - search: Search keyword (searches in name and description)
        - sort_by: Sort field ("price" or "rating")
        - sort_order: Sort direction ("asc" or "desc")

        Response format:
        {
            "items": [...],
            "total": count,
            "categories": available category list,
            "price_range": {"min": min_price, "max": max_price},
            "filters_applied": {...},
            "sort_applied": {...}
        }

        Time complexity analysis (see menu_utils.py):
        - Data retrieval: O(n)
        - Filtering: O(n)
        - Sorting: O(m log m), where m is number of filtered items
        - Overall: O(n + m log m)
        """
        # Get query parameters
        category = request.args.get("category", "").strip() or None
        search_query = request.args.get("search", "").strip() or None
        sort_by = request.args.get("sort_by", "price").strip()
        sort_order = request.args.get("sort_order", "asc").strip()

        # Parse price range parameters
        min_price = None
        max_price = None
        min_price_str = request.args.get("min_price", "").strip()
        if min_price_str:
            try:
                min_price = float(min_price_str)
            except ValueError:
                pass

        max_price_str = request.args.get("max_price", "").strip()
        if max_price_str:
            try:
                max_price = float(max_price_str)
            except ValueError:
                pass

        # Validate sort parameters
        if sort_by not in ("price", "rating"):
            sort_by = "price"
        if sort_order not in ("asc", "desc"):
            sort_order = "asc"

        # Get raw data from database (does not use SQL ORDER BY)
        all_items = _get_all_menu_items_from_db()

        # Use manually implemented quick sort for filtering and sorting
        result = filter_and_sort_menu(
            items=all_items,
            category=category,
            min_price=min_price,
            max_price=max_price,
            search_query=search_query,
            sort_by=sort_by,
            sort_order=sort_order
        )

        # Get all available categories (for frontend filter dropdown)
        categories = get_unique_categories(all_items)

        # Get price range (for frontend price slider)
        price_range = get_price_range(all_items)

        # Handle no search results case
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
        Profile page: requires login to access.
        Specific data (order history, etc.) is fetched via frontend API calls.
        """
        if not session.get("user_id"):
            from flask import redirect

            return redirect(url_for("login"))
        return render_template("profile.html")
