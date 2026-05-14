-- Run this script to apply DB changes for the latest updates
-- Safe to run multiple times (uses IF NOT EXISTS / IGNORE)

-- Add warranty column to job_cards if not present
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS warranty VARCHAR(100) NULL;

-- Add address column to users if not present
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT NULL;

-- Add email column to users if not present  
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) NULL;

-- Add customer_address to bookings if not present
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_address TEXT NULL;

-- Add customer_email to bookings if not present
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255) NULL;

-- Add vehicle_year, vehicle_color to bookings if not present
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vehicle_year VARCHAR(10) NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vehicle_color VARCHAR(50) NULL;

-- Ensure wash_usage table exists
CREATE TABLE IF NOT EXISTS wash_usage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  wash_month VARCHAR(7) NOT NULL,
  count INT DEFAULT 0,
  UNIQUE KEY unique_user_month (user_id, wash_month),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

SELECT 'Migration complete' AS status;
