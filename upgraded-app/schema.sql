-- Home Finder schema (MySQL 8 / MariaDB 10.5+). Safe to re-run: every statement is IF NOT EXISTS.
-- Easiest way to create or upgrade a database: `npm run migrate` (also adds new columns to older installs).
CREATE DATABASE IF NOT EXISTS homefinder CHARACTER SET utf8mb4;
USE homefinder;
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  role ENUM('seeker','owner','admin') NOT NULL DEFAULT 'seeker',
  is_banned TINYINT(1) NOT NULL DEFAULT 0,
  token_version INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4;
CREATE TABLE IF NOT EXISTS properties (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  title VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  type ENUM('house','apartment','room','other') NOT NULL,
  listing_type ENUM('rent','sale') NOT NULL,
  price DECIMAL(14,2) NOT NULL,
  bedrooms TINYINT NOT NULL DEFAULT 0,
  bathrooms TINYINT NOT NULL DEFAULT 0,
  area_sqft INT NULL,
  amenities TEXT NULL,
  address VARCHAR(190) NOT NULL,
  city VARCHAR(80) NOT NULL,
  lat DECIMAL(9,6) NOT NULL,
  lng DECIMAL(9,6) NOT NULL,
  images JSON NOT NULL,
  status ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  reject_reason VARCHAR(300) NULL,
  available TINYINT(1) NOT NULL DEFAULT 1,
  views INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_search (status, available, city, type, price),
  INDEX idx_geo (status, lat, lng),
  INDEX idx_owner (owner_id)
) CHARACTER SET utf8mb4;
CREATE TABLE IF NOT EXISTS inquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NOT NULL,
  seeker_id INT NOT NULL,
  message VARCHAR(1000) NOT NULL,
  reply VARCHAR(1000) NULL,
  replied_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (seeker_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_seeker (seeker_id)
) CHARACTER SET utf8mb4;
CREATE TABLE IF NOT EXISTS favorites (
  user_id INT NOT NULL, property_id INT NOT NULL,
  PRIMARY KEY (user_id, property_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4;
CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NOT NULL, reporter_id INT NOT NULL,
  reason VARCHAR(500) NOT NULL, resolved TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4;
CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token_hash)
) CHARACTER SET utf8mb4;
CREATE TABLE IF NOT EXISTS audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  action VARCHAR(40) NOT NULL,
  target_type VARCHAR(20) NOT NULL,
  target_id INT NOT NULL,
  detail VARCHAR(300) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4;
