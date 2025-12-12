// Check if the browser supports localStorage
if (typeof(Storage) !== "undefined") {

  // Function to save data to localStorage
  function saveToLocalStorage(key, value) {
    localStorage.setItem(key, value);
  }

  // Function to retrieve data from localStorage
  function getFromLocalStorage(key) {
    return localStorage.getItem(key);
  }

  // Function to remove data from localStorage
  function removeFromLocalStorage(key) {
    localStorage.removeItem(key);
  }

  // Function to clear all data from localStorage
  function clearLocalStorage() {
    localStorage.clear();
  }

  // Save an order to localStorage and to an array
  var allOrders = [];
  function saveOrder(pizzaType) {
    allOrders.push(pizzaType); // Add the new order to the array
    saveToLocalStorage('allOrders', JSON.stringify(allOrders)); // Save the array to localStorage
    alert('Order saved!');
  }

  // Get the last ordered item
  function getPreviousOrder() {
    var lastOrder = getFromLocalStorage('lastOrder');
    if (lastOrder) {
      alert('Your last order was: Pizza Type ' + lastOrder);
      document.getElementById('previousOrder').innerText = 'Your last order was:  ' + lastOrder;
    } else {
      alert('No previous order found.');
      document.getElementById('previousOrder').innerText = '';
    }
  }

  // Delete the information about the last order
  function deletePreviousOrder() {
    removeFromLocalStorage('lastOrder');
    alert('Previous order information has been deleted.');
    document.getElementById('previousOrder').innerText = '';
  }

  // Retrieve all orders from localStorage
  function getAllOrders() {
    var orders = getFromLocalStorage('allOrders');
    return orders ? JSON.parse(orders) : [];
  }

  // Display all orders
  function displayAllOrders() {
    var orders = getAllOrders();
    var displayElement = document.getElementById('orderHistory');
    displayElement.innerHTML = ''; // Clear existing orders
    orders.forEach(function(order, index) {
      var orderElement = document.createElement('div');
      orderElement.textContent = 'Order ' + (index + 1) + ': ' + order;
      var deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.className = 'delete-button'; // Apply CSS class
      deleteButton.onclick = function() {
        deleteOrder(index);
      };
      orderElement.appendChild(deleteButton);
      displayElement.appendChild(orderElement);
    });
  }

  // Delete an order at a specified index
  function deleteOrder(index) {
    var orders = getAllOrders();
    orders.splice(index, 1); // Remove the order at the specified index
    saveToLocalStorage('allOrders', JSON.stringify(orders)); // Update localStorage
    displayAllOrders(); // Redisplay all orders
  }

  // After the DOM is loaded, add a click event to each "Order Now" button
  document.addEventListener('DOMContentLoaded', function() {
    var orderButtons = document.querySelectorAll('.menu-order .button');
    
    orderButtons.forEach(function(button) {
      button.addEventListener('click', function(event) {
        event.preventDefault(); // Prevent the default link behavior
        var pizzaType = this.getAttribute('data-pizza-type'); // Get the pizza type of the current button
        saveOrder(pizzaType); // Save the order
      });
    });

    displayAllOrders(); // Display all orders
  });

} else {
  document.write("Sorry, your browser does not support Web Storage.");
}