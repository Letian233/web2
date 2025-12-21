CREATE TABLE menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL, -- 推薦使用 DECIMAL 存儲貨幣
    description TEXT,
    image_url VARCHAR(200),        -- 例如: '../images/pizza1.jpg'
    category VARCHAR(50),          -- 例如: 'Main Course'
    rating FLOAT DEFAULT 0.0
);


INSERT INTO menu_items (id, name, price, image_url, description, category, rating) VALUES 
(1, 'Pizza', 25.00, '../images/pizza1.jpg', 'Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra.', 'Main Course', 3.5),
(2, 'Black Forest Cake', 20.00, '../images/black_cake.jpg', 'Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra.', 'Dessert', 4.0),
(3, 'Boeuf Bourguignon', 45.00, '../images/beef-stew-15.png', 'Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra.', 'Main Course', 5.0),
(4, 'French Snails', 30.00, '../images/snails.jpg', 'Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra.', 'Appetizer', 2.5),
(5, 'Seafood Pasta', 28.00, '../images/pizza1.jpg', 'Fresh seafood with traditional pasta, served with a white wine cream sauce. A delightful combination of ocean flavors and Italian tradition.', 'Main Course', 4.5),
(6, 'Mediterranean Salad', 15.00, '../images/black_cake.jpg', 'A mix of green leaves, cherry tomatoes, olives, and feta cheese. Fresh, healthy, and bursting with Mediterranean flavors.', 'Salad', 4.0),
(7, 'Pan-Seared Salmon', 32.00, '../images/beef-stew-15.png', 'Premium Norwegian salmon with a side of lemon butter sauce and seasonal vegetables. Perfectly cooked to maintain its tenderness.', 'Main Course', 4.5),
(8, 'Mushroom Risotto', 24.00, '../images/snails.jpg', 'A rich and creamy mushroom risotto infused with Parmesan cheese and fresh herbs. A comforting Italian classic.', 'Main Course', 4.0),
(9, 'Chocolate Lava Cake', 18.00, '../images/pizza1.jpg', 'Warm chocolate cake with a molten center, served with vanilla ice cream. A decadent dessert that melts in your mouth.', 'Dessert', 5.0),
(10, 'Caesar Salad', 14.00, '../images/black_cake.jpg', 'Classic Caesar salad with crisp romaine lettuce, parmesan cheese, croutons, and our signature Caesar dressing.', 'Salad', 4.0),
(11, 'Grilled Chicken Breast', 22.00, '../images/beef-stew-15.png', 'Tender grilled chicken breast marinated in herbs and spices, served with roasted vegetables and a side of mashed potatoes.', 'Main Course', 4.5),
(12, 'Tiramisu', 16.00, '../images/pizza1.jpg', 'Classic Italian dessert made with layers of coffee-soaked ladyfingers, mascarpone cheese, and cocoa powder.', 'Dessert', 5.0),
(13, 'Beef Ribs', 38.00, '../images/beef-stew-15.png', 'Slow-roasted beef ribs with our signature barbecue sauce, served with coleslaw and cornbread. A hearty meal that satisfies.', 'Main Course', 4.5),
(14, 'Caprese Salad', 13.00, '../images/black_cake.jpg', 'Fresh mozzarella, ripe tomatoes, and basil leaves drizzled with extra virgin olive oil and balsamic glaze.', 'Salad', 4.5),
(15, 'Lobster Bisque', 26.00, '../images/snails.jpg', 'Rich and creamy lobster soup with a hint of brandy, garnished with fresh herbs and a dollop of crème fraîche.', 'Soup', 4.5),
(16, 'Margherita Pizza', 18.00, '../images/pizza1.jpg', 'Traditional Italian pizza with fresh mozzarella, tomato sauce, and basil leaves. Simple, classic, and delicious.', 'Main Course', 4.5),
(17, 'Chocolate Mousse', 15.00, '../images/black_cake.jpg', 'Silky smooth dark chocolate mousse topped with whipped cream and chocolate shavings. A decadent treat for chocolate lovers.', 'Dessert', 4.5),
(18, 'Fish and Chips', 20.00, '../images/beef-stew-15.png', 'Beer-battered cod served with crispy golden fries, mushy peas, and tartar sauce. A British classic done right.', 'Main Course', 4.0),
(19, 'Greek Salad', 16.00, '../images/black_cake.jpg', 'Fresh cucumbers, tomatoes, red onions, Kalamata olives, and feta cheese with a lemon-oregano vinaigrette.', 'Salad', 4.5),
(20, 'Apple Pie', 12.00, '../images/pizza1.jpg', 'Homemade apple pie with a flaky crust, filled with cinnamon-spiced apples and served warm with vanilla ice cream.', 'Dessert', 4.5);