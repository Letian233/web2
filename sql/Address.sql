CREATE TABLE addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,                  -- 關聯到 users 表的 id
    title VARCHAR(50) NOT NULL,            -- 地址標籤，例如 'Home', 'Office'
    recipient_name VARCHAR(100) NOT NULL,  -- 收件人姓名，對應 JS 中的 'name'
    phone VARCHAR(20) NOT NULL,            -- 聯繫電話
    address_line VARCHAR(255) NOT NULL,    -- 詳細地址，對應 JS 中的 'address'
    city VARCHAR(100) NOT NULL,            -- 城市
    state VARCHAR(100) NOT NULL,           -- 州/省
    zip_code VARCHAR(20) NOT NULL,         -- 郵遞區號，對應 JS 中的 'zip'
    is_default TINYINT(1) DEFAULT 0,       -- 是否為預設地址 (0: 否, 1: 是)
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);