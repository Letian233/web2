// ==================== Data Layer ====================
// Menu database (completely provided by backend)
// Flask injects data from MySQL menu_items table via window.MENU_ITEMS_FROM_DB.

// Raw menu data injected from backend (may be null or empty array)
const RAW_MENU_FROM_DB =
  typeof window !== 'undefined' && Array.isArray(window.MENU_ITEMS_FROM_DB)
    ? window.MENU_ITEMS_FROM_DB
    : null;

// Build MENU_DATABASE uniformly, field structure: id, name, price, image, description, category, rating
// No longer using frontend placeholder static menu data, if backend doesn't provide data, treat as no menu items.
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

// Keep menuDatabase object format for compatibility with existing cart code
const menuDatabase = {};
MENU_DATABASE.forEach(item => {
  menuDatabase[item.id] = {
    id: item.id,
    name: item.name,
    price: item.price,
    image: item.image
  };
});


