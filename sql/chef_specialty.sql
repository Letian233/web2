CREATE TABLE chef_specialty (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image_url VARCHAR(255) NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO chef_specialty
(title, description, image_url, updated_at)
VALUES
(
  'Slow-Roasted Beef Ribs',
  'Slow-roasted beef ribs are one of the signature dishes of our restaurant, embodying our passion for fine cuisine and commitment to culinary craftsmanship. This dish is renowned for its tender meat and unique flavor profile.',
  'images/beef_ribs.jpg',
  NOW()
);

INSERT INTO chef_specialty
(title, description, image_url, updated_at)
VALUES
(
  'Caprese Salad',
  'Sun-ripened tomato, creamy fresh mozzarella, and fragrant basil, dressed with extra-virgin olive oil, flaky sea salt, and a hint of balsamic glaze—bright, simple, and pure Italian summer.',
  'images/Caprese_Salad.jpg',
  NOW()
);