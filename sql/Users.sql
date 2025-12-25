CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(80) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL, -- 存儲哈希後的密碼
    is_admin TINYINT(1) DEFAULT 0 -- 0: 普通用戶, 1: 管理員
);

ALTER TABLE users
ADD COLUMN phone VARCHAR(20) DEFAULT NULL,
ADD COLUMN avatar_url VARCHAR(255) DEFAULT NULL;

INSERT INTO users (username, email, password_hash, is_admin) VALUES 
-- 管理员用户 (对应 reviews.js 中的回复者)
('Admin', 'admin@epiceats.com', 'pbkdf2:sha256:600000$MockHashStringForAdminUser123', 1),
('Chef Marco', 'marco@epiceats.com', 'pbkdf2:sha256:600000$MockHashStringForChefMarco456', 1),

-- 普通用户 (对应 reviews.js 中的评论者)
('John Doe', 'john.doe@example.com', 'pbkdf2:sha256:600000$MockHashStringForUserJohn789', 0),
('Emily Smith', 'emily.smith@example.com', 'pbkdf2:sha256:600000$MockHashStringForUserEmily101', 0),
('Sarah Johnson', 'sarah.j@example.com', 'pbkdf2:sha256:600000$MockHashStringForUserSarah102', 0),
('David Wilson', 'david.w@example.com', 'pbkdf2:sha256:600000$MockHashStringForUserDavid103', 0),
('Liam Parker', 'liam.p@example.com', 'pbkdf2:sha256:600000$MockHashStringForUserLiam104', 0),
('Olivia Brown', 'olivia.b@example.com', 'pbkdf2:sha256:600000$MockHashStringForUserOlivia105', 0),
('Ethan Clark', 'ethan.c@example.com', 'pbkdf2:sha256:600000$MockHashStringForUserEthan106', 0),

-- 额外的测试用户
('1029', '1029573707@qq.com', 'scrypt:32768:8:1$vJSwgTxLwWd8rHxm$86061930eda58f02af967d02715334e2dd07286af424bfd48ccd408025aa1e21b03127d23bbf2bad926f8505aa992f3713cb68e7c0055504b5a40f37297033be', 0);