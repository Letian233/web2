-- 建立評論點讚關聯表
CREATE TABLE review_likes (
    user_id INT NOT NULL,
    review_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 複合主鍵：確保同一個用戶對同一個評論只能有一條記錄
    PRIMARY KEY (user_id, review_id),
    
    -- 外鍵約束：當用戶或評論被刪除時，點讚記錄也隨之刪除
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
);