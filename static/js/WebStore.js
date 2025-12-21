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

  // Example: Save form data to localStorage
  function saveFormData() {
    var name = document.getElementById('name').value;
    var subject = document.getElementById('subject').value;
    var email = document.getElementById('email').value;
    var gender = document.getElementById('gender').value; // Get the value of the gender dropdown
    var satisfaction = document.getElementById('satisfaction').value; // Get the value of the satisfaction dropdown

    saveToLocalStorage('name', name);
    saveToLocalStorage('subject', subject);
    saveToLocalStorage('email', email);
    saveToLocalStorage('gender', gender);
    saveToLocalStorage('satisfaction', satisfaction);

    alert('Form data saved to localStorage!');
  }

  // Example: Retrieve form data from localStorage
  function getFormData() {
    var name = getFromLocalStorage('name');
    var subject = getFromLocalStorage('subject');
    var email = getFromLocalStorage('email');
    var gender = getFromLocalStorage('gender');
    var satisfaction = getFromLocalStorage('satisfaction');

    alert('Name: ' + name + '\nSubject: ' + subject + '\nEmail: ' + email + '\nGender: ' + gender + '\nSatisfaction: ' + satisfaction);
  }

  // Example: Remove form data from localStorage
  function removeFormData() {
    removeFromLocalStorage('name');
    removeFromLocalStorage('subject');
    removeFromLocalStorage('email');
    removeFromLocalStorage('gender');
    removeFromLocalStorage('satisfaction');

    alert('Form data removed from localStorage!');
  }

} else {
  document.write("Sorry, your browser does not support Web Storage.");
}