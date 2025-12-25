// ==================== 数据层 ====================
// 菜单数据库（完全由后端提供）
// Flask 通过 window.MENU_ITEMS_FROM_DB 注入来自 MySQL menu_items 表的数据。

// 后端注入的原始菜单数据（可能为 null 或空数组）
const RAW_MENU_FROM_DB =
  typeof window !== 'undefined' && Array.isArray(window.MENU_ITEMS_FROM_DB)
    ? window.MENU_ITEMS_FROM_DB
    : null;

// 统一构建 MENU_DATABASE，字段结构：id, name, price, image, description, category, rating
// 不再使用前端占位的静态菜单数据，如果后端没传数据则视为无菜单项。
const MENU_SOURCE =
  RAW_MENU_FROM_DB && RAW_MENU_FROM_DB.length ? RAW_MENU_FROM_DB : [];

const MENU_DATABASE = MENU_SOURCE.map((item, index) => {
  const rawImage = item.image_url || item.image || '../images/pizza1.jpg';
  return {
    id: item.id || index + 1,
    name: item.name,
    price: Number(item.price),
    image: rawImage,
    description: item.description || '',
    category: item.category || '',
    rating: typeof item.rating === 'number' ? item.rating : 0
  };
});

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

// 历史订单数据改由后端 API `/api/orders` 提供，这里不再定义静态 MOCK_ORDER_HISTORY。

