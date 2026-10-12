-- FoodLoop MySQL Production Schema
-- Compatible with MySQL 8.0+

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50),
    created_at DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS food_donations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    food_type VARCHAR(255),
    quantity DOUBLE,
    location VARCHAR(255),
    description TEXT,
    pickup_deadline DATETIME,
    status VARCHAR(50) DEFAULT 'AVAILABLE',
    created_at DATETIME,
    donor_id BIGINT,
    CONSTRAINT fk_food_donations_donor FOREIGN KEY (donor_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS food_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    donation_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    requested_at DATETIME,
    CONSTRAINT fk_food_requests_donation FOREIGN KEY (donation_id) REFERENCES food_donations (id) ON DELETE CASCADE,
    CONSTRAINT fk_food_requests_receiver FOREIGN KEY (receiver_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
