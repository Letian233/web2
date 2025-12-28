"""
菜單過濾與排序工具模組

此模組提供手動實現的過濾和排序功能，用於菜單數據處理。
不使用 SQL ORDER BY 或 Python 內建的 .sort() 方法。

時間複雜度分析：
- 快速排序 (Quick Sort): 平均時間複雜度 O(n log n)，最壞情況 O(n²)
  - 當樞軸 (pivot) 選擇不當（如已排序數組選首/尾元素）會導致最壞情況
  - 本實現使用「三數取中」策略優化樞軸選擇，減少最壞情況發生概率
  - 空間複雜度 O(log n)（遞迴調用棧）

- 過濾操作: O(n)，需遍歷所有項目進行條件檢查
- 總體複雜度: O(n) + O(n log n) = O(n log n)
"""

from typing import List, Dict, Any, Optional, Callable


# ==============================================================================
# 快速排序算法實現 (Quick Sort Implementation)
# ==============================================================================
# 
# 算法原理：
# 1. 選擇一個樞軸元素 (pivot)
# 2. 將數組分為兩部分：小於樞軸的元素和大於樞軸的元素
# 3. 遞迴地對兩個子數組進行排序
# 4. 合併結果
#
# 時間複雜度：
# - 最佳情況: O(n log n) - 每次分割都平均
# - 平均情況: O(n log n) - 統計平均
# - 最壞情況: O(n²) - 每次分割極度不平衡（如已排序數組）
#
# 空間複雜度: O(log n) - 遞迴調用棧深度
# ==============================================================================


def _get_pivot_index(arr: List[Dict], low: int, high: int, key_func: Callable) -> int:
    """
    使用「三數取中」策略選擇樞軸索引，以優化最壞情況性能。
    
    比較 arr[low], arr[mid], arr[high] 的值，返回中間值的索引。
    這樣可以避免在已排序或逆序數組上出現 O(n²) 的最壞情況。
    
    時間複雜度: O(1)
    """
    mid = (low + high) // 2
    
    val_low = key_func(arr[low])
    val_mid = key_func(arr[mid])
    val_high = key_func(arr[high])
    
    # 找出中間值對應的索引
    if val_low <= val_mid <= val_high or val_high <= val_mid <= val_low:
        return mid
    elif val_mid <= val_low <= val_high or val_high <= val_low <= val_mid:
        return low
    else:
        return high


def _partition(
    arr: List[Dict],
    low: int,
    high: int,
    key_func: Callable,
    reverse: bool = False
) -> int:
    """
    分區函數：將數組分為兩部分。
    
    使用 Lomuto 分區方案：
    1. 選擇樞軸並將其移到末尾
    2. 維護一個索引 i，表示「小於樞軸區域」的邊界
    3. 遍歷數組，將符合條件的元素交換到前面
    4. 最後將樞軸放到正確位置
    
    時間複雜度: O(n)，其中 n = high - low + 1
    空間複雜度: O(1)
    
    Args:
        arr: 待分區的數組
        low: 分區起始索引
        high: 分區結束索引
        key_func: 提取排序鍵的函數
        reverse: 是否降序排列
    
    Returns:
        樞軸的最終位置索引
    """
    # 使用三數取中選擇樞軸
    pivot_idx = _get_pivot_index(arr, low, high, key_func)
    
    # 將樞軸移到末尾
    arr[pivot_idx], arr[high] = arr[high], arr[pivot_idx]
    pivot_value = key_func(arr[high])
    
    # i 是「小於樞軸區域」的邊界
    i = low - 1
    
    for j in range(low, high):
        current_value = key_func(arr[j])
        
        # 根據排序方向決定比較邏輯
        if reverse:
            # 降序：大的在前
            should_swap = current_value > pivot_value
        else:
            # 升序：小的在前
            should_swap = current_value < pivot_value
        
        if should_swap:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    
    # 將樞軸放到正確位置
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    
    return i + 1


def _quick_sort_recursive(
    arr: List[Dict],
    low: int,
    high: int,
    key_func: Callable,
    reverse: bool = False
) -> None:
    """
    快速排序遞迴實現（原地排序）。
    
    遞迴終止條件: low >= high（子數組為空或只有一個元素）
    
    時間複雜度: O(n log n) 平均，O(n²) 最壞
    空間複雜度: O(log n) 遞迴棧空間
    
    Args:
        arr: 待排序數組（原地修改）
        low: 排序範圍起始索引
        high: 排序範圍結束索引
        key_func: 提取排序鍵的函數
        reverse: 是否降序排列
    """
    if low < high:
        # 分區並獲取樞軸位置
        pivot_index = _partition(arr, low, high, key_func, reverse)
        
        # 遞迴排序左右兩個子數組
        _quick_sort_recursive(arr, low, pivot_index - 1, key_func, reverse)
        _quick_sort_recursive(arr, pivot_index + 1, high, key_func, reverse)


def quick_sort(
    items: List[Dict],
    sort_by: str = "price",
    reverse: bool = False
) -> List[Dict]:
    """
    對菜單項目列表進行快速排序。
    
    這是快速排序的主入口函數，支持按不同字段排序。
    
    算法特點：
    - 原地排序（in-place），但這裡返回新列表以保持原數據不變
    - 不穩定排序（相等元素的相對順序可能改變）
    - 使用「三數取中」優化樞軸選擇
    
    時間複雜度分析：
    - 分割操作: O(n)
    - 遞迴層數: 平均 O(log n)，最壞 O(n)
    - 總體: 平均 O(n log n)，最壞 O(n²)
    
    Args:
        items: 菜單項目字典列表
        sort_by: 排序字段，支持 "price" 或 "rating"
        reverse: 是否降序排列
                 - 價格: False = 低到高, True = 高到低
                 - 評分: False = 低到高, True = 高到低
    
    Returns:
        排序後的新列表（不修改原列表）
    
    Example:
        >>> items = [{"name": "Pizza", "price": 15.99}, {"name": "Salad", "price": 8.99}]
        >>> sorted_items = quick_sort(items, sort_by="price", reverse=False)
        >>> print(sorted_items[0]["name"])  # "Salad" (價格較低)
    """
    if not items:
        return []
    
    # 複製列表以保持原數據不變
    result = items.copy()
    
    # 定義鍵提取函數
    def key_func(item: Dict) -> float:
        value = item.get(sort_by, 0)
        # 處理 None 或無效值
        try:
            return float(value) if value is not None else 0.0
        except (TypeError, ValueError):
            return 0.0
    
    # 執行快速排序
    if len(result) > 1:
        _quick_sort_recursive(result, 0, len(result) - 1, key_func, reverse)
    
    return result


# ==============================================================================
# 過濾函數實現 (Filtering Implementation)
# ==============================================================================
#
# 時間複雜度: O(n) - 需要遍歷所有項目進行條件檢查
# 空間複雜度: O(k) - k 為符合條件的項目數量
# ==============================================================================


def filter_menu_items(
    items: List[Dict],
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search_query: Optional[str] = None
) -> List[Dict]:
    """
    根據條件過濾菜單項目。
    
    過濾邏輯：
    1. 類別過濾 (category): 精確匹配（不區分大小寫）
    2. 價格範圍 (min_price, max_price): 包含邊界值
    3. 搜索查詢 (search_query): 在名稱和描述中進行模糊匹配
    
    時間複雜度: O(n) - 遍歷所有項目
    空間複雜度: O(k) - k 為符合條件的項目數量
    
    Args:
        items: 原始菜單項目列表
        category: 過濾類別（如 "Main Course", "Dessert", "Appetizer"）
        min_price: 最低價格（包含）
        max_price: 最高價格（包含）
        search_query: 搜索關鍵詞（在名稱和描述中搜索）
    
    Returns:
        過濾後的項目列表
    
    Example:
        >>> items = [{"name": "Pizza", "price": 15.99, "category": "Main Course"}, ...]
        >>> filtered = filter_menu_items(items, category="Main Course", max_price=20.0)
    """
    if not items:
        return []
    
    result = []
    
    for item in items:
        # 類別過濾
        if category:
            item_category = (item.get("category") or "").strip().lower()
            filter_category = category.strip().lower()
            if item_category != filter_category:
                continue
        
        # 價格過濾
        try:
            item_price = float(item.get("price", 0))
        except (TypeError, ValueError):
            item_price = 0.0
        
        if min_price is not None and item_price < min_price:
            continue
        
        if max_price is not None and item_price > max_price:
            continue
        
        # 搜索查詢過濾（名稱和描述）
        if search_query:
            query_lower = search_query.strip().lower()
            item_name = (item.get("name") or "").lower()
            item_description = (item.get("description") or "").lower()
            
            if query_lower not in item_name and query_lower not in item_description:
                continue
        
        # 通過所有過濾條件
        result.append(item)
    
    return result


# ==============================================================================
# 主要入口函數：過濾 + 排序
# ==============================================================================


def filter_and_sort_menu(
    items: List[Dict],
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search_query: Optional[str] = None,
    sort_by: str = "price",
    sort_order: str = "asc"
) -> Dict[str, Any]:
    """
    對菜單項目進行過濾和排序的主函數。
    
    處理流程：
    1. 過濾 - O(n)
    2. 排序 - O(m log m)，其中 m 為過濾後的項目數
    
    總時間複雜度: O(n + m log m)
    - n: 原始項目數量
    - m: 過濾後項目數量（m ≤ n）
    
    最壞情況（無過濾）: O(n log n)
    
    Args:
        items: 原始菜單項目列表
        category: 過濾類別
        min_price: 最低價格
        max_price: 最高價格
        search_query: 搜索關鍵詞
        sort_by: 排序字段 ("price" 或 "rating")
        sort_order: 排序方向 ("asc" 升序, "desc" 降序)
    
    Returns:
        包含以下鍵的字典:
        - "items": 過濾並排序後的項目列表
        - "total": 結果總數
        - "filters_applied": 應用的過濾條件
        - "sort_applied": 應用的排序條件
    
    Example:
        >>> result = filter_and_sort_menu(
        ...     items,
        ...     category="Main Course",
        ...     min_price=10.0,
        ...     max_price=30.0,
        ...     sort_by="price",
        ...     sort_order="asc"
        ... )
        >>> print(f"Found {result['total']} items")
    """
    # 步驟 1: 過濾 - O(n)
    filtered_items = filter_menu_items(
        items,
        category=category,
        min_price=min_price,
        max_price=max_price,
        search_query=search_query
    )
    
    # 步驟 2: 排序 - O(m log m)
    # 確定排序方向
    reverse = sort_order.lower() == "desc"
    
    # 對於評分，用戶通常期望「由高到低」，所以默認 desc
    # 對於價格，用戶通常期望「由低到高」，所以默認 asc
    sorted_items = quick_sort(
        filtered_items,
        sort_by=sort_by,
        reverse=reverse
    )
    
    # 構建響應
    return {
        "items": sorted_items,
        "total": len(sorted_items),
        "filters_applied": {
            "category": category,
            "min_price": min_price,
            "max_price": max_price,
            "search_query": search_query
        },
        "sort_applied": {
            "sort_by": sort_by,
            "sort_order": sort_order
        }
    }


# ==============================================================================
# 獲取所有可用的類別（用於前端過濾下拉選單）
# ==============================================================================


def get_unique_categories(items: List[Dict]) -> List[str]:
    """
    從菜單項目中提取所有唯一的類別。
    
    時間複雜度: O(n)
    空間複雜度: O(c)，其中 c 為唯一類別數量
    
    Args:
        items: 菜單項目列表
    
    Returns:
        按字母排序的唯一類別列表
    """
    categories = set()
    for item in items:
        category = (item.get("category") or "").strip()
        if category:
            categories.add(category)
    
    # 返回排序後的列表（這裡使用簡單的快速排序來保持一致性）
    result = list(categories)
    
    # 對類別名稱進行快速排序
    if len(result) > 1:
        # 使用遞迴快速排序對字符串列表排序
        def str_key(item):
            return {"name": item}
        
        temp_list = [{"name": c} for c in result]
        
        def str_key_func(item):
            return item["name"].lower()
        
        if len(temp_list) > 1:
            _quick_sort_recursive(temp_list, 0, len(temp_list) - 1, str_key_func, False)
        
        result = [item["name"] for item in temp_list]
    
    return result


def get_price_range(items: List[Dict]) -> Dict[str, float]:
    """
    獲取菜單項目的價格範圍。
    
    時間複雜度: O(n)
    空間複雜度: O(1)
    
    Args:
        items: 菜單項目列表
    
    Returns:
        包含 "min" 和 "max" 的字典
    """
    if not items:
        return {"min": 0.0, "max": 0.0}
    
    min_price = float('inf')
    max_price = float('-inf')
    
    for item in items:
        try:
            price = float(item.get("price", 0))
            if price < min_price:
                min_price = price
            if price > max_price:
                max_price = price
        except (TypeError, ValueError):
            continue
    
    # 處理沒有有效價格的情況
    if min_price == float('inf'):
        min_price = 0.0
    if max_price == float('-inf'):
        max_price = 0.0
    
    return {"min": min_price, "max": max_price}

