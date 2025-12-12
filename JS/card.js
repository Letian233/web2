// Define the different paragraph texts for each card
var paragraphTexts = [
  '<p>In the 19th century, in the Burgundy region of France, Boeuf Bourguignon was a typical rural home-cooked meal. Known for its fertile lands and fine wines, the farmers of Burgundy were accustomed to cooking with local ingredients and wine. Red wine, being a staple that could be preserved for long periods and was relatively inexpensive, became an indispensable flavoring agent in their cooking.During that era, Burgundian farmers would slow-cook beef with red wine, onions, carrots, and a few simple spices in large pots. This method not only tenderized the beef but also allowed the flavors of the wine to fully penetrate the meat. The dish was typically consumed in winter, as the long cooking times were more convenient in the cold temperatures.In the mid-20th century, an American woman named Julia Child fell in love with French culinary culture while studying cooking in France. She attended the prestigious Le Cordon Bleu cooking school and, along with her husband Paul Child, authored a book titled "Mastering the Art of French Cooking." In this book, Julia detailed the preparation of Boeuf Bourguignon, which began to gain popularity in the United States.</p>',
  '<p>The precursor to the Black Forest Cake first emerged in the Black Forest area of southwestern Germany, known for its dense forests, picturesque landscapes, and cherry orchards. The region spans from Baden-Baden in the north to Freiburg in the south.Legend has it that during the cherry harvest season, local farmwives would make jam with the surplus cherries or stuff them between layers of cake, or use them as a decorative topping. When whipping the cream for the cake, they would add a generous amount of cherry juice, and sometimes incorporate cherry juice and cherry brandy into the batter. This type of cake, spread from the Black Forest to other areas, gradually evolved into what is known as the "Black Forest Cake."There are two widely accepted claims about the creator of the Black Forest Cake. One is that it was invented in 1915 by Josef Keller, a pastry chef from a café in Bad Godesberg near Bonn, who claimed to be the first to combine cherries, cream, and chocolate, using a Vienna wafer as the base. Another claim is that the Black Forest Cherry Cake was invented in 1930 by pastry chef Erwin Hildenbrand from Tübingen.</p>',
  '<p>The earliest form of pasta can be traced back to 4th century BC Ancient Rome. Romans were already making a type of dough from wheat flour, water, and a small amount of olive oil, which they cut into strips. This early pasta was called "lagane" and is considered the precursor to modern Italian pasta.During the Middle Ages, pasta began to take on more variations. With the widespread availability of wheat flour and advancements in cooking techniques, people started experimenting with different shapes and thicknesses. Arabs also had a significant impact on the development of pasta, introducing new cooking methods and seasonings, such as tomatoes and spices, which later became integral to Italian pasta dishes.By the 17th century, pasta had become a familiar product in Italy. The coastal area near Naples advanced the drying process of pasta, which allowed for longer storage times, and the port\'s convenience allowed the new dried pasta to be distributed throughout the Italian peninsula.</p>',
  '<p>The origins of pizza can be traced back to ancient civilizations. In ancient Greece, a flatbread known as "plakous" was baked on hot stones and seasoned with olives, herbs, and spices. This early form of pizza laid the groundwork for what would eventually become the pizza we know today. The modern pizza as we know it originated in Naples, Italy, in the 18th century. Neapolitan peasants prepared a simple flatbread called "pitta," made from flour, water, salt, and yeast. This bread was easy to make and provided a filling meal for the common people. The true "pizza" was born in 17th-century Naples when they began to add mozzarella cheese, a fresh, soft cheese made from the water buffalo milk typical of the region. The combination of tomatoes and mozzarella on flatbread gave rise to what we now call "Margherita pizza," named in honor of Queen Margherita of Savoy, who was particularly fond of this dish. As pizza\'s popularity grew, it became a global icon, with various regions adding their own twists and ingredients, making it a truly international dish.</p>'
];

function init() {
  resize();
  selectElements();
  attachListeners();
}

function selectElements() {
  cards = document.getElementsByClassName('card');
  nCards = cards.length;
  cover = document.getElementById('cover');
  openContent = document.getElementById('open-content');
  openContentText = document.getElementById('open-content-text');
  openContentImage = document.getElementById('open-content-image');
  closeContent = document.getElementById('close-content');
}

function attachListeners() {
  for (var i = 0; i < nCards; i++) {
    attachListenerToCard(i);
  }
  closeContent.addEventListener('click', onCloseClick);
  window.addEventListener('resize', resize);
}

function attachListenerToCard(i) {
  cards[i].addEventListener('click', function(e) {
    var card = getCardElement(e.target);
    onCardClick(card, i);
  });
}

function onCardClick(card, i) {
  currentCard = card;
  currentCard.className += ' clicked';
  setTimeout(function() {animateCoverUp(currentCard, i)}, 500);
  animateOtherCards(currentCard, true);
  openContent.className += ' open';
}

function animateCoverUp(card, i) {
  var cardPosition = card.getBoundingClientRect();
  var cardStyle = getComputedStyle(card);
  setCoverPosition(cardPosition);
  setCoverColor(cardStyle);
  scaleCoverToFillWindow(cardPosition);
  openContentText.innerHTML = '<h1>'+card.children[2].textContent+'</h1>'+paragraphTexts[i];
  openContentImage.src = card.children[1].src;
  setTimeout(function() {
    window.scroll(0, 0);
    pageIsOpen = true;
  }, 300);
}

function animateCoverBack(card) {
  var cardPosition = card.getBoundingClientRect();
  setCoverPosition(cardPosition);
  scaleCoverToFillWindow(cardPosition);
  cover.style.transform = 'scaleX('+1+') scaleY('+1+') translate3d('+(0)+'px, '+(0)+'px, 0px)';
  setTimeout(function() {
    openContentText.innerHTML = '';
    openContentImage.src = '';
    cover.style.width = '0px';
    cover.style.height = '0px';
    pageIsOpen = false;
    currentCard.className = currentCard.className.replace(' clicked', '');
  }, 301);
}

function setCoverPosition(cardPosition) {
  cover.style.left = cardPosition.left + 'px';
  cover.style.top = cardPosition.top + 'px';
  cover.style.width = cardPosition.width + 'px';
  cover.style.height = cardPosition.height + 'px';
}

function setCoverColor(cardStyle) {
  cover.style.backgroundColor = cardStyle.backgroundColor;
}

function scaleCoverToFillWindow(cardPosition) {
  var scaleX = windowWidth / cardPosition.width;
  var scaleY = windowHeight / cardPosition.height;
  var offsetX = (windowWidth / 2 - cardPosition.width / 2 - cardPosition.left) / scaleX;
  var offsetY = (windowHeight / 2 - cardPosition.height / 2 - cardPosition.top) / scaleY;
  cover.style.transform = 'scaleX('+scaleX+') scaleY('+scaleY+') translate3d('+(offsetX)+'px, '+(offsetY)+'px, 0px)';
}

function onCloseClick() {
  openContent.className = openContent.className.replace(' open', '');
  animateCoverBack(currentCard);
  animateOtherCards(currentCard, false);
}

function animateOtherCards(card, out) {
  var delay = 100;
  for (var i = 0; i < nCards; i++) {
    if (cards[i] === card) continue;
    if (out) animateOutCard(cards[i], delay);
    else animateInCard(cards[i], delay);
    delay += 100;
  }
}

function animateOutCard(card, delay) {
  setTimeout(function() {
    card.className += ' out';
  }, delay);
}

function animateInCard(card, delay) {
  setTimeout(function() {
    card.className = card.className.replace(' out', '');
  }, delay);
}

function getCardElement(el) {
  if (el.className.indexOf('card') > -1) return el;
  else return getCardElement(el.parentElement);
}

function resize() {
  if (pageIsOpen) {
    var cardPosition = currentCard.getBoundingClientRect();
    setCoverPosition(cardPosition);
    scaleCoverToFillWindow(cardPosition);
  }
  windowWidth = window.innerWidth;
  windowHeight = window.innerHeight;
}

var pageIsOpen = false;
var windowWidth = window.innerWidth;
var windowHeight = window.innerHeight;

// Call init function to start the script
init();