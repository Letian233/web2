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