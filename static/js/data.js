// ==================== 数据层 ====================
// 菜单数据库（模拟后端数据）
// 扩展为数组格式，包含详细信息
const MENU_DATABASE = [
  {
    id: 1,
    name: 'Pizza',
    price: 25,
    image: '../images/pizza1.jpg',
    description: 'Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra.',
    category: 'Main Course',
    rating: 3.5
  },
  {
    id: 2,
    name: 'Black Forest Cake',
    price: 20,
    image: '../images/black_cake.jpg',
    description: 'Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra.',
    category: 'Dessert',
    rating: 4.0
  },
  {
    id: 3,
    name: 'Boeuf Bourguignon',
    price: 45,
    image: '../images/beef-stew-15.png',
    description: 'Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra.',
    category: 'Main Course',
    rating: 5.0
  },
  {
    id: 4,
    name: 'French Snails',
    price: 30,
    image: '../images/snails.jpg',
    description: 'Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra.',
    category: 'Appetizer',
    rating: 2.5
  },
  {
    id: 5,
    name: 'Seafood Pasta',
    price: 28,
    image: '../images/pizza1.jpg',
    description: 'Fresh seafood with traditional pasta, served with a white wine cream sauce. A delightful combination of ocean flavors and Italian tradition.',
    category: 'Main Course',
    rating: 4.5
  },
  {
    id: 6,
    name: 'Mediterranean Salad',
    price: 15,
    image: '../images/black_cake.jpg',
    description: 'A mix of green leaves, cherry tomatoes, olives, and feta cheese. Fresh, healthy, and bursting with Mediterranean flavors.',
    category: 'Salad',
    rating: 4.0
  },
  {
    id: 7,
    name: 'Pan-Seared Salmon',
    price: 32,
    image: '../images/beef-stew-15.png',
    description: 'Premium Norwegian salmon with a side of lemon butter sauce and seasonal vegetables. Perfectly cooked to maintain its tenderness.',
    category: 'Main Course',
    rating: 4.5
  },
  {
    id: 8,
    name: 'Mushroom Risotto',
    price: 24,
    image: '../images/snails.jpg',
    description: 'A rich and creamy mushroom risotto infused with Parmesan cheese and fresh herbs. A comforting Italian classic.',
    category: 'Main Course',
    rating: 4.0
  },
  {
    id: 9,
    name: 'Chocolate Lava Cake',
    price: 18,
    image: '../images/pizza1.jpg',
    description: 'Warm chocolate cake with a molten center, served with vanilla ice cream. A decadent dessert that melts in your mouth.',
    category: 'Dessert',
    rating: 5.0
  },
  {
    id: 10,
    name: 'Caesar Salad',
    price: 14,
    image: '../images/black_cake.jpg',
    description: 'Classic Caesar salad with crisp romaine lettuce, parmesan cheese, croutons, and our signature Caesar dressing.',
    category: 'Salad',
    rating: 4.0
  },
  {
    id: 11,
    name: 'Grilled Chicken Breast',
    price: 22,
    image: '../images/beef-stew-15.png',
    description: 'Tender grilled chicken breast marinated in herbs and spices, served with roasted vegetables and a side of mashed potatoes.',
    category: 'Main Course',
    rating: 4.5
  },
  {
    id: 12,
    name: 'Tiramisu',
    price: 16,
    image: '../images/pizza1.jpg',
    description: 'Classic Italian dessert made with layers of coffee-soaked ladyfingers, mascarpone cheese, and cocoa powder.',
    category: 'Dessert',
    rating: 5.0
  },
  {
    id: 13,
    name: 'Beef Ribs',
    price: 38,
    image: '../images/beef-stew-15.png',
    description: 'Slow-roasted beef ribs with our signature barbecue sauce, served with coleslaw and cornbread. A hearty meal that satisfies.',
    category: 'Main Course',
    rating: 4.5
  },
  {
    id: 14,
    name: 'Caprese Salad',
    price: 13,
    image: '../images/black_cake.jpg',
    description: 'Fresh mozzarella, ripe tomatoes, and basil leaves drizzled with extra virgin olive oil and balsamic glaze.',
    category: 'Salad',
    rating: 4.5
  },
  {
    id: 15,
    name: 'Lobster Bisque',
    price: 26,
    image: '../images/snails.jpg',
    description: 'Rich and creamy lobster soup with a hint of brandy, garnished with fresh herbs and a dollop of crème fraîche.',
    category: 'Soup',
    rating: 4.5
  },
  {
    id: 16,
    name: 'Margherita Pizza',
    price: 18,
    image: '../images/pizza1.jpg',
    description: 'Traditional Italian pizza with fresh mozzarella, tomato sauce, and basil leaves. Simple, classic, and delicious.',
    category: 'Main Course',
    rating: 4.5
  },
  {
    id: 17,
    name: 'Chocolate Mousse',
    price: 15,
    image: '../images/black_cake.jpg',
    description: 'Silky smooth dark chocolate mousse topped with whipped cream and chocolate shavings. A decadent treat for chocolate lovers.',
    category: 'Dessert',
    rating: 4.5
  },
  {
    id: 18,
    name: 'Fish and Chips',
    price: 20,
    image: '../images/beef-stew-15.png',
    description: 'Beer-battered cod served with crispy golden fries, mushy peas, and tartar sauce. A British classic done right.',
    category: 'Main Course',
    rating: 4.0
  },
  {
    id: 19,
    name: 'Greek Salad',
    price: 16,
    image: '../images/black_cake.jpg',
    description: 'Fresh cucumbers, tomatoes, red onions, Kalamata olives, and feta cheese with a lemon-oregano vinaigrette.',
    category: 'Salad',
    rating: 4.5
  },
  {
    id: 20,
    name: 'Apple Pie',
    price: 12,
    image: '../images/pizza1.jpg',
    description: 'Homemade apple pie with a flaky crust, filled with cinnamon-spiced apples and served warm with vanilla ice cream.',
    category: 'Dessert',
    rating: 4.5
  }
];

// 保留 menuDatabase 对象格式以兼容现有购物车代码
const menuDatabase = {};
MENU_DATABASE.forEach(item => {
  menuDatabase[item.id] = {
    id: item.id,
    name: item.name,
    price: item.price,
    image: item.image
  };
});

// ==================== 模拟历史订单数据（体现多对多关系） ====================
// 订单与菜品是多对多关系：一个订单可以包含多个菜品，一个菜品可以出现在多个订单中
const MOCK_ORDER_HISTORY = [
  {
    orderId: 'ORD-001',
    date: '2024-01-15',
    total: 50.00,
    items: [
      { id: 1, name: 'Pizza', price: 25, quantity: 1 },
      { id: 2, name: 'Black Forest Cake', price: 20, quantity: 1 }
    ]
  },
  {
    orderId: 'ORD-002',
    date: '2024-01-16',
    total: 75.00,
    items: [
      { id: 1, name: 'Pizza', price: 25, quantity: 2 },
      { id: 3, name: 'Boeuf Bourguignon', price: 45, quantity: 1 }
    ]
  },
  {
    orderId: 'ORD-003',
    date: '2024-01-17',
    total: 100.00,
    items: [
      { id: 1, name: 'Pizza', price: 25, quantity: 1 },
      { id: 4, name: 'French Snails', price: 30, quantity: 2 },
      { id: 2, name: 'Black Forest Cake', price: 20, quantity: 1 }
    ]
  },
  {
    orderId: 'ORD-004',
    date: '2024-01-18',
    total: 45.00,
    items: [
      { id: 3, name: 'Boeuf Bourguignon', price: 45, quantity: 1 }
    ]
  },
  {
    orderId: 'ORD-005',
    date: '2024-01-19',
    total: 70.00,
    items: [
      { id: 1, name: 'Pizza', price: 25, quantity: 2 },
      { id: 2, name: 'Black Forest Cake', price: 20, quantity: 1 }
    ]
  }
];

