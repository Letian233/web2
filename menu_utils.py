"""
Menu filtering and sorting utility module

This module provides manually implemented filtering and sorting
functionality for menu data processing.
Does not use SQL ORDER BY or Python's built-in .sort() method.

Time complexity analysis:
- Quick Sort: Average time complexity O(n log n), worst case O(n²)
  - Worst case occurs when pivot selection is poor
    (e.g., selecting first/last element of sorted array)
  - This implementation uses "median of three" strategy
    to optimize pivot selection,
    reducing worst case probability
  - Space complexity O(log n) (recursive call stack)

- Filtering operation: O(n),
  requires traversing all items for condition checking
- Overall complexity: O(n) + O(n log n) = O(n log n)
"""

from typing import List, Dict, Any, Optional, Callable

# ==============================================================================
# Quick Sort Algorithm Implementation
# ==============================================================================
#
# Algorithm principle:
# 1. Select a pivot element
# 2. Partition array into two parts: elements less than pivot
#    and elements greater than pivot
# 3. Recursively sort the two sub-arrays
# 4. Combine results
# ==============================================================================


def _get_pivot_index(
    arr: List[Dict], low: int, high: int, key_func: Callable
) -> int:
    """
    Select pivot index using "median of three" strategy
    to optimize worst-case performance.

    Compare values of arr[low], arr[mid], arr[high],
    return index of median value.
    This avoids O(n²) worst case on sorted or
    reverse-sorted arrays.

    Time complexity: O(1)
    """
    mid = (low + high) // 2

    val_low = key_func(arr[low])
    val_mid = key_func(arr[mid])
    val_high = key_func(arr[high])

    # Find index corresponding to median value
    if (val_low <= val_mid <= val_high or
            val_high <= val_mid <= val_low):
        return mid
    elif (val_mid <= val_low <= val_high or
          val_high <= val_low <= val_mid):
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
    Partition function: divide array into two parts.

    Uses Lomuto partition scheme:
    1. Select pivot and move it to the end
    2. Maintain an index i representing the boundary of
       "less than pivot region"
    3. Traverse array, swap qualifying elements to the front
    4. Finally place pivot in correct position

    Time complexity: O(n), where n = high - low + 1
    Space complexity: O(1)

    Args:
        arr: Array to partition
        low: Partition start index
        high: Partition end index
        key_func: Function to extract sort key
        reverse: Whether to sort in descending order

    Returns:
        Final position index of pivot
    """
    # Use median of three to select pivot
    pivot_idx = _get_pivot_index(arr, low, high, key_func)

    # Move pivot to end
    arr[pivot_idx], arr[high] = arr[high], arr[pivot_idx]
    pivot_value = key_func(arr[high])

    # i is the boundary of "less than pivot region"
    i = low - 1

    for j in range(low, high):
        current_value = key_func(arr[j])

        # Determine comparison logic based on sort direction
        if reverse:
            # Descending: larger values first
            should_swap = current_value > pivot_value
        else:
            # Ascending: smaller values first
            should_swap = current_value < pivot_value

        if should_swap:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]

    # Place pivot in correct position
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
    Recursive quick sort implementation (in-place sorting).

    Recursion termination condition: low >= high
    (sub-array is empty or has one element)

    Time complexity: O(n log n) average, O(n²) worst case
    Space complexity: O(log n) recursive stack space

    Args:
        arr: Array to sort (modified in-place)
        low: Sort range start index
        high: Sort range end index
        key_func: Function to extract sort key
        reverse: Whether to sort in descending order
    """
    if low < high:
        # Partition and get pivot position
        pivot_index = _partition(arr, low, high, key_func, reverse)

        # Recursively sort left and right sub-arrays
        _quick_sort_recursive(
            arr, low, pivot_index - 1, key_func, reverse
        )
        _quick_sort_recursive(
            arr, pivot_index + 1, high, key_func, reverse
        )


def quick_sort(
    items: List[Dict],
    sort_by: str = "price",
    reverse: bool = False
) -> List[Dict]:
    """
    Perform quick sort on menu item list.

    This is the main entry function for quick sort,
    supports sorting by different fields.

    Algorithm characteristics:
    - In-place sorting, but returns new list here
      to keep original data unchanged
    - Unstable sort (relative order of equal elements may change)
    - Uses "median of three" to optimize pivot selection

    Time complexity analysis:
    - Partition operation: O(n)
    - Recursion depth: O(log n) average, O(n) worst case
    - Overall: O(n log n) average, O(n²) worst case

    Args:
        items: List of menu item dictionaries
        sort_by: Sort field, supports "price" or "rating"
        reverse: Whether to sort in descending order
                 - Price: False = low to high, True = high to low
                 - Rating: False = low to high, True = high to low

    Returns:
        New sorted list (does not modify original list)

    Example:
        >>> items = [
        ...     {"name": "Pizza", "price": 15.99},
        ...     {"name": "Salad", "price": 8.99}
        ... ]
        >>> sorted_items = quick_sort(
        ...     items, sort_by="price", reverse=False
        ... )
        >>> print(sorted_items[0]["name"])  # "Salad" (lower price)
    """
    if not items:
        return []

    # Copy list to keep original data unchanged
    result = items.copy()

    # Define key extraction function
    def key_func(item: Dict) -> float:
        value = item.get(sort_by, 0)
        # Handle None or invalid values
        try:
            return float(value) if value is not None else 0.0
        except (TypeError, ValueError):
            return 0.0

    # Execute quick sort
    if len(result) > 1:
        _quick_sort_recursive(result, 0, len(result) - 1, key_func, reverse)

    return result


# ==============================================================================
# Filtering Function Implementation
# ==============================================================================
#
# Time complexity: O(n) - need to traverse all items for condition checking
# Space complexity: O(k) - k is number of items matching conditions
# ==============================================================================


def filter_menu_items(
    items: List[Dict],
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search_query: Optional[str] = None
) -> List[Dict]:
    """
    Filter menu items based on conditions.

    Filtering logic:
    1. Category filter (category): Exact match (case-insensitive)
    2. Price range (min_price, max_price): Inclusive boundaries
    3. Search query (search_query): Fuzzy matching in name and description

    Time complexity: O(n) - traverse all items
    Space complexity: O(k) - k is number of items matching conditions

    Args:
        items: Original menu item list
        category: Filter category
        (e.g., "Main Course", "Dessert", "Appetizer")
        min_price: Minimum price (inclusive)
        max_price: Maximum price (inclusive)
        search_query: Search keyword (searches in name and description)

    Returns:
        Filtered item list

    Example:
        >>> items = [
        ...     {"name": "Pizza", "price": 15.99, "category": "Main Course"},
        ...     ...
        ... ]
        >>> filtered = filter_menu_items(
        ...     items, category="Main Course", max_price=20.0
        ... )
    """
    if not items:
        return []

    result = []

    for item in items:
        # Category filter
        if category:
            item_category = (item.get("category") or "").strip().lower()
            filter_category = category.strip().lower()
            if item_category != filter_category:
                continue

        # Price filter
        try:
            item_price = float(item.get("price", 0))
        except (TypeError, ValueError):
            item_price = 0.0

        if min_price is not None and item_price < min_price:
            continue

        if max_price is not None and item_price > max_price:
            continue

        # Search query filter (name and description)
        if search_query:
            query_lower = search_query.strip().lower()
            item_name = (item.get("name") or "").lower()
            item_description = (item.get("description") or "").lower()

            if (query_lower not in item_name and
                    query_lower not in item_description):
                continue

        # Passed all filter conditions
        result.append(item)

    return result


# ==============================================================================
# Main Entry Function: Filter + Sort
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
    Main function for filtering and sorting menu items.

    Processing flow:
    1. Filter - O(n)
    2. Sort - O(m log m), where m is number of filtered items

    Total time complexity: O(n + m log m)
    - n: Original item count
    - m: Filtered item count (m ≤ n)

    Worst case (no filtering): O(n log n)

    Args:
        items: Original menu item list
        category: Filter category
        min_price: Minimum price
        max_price: Maximum price
        search_query: Search keyword
        sort_by: Sort field ("price" or "rating")
        sort_order: Sort direction ("asc" ascending, "desc" descending)

    Returns:
        Dictionary containing the following keys:
        - "items": Filtered and sorted item list
        - "total": Total result count
        - "filters_applied": Applied filter conditions
        - "sort_applied": Applied sort conditions

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
    # Step 1: Filter - O(n)
    filtered_items = filter_menu_items(
        items,
        category=category,
        min_price=min_price,
        max_price=max_price,
        search_query=search_query
    )

    # Step 2: Sort - O(m log m)
    # Determine sort direction
    reverse = sort_order.lower() == "desc"

    # For ratings, users typically expect "high to low", so default desc
    # For prices, users typically expect "low to high", so default asc
    sorted_items = quick_sort(
        filtered_items,
        sort_by=sort_by,
        reverse=reverse
    )

    # Build response
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
# Get All Available Categories (for frontend filter dropdown)
# ==============================================================================


def get_unique_categories(items: List[Dict]) -> List[str]:
    """
    Extract all unique categories from menu items.

    Time complexity: O(n)
    Space complexity: O(c), where c is number of unique categories

    Args:
        items: Menu item list

    Returns:
        Alphabetically sorted unique category list
    """
    categories = set()
    for item in items:
        category = (item.get("category") or "").strip()
        if category:
            categories.add(category)

    # Return sorted list (using simple quick sort here for consistency)
    result = list(categories)

    # Perform quick sort on category names
    if len(result) > 1:
        # Use recursive quick sort to sort string list
        def str_key(item):
            return {"name": item}

        temp_list = [{"name": c} for c in result]

        def str_key_func(item):
            return item["name"].lower()

        if len(temp_list) > 1:
            _quick_sort_recursive(
                temp_list, 0, len(temp_list) - 1, str_key_func, False
            )

        result = [item["name"] for item in temp_list]

    return result


def get_price_range(items: List[Dict]) -> Dict[str, float]:
    """
    Get price range of menu items.

    Time complexity: O(n)
    Space complexity: O(1)

    Args:
        items: Menu item list

    Returns:
        Dictionary containing "min" and "max"
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

    # Handle case where no valid prices exist
    if min_price == float('inf'):
        min_price = 0.0
    if max_price == float('-inf'):
        max_price = 0.0

    return {"min": min_price, "max": max_price}
