from datetime import datetime

from flask import jsonify, request, session

from auth import SessionLocal, Order, OrderItem, MenuItem


def serialize_order(order, items):
    """
    将订单和其明细转换为前端需要的结构：
    {
      orderId: "ORD-001",
      date: "2024-01-15",
      total: 50.00,
      items: [{ id, name, price, quantity }]
    }
    """
    return {
        "orderId": f"ORD-{order.id:03d}",
        "date": order.date.strftime("%Y-%m-%d") if order.date else "",
        "total": float(order.total_amount or 0),
        "status": (order.status or "Completed"),
        "items": [
            {
                "id": item.menu_item_id,
                "name": item.menu_item_name,
                "price": float(item.price_at_purchase),
                "quantity": item.quantity,
            }
            for item in items
        ],
    }


def init_order_routes(app) -> None:
    """
    注册下单和订单历史相关的 API 路由。
    """

    @app.route("/api/orders", methods=["GET"])
    def api_get_orders():
        """
        获取当前登录用户的历史订单列表。
        """
        user_id = session.get("user_id")
        if not user_id:
            return jsonify({"error": "You must be logged in to view orders."}), 401

        db = SessionLocal()
        try:
            # 先查出该用户的所有订单
            orders = (
                db.query(Order)
                .filter(Order.user_id == user_id)
                .order_by(Order.date.desc())
                .all()
            )
            if not orders:
                return jsonify([])

            order_ids = [o.id for o in orders]

            # 查询所有对应的 order_items + 菜品名称
            rows = (
                db.query(
                    OrderItem.order_id,
                    OrderItem.menu_item_id,
                    OrderItem.quantity,
                    OrderItem.price_at_purchase,
                    MenuItem.name.label("menu_item_name"),
                )
                .join(MenuItem, MenuItem.id == OrderItem.menu_item_id)
                .filter(OrderItem.order_id.in_(order_ids))
                .all()
            )

            # 组装为 order_id -> [items]
            items_by_order = {}
            for row in rows:
                items_by_order.setdefault(row.order_id, []).append(row)

            result = [
                serialize_order(order, items_by_order.get(order.id, []))
                for order in orders
            ]

            return jsonify(result)
        finally:
            db.close()

    @app.route("/api/orders", methods=["POST"])
    def api_create_order():
        """
        根据当前购物车创建新订单。
        请求体示例：
        {
          "items": [
            { "id": 1, "quantity": 2 },
            { "id": 3, "quantity": 1 }
          ]
        }
        """
        user_id = session.get("user_id")
        if not user_id:
            return jsonify({"error": "You must be logged in to place an order."}), 401

        data = request.get_json(silent=True) or {}
        items = data.get("items") or []

        # 简单校验
        if not isinstance(items, list) or len(items) == 0:
            return jsonify({"error": "Cart is empty."}), 400

        db = SessionLocal()
        try:
            # 从数据库中取出所有涉及到的菜品，保证价格以服务器为准
            menu_ids = [int(i.get("id")) for i in items if i.get("id") is not None]
            menu_map = {
                m.id: m
                for m in db.query(MenuItem)
                .filter(MenuItem.id.in_(menu_ids))
                .all()
            }

            order_items = []
            total_amount = 0.0

            for item in items:
                try:
                    menu_id = int(item.get("id"))
                    quantity = int(item.get("quantity") or 0)
                except (TypeError, ValueError):
                    continue

                if quantity <= 0 or menu_id not in menu_map:
                    continue

                menu_obj = menu_map[menu_id]
                price = float(menu_obj.price)
                line_total = price * quantity
                total_amount += line_total

                order_items.append(
                    {
                        "menu_item_id": menu_id,
                        "quantity": quantity,
                        "price_at_purchase": price,
                        "menu_item_name": menu_obj.name,
                    }
                )

            if not order_items:
                return jsonify({"error": "No valid items in cart."}), 400

            # 创建订单
            order = Order(
                user_id=user_id,
                date=datetime.utcnow(),
                total_amount=total_amount,
                status="Completed",
            )
            db.add(order)
            db.flush()  # 先拿到 order.id

            # 创建明细
            for oi in order_items:
                db.add(
                    OrderItem(
                        order_id=order.id,
                        menu_item_id=oi["menu_item_id"],
                        quantity=oi["quantity"],
                        price_at_purchase=oi["price_at_purchase"],
                    )
                )

            db.commit()

            # 返回新订单详情（结构与 GET /api/orders 相同单条）
            class TmpItem:
                def __init__(self, order_id, menu_item_id, quantity, price_at_purchase, menu_item_name):
                    self.order_id = order_id
                    self.menu_item_id = menu_item_id
                    self.quantity = quantity
                    self.price_at_purchase = price_at_purchase
                    self.menu_item_name = menu_item_name

            tmp_items = [
                TmpItem(
                    order_id=order.id,
                    menu_item_id=oi["menu_item_id"],
                    quantity=oi["quantity"],
                    price_at_purchase=oi["price_at_purchase"],
                    menu_item_name=oi["menu_item_name"],
                )
                for oi in order_items
            ]

            return jsonify(serialize_order(order, tmp_items)), 201
        finally:
            db.close()


