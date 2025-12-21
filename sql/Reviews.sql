CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    likes_count INT DEFAULT 0,
    parent_id INT DEFAULT NULL, -- 新增字段：用于存储父评论ID
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (parent_id) REFERENCES reviews(id) ON DELETE CASCADE -- 如果主评论删了，回复也一起删
);
INSERT INTO reviews (id, user_id, content, date, likes_count, parent_id) VALUES 
-- ==========================================
-- 1. John Doe (ID 4) 的主评论
-- ==========================================
(1, 4, 'I had the pan-seared steak at this restaurant last night, and it was tender and juicy with perfect seasoning. The herb sauce added a delightful touch to the dish. The service was attentive, making for a pleasant dining experience.', '2023-12-10 12:00:00', 5, NULL),

-- 针对 ID 1 的回复 (Admin ID 2 回复 John)
(101, 2, "Thank you for your kind words! We're glad you enjoyed the steak.", '2023-12-10 14:00:00', 0, 1),


-- ==========================================
-- 2. Emily Smith (ID 5) 的主评论
-- ==========================================
(2, 5, "The seafood pasta was a delightful surprise, with fresh seafood perfectly combined with pasta, and a rich sauce that wasn't too heavy. Every bite was a taste of the ocean's freshness. The ambiance was comfortable, perfect for sharing a meal with family and friends.", '2023-12-08 18:30:00', 8, NULL),

-- 针对 ID 2 的回复 (Chef Marco ID 3 回复 Emily)
(201, 3, "We're thrilled you enjoyed it! The seafood is sourced fresh daily.", '2023-12-08 20:00:00', 0, 2),
-- 针对 ID 2 的回复 (Emily ID 5 自己追加回复)
(202, 5, "Looking forward to visiting again soon!", '2023-12-09 09:00:00', 0, 2),


-- ==========================================
-- 3. Sarah Johnson (ID 6) 的主评论 (无回复)
-- ==========================================
(3, 6, "Dessert lovers must not miss the chocolate lava cake, with a crust that's just right and a molten chocolate center that flows out, sweet but not too rich. The vanilla ice cream that comes with it is the cherry on top.", '2023-12-05 20:15:00', 12, NULL),


-- ==========================================
-- 4. David Wilson (ID 7) 的主评论 (无回复)
-- ==========================================
(4, 7, "The roasted chicken had a crispy skin and juicy meat, seasoned just right to enhance the natural flavor of the chicken without overpowering it. The side dishes were also abundant, making it a satisfying main course overall.", '2023-12-03 19:00:00', 6, NULL),


-- ==========================================
-- 5. Liam Parker (ID 8) 的主评论
-- ==========================================
(5, 8, "Loved the vegetarian options! The grilled veggie platter was fresh, well-seasoned, and came with a tangy dip that tied everything together.", '2023-12-02 13:45:00', 4, NULL),

-- 针对 ID 5 的回复 (Chef Marco ID 3 回复 Liam)
(501, 3, "Thanks for trying our veggie platter! We rotate seasonal vegetables weekly—hope to see you again.", '2023-12-03 10:00:00', 0, 5),


-- ==========================================
-- 6. Olivia Brown (ID 9) 的主评论 (无回复)
-- ==========================================
(6, 9, "The tiramisu was spot on—not too sweet, with a balanced coffee kick. Portion size was generous for sharing.", '2023-12-01 21:00:00', 7, NULL),


-- ==========================================
-- 7. Ethan Clark (ID 10) 的主评论
-- ==========================================
(7, 10, "Great service and cozy ambience. The sourdough bread starter was warm and crusty, and the herb butter was addictive.", '2023-11-29 11:30:00', 3, NULL),

-- 针对 ID 7 的回复 (Admin ID 2 回复 Ethan)
(701, 2, "Glad you enjoyed the bread! We bake it in-house every morning.", '2023-11-30 08:00:00', 0, 7);
