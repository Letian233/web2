window.onload = () => {
  var img = document.querySelectorAll(".img");
  var left = document.querySelector(".left");
  var right = document.querySelector(".right");
  var buttons = document.querySelectorAll(".button1 p");

  // Create an array to store IDs
  idArr = ["first", "second", "right1", "left1", "left2", "left3", "last"];

  // Set a variable to act as the index for the images
  var index = 0;

  initialize();

  // Set a timer to rotate the images
  var timer = setInterval(next, 3000);

  // Bind click events to the arrows
  left.addEventListener("click", prev);
  // When the mouse is over the arrow, stop the timer
  left.addEventListener("mouseover", () => {
    clearInterval(timer);
    timer = null;
  });
  // When the mouse leaves the arrow, restart the timer
  left.addEventListener("mouseout", () => {
    timer = setInterval(next, 3000);
  });

  right.addEventListener("click", next);
  right.addEventListener("mouseover", () => {
    clearInterval(timer);
    timer = null;
  });
  right.addEventListener("mouseout", () => {
    timer = setInterval(next, 3000);
  });

  // Add click events to the small squares
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("mousedown", () => {
      // When the user clicks, close the timer
      clearInterval(timer);
      timer = null;
      // Here you need to determine the difference between the user's clicked square and the current image index. If
      // it's greater than 0, it means the user wants to switch to a later image, otherwise, it means the user
      // wants to switch to a previous image
      if (index > i) {
        let x = index - i;
        while (x--) {
          prev();
        }
      } else if (index < i) {
        let x = i - index;
        while (x--) {
          next();
        }
      }
    });
  }

  // Create a function to switch images
  function prev() {
    // Switch to the previous image, which means making the last element of the array the first
    idArr.push(idArr.shift());
    initialize();
    if (index === 0) {
      index = buttons.length - 1;
    } else {
      index--;
    }
    clearColor();
  }
  function next() {
    // The opposite of the above
    idArr.unshift(idArr.pop());
    initialize();
    if (index === buttons.length - 1) {
      index = 0;
    } else {
      index++;
    }
    clearColor();
  }

  // Create a function to make the small squares move with the images
  function clearColor() {
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].style.backgroundColor = "silver";
    }
    // Change the color of the current index
    buttons[index].style.backgroundColor = "rgb(20, 134, 187)";
  }

  // Create a function to initialize the images
  function initialize() {
    for (let i = 0; i < img.length; i++) {
      img[i].id = idArr[i];
    }
  }
};