document.addEventListener('DOMContentLoaded', function() {
    var buttons = document.querySelectorAll('.button');
    buttons.forEach(function(button) {
        button.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent the default link behavior
            var pizzaType = this.getAttribute('data-pizza-type'); // Get the pizza type
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    // Successfully obtained the location
                    var latitude = position.coords.latitude;
                    var longitude = position.coords.longitude;
                    // Here you can process the obtained location information, for example, send it to the server
                    console.log('Latitude: ' + latitude + ', Longitude: ' + longitude);
                    
                    // Create a new div element to display latitude and longitude
                    var locationDiv = document.createElement('div');
                    locationDiv.id = 'locationInfo';
                    locationDiv.innerHTML = 'Latitude: ' + latitude + ', Longitude: ' + longitude;
                    document.body.appendChild(locationDiv); // Add the div to the body
                    
                    // You can add code here to take further actions based on the user's location and pizza type
                    alert('Ordering ' + pizzaType + ' in Chengdu at (' + latitude + ', ' + longitude + ')' +
                        '\nYou can go to the Chengdu EpicEats restaurant now'
                    );
                }, function(error) {
                    // Handle errors
                    console.error('Error Code = ' + error.code + ' - ' + error.message);
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            alert('User denied the request for Geolocation.');
                            break;
                        case error.POSITION_UNAVAILABLE:
                            alert('Location information is unavailable.');
                            break;
                        case error.TIMEOUT:
                            alert('The request to get user location timed out.');
                            break;
                        case error.UNKNOWN_ERROR:
                            alert('An unknown error occurred.');
                            break;
                    }
                });
            } else {
                alert('Geolocation is not supported by this browser.');
            }
        });
    });
});