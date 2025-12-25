CREATE TABLE order_items (
    order_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price_at_purchase DECIMAL(10, 2) NOT NULL, -- 記錄購買時的單價，防止未來菜品改價影響歷史記錄
    
    -- 聯合主鍵：確保同一個訂單裡同一個菜品只出現一次（數量增加）
    PRIMARY KEY (order_id, menu_item_id),
    
    -- 外鍵約束
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_purchase) VALUES 
-- 订单 1 (ORD-001): 1x Pizza, 1x Black Forest Cake
(1, 1, 1, 25.00),
(1, 2, 1, 20.00),

-- 订单 2 (ORD-002): 2x Pizza, 1x Boeuf Bourguignon
(2, 1, 2, 25.00),
(2, 3, 1, 45.00),

-- 订单 3 (ORD-003): 1x Pizza, 2x French Snails, 1x Black Forest Cake
(3, 1, 1, 25.00),
(3, 4, 2, 30.00),
(3, 2, 1, 20.00),

-- 订单 4 (ORD-004): 1x Boeuf Bourguignon
(4, 3, 1, 45.00),

-- 订单 5 (ORD-005): 2x Pizza, 1x Black Forest Cake
(5, 1, 2, 25.00),
(5, 2, 1, 20.00);