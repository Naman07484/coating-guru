-- ============================================
-- THE COATING GURU — Complete Database Setup
-- Run this ONCE on your Railway MySQL database
-- ============================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  password VARCHAR(255),
  phone VARCHAR(20) UNIQUE,
  address TEXT,
  vehicle_type VARCHAR(50),
  car_model VARCHAR(100),
  package_id INT,
  otp VARCHAR(10),
  otp_expires DATETIME,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  allows_wash TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. PACKAGES TABLE
CREATE TABLE IF NOT EXISTS packages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  warranty_years INT DEFAULT 2,
  price_compact DECIMAL(10,2) DEFAULT 0,
  price_sedan DECIMAL(10,2) DEFAULT 0,
  price_luxury DECIMAL(10,2) DEFAULT 0,
  price_suv DECIMAL(10,2) DEFAULT 0,
  price_sports DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  location_id INT,
  service_type VARCHAR(50) DEFAULT 'service',
  package_id INT,
  services JSON,
  vehicle_type VARCHAR(50),
  vehicle_make VARCHAR(100),
  vehicle_model VARCHAR(100),
  vehicle_year VARCHAR(10),
  vehicle_color VARCHAR(50),
  vehicle_regn VARCHAR(50),
  customer_address TEXT,
  customer_email VARCHAR(255),
  pre_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  valid_till DATE,
  payment_mode VARCHAR(50),
  warranty VARCHAR(100),
  scheduled_date DATE,
  time_slot VARCHAR(20),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (location_id) REFERENCES locations(id),
  FOREIGN KEY (package_id) REFERENCES packages(id)
);

-- 5. JOB CARDS TABLE
CREATE TABLE IF NOT EXISTS job_cards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT,
  checklist JSON,
  car_condition JSON,
  notes TEXT,
  technician VARCHAR(100),
  time_start VARCHAR(10),
  time_finish VARCHAR(10),
  condition_rating VARCHAR(100),
  warranty VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- 6. WASH USAGE TABLE
CREATE TABLE IF NOT EXISTS wash_usage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  wash_month VARCHAR(7) NOT NULL,
  count INT DEFAULT 0,
  UNIQUE KEY unique_user_month (user_id, wash_month),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================
-- SEED DATA — Locations & Packages
-- ============================================

-- Insert locations (your 3 studios)
INSERT INTO locations (name, address, allows_wash) VALUES
('Race Course Studio', 'SB 9-13, Race Course Tower, Opposite Citi Bank, Near Natubhai Circle, Vadodara – 391101', 1),
('Brookfield Studio', 'Brookfield, Navayard Rd, Next to MG TechApollo, Ram Wadi, Vadodara – 390020', 1),
('Manjalpur Studio', 'GF-3/4 Srikunj Height, Beside Bakers Hospital, Manjalpur GIDC Road, Vadodara', 0);

-- Insert packages (5 coating packages with prices per vehicle type)
INSERT INTO packages (name, description, warranty_years, price_compact, price_sedan, price_luxury, price_suv, price_sports) VALUES
('TCG Crystal Series', '2 Coat Crystal Coating, Windshield Protection, Wheel Protection, Trim Protection', 2, 8000, 10000, 14000, 12000, 16000),
('TCG Silver Series', '2 Coat Silver Coating, Windshield Protection, Wheel Protector, Trim Protection', 3, 12000, 15000, 20000, 18000, 22000),
('TCG Elite Series', '2 Coat Elite Coating, Windshield Protection, Wheel Protector, Trim Protection', 5, 18000, 22000, 28000, 25000, 30000),
('TCG Ultra Series', '2 Coat Ultra Coating, Full Protection Suite, Windshield + Wheel + Trim, Priority Service', 99, 25000, 30000, 38000, 35000, 42000),
('TCG Top Coat', 'Leather Coating, Fabric Coating, Dashboard Coating, Door Panels Coating', 2, 5000, 6000, 8000, 7000, 9000);

SELECT 'Database setup complete!' AS status;
