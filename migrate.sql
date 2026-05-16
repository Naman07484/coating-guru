CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  password VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  customer_email VARCHAR(255),
  customer_address TEXT,
  vehicle_make VARCHAR(100),
  vehicle_model VARCHAR(100),
  vehicle_year VARCHAR(4),
  vehicle_color VARCHAR(100),
  vehicle_regn VARCHAR(50),
  service_type VARCHAR(255),
  pre_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  payment_mode VARCHAR(50),
  warranty VARCHAR(100),
  valid_till DATE,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_cards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT,
  technician VARCHAR(100),
  time_start VARCHAR(10),
  time_finish VARCHAR(10),
  condition_rating VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);