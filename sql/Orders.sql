CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Completed', -- 例如: Pending, Completed, Cancelled
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT INTO orders (id, user_id, date, total_amount, status) VALUES 
(1, 4, '2024-01-15 00:00:00', 50.00, 'Completed'), -- ORD-001 (assigned to John Doe)
(2, 5, '2024-01-16 00:00:00', 75.00, 'Completed'), -- ORD-002 (assigned to Emily Smith)
(3, 6, '2024-01-17 00:00:00', 100.00, 'Completed'), -- ORD-003 (assigned to Sarah Johnson)
(4, 7, '2024-01-18 00:00:00', 45.00, 'Completed'), -- ORD-004 (assigned to David Wilson)
(5, 8, '2024-01-19 00:00:00', 70.00, 'Completed'); -- ORD-005 (assigned to Liam Parker)