-- Database Schema Initialization for ManuSphere AI
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory (
    item_code VARCHAR(50) PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    quantity INT DEFAULT 0,
    threshold INT DEFAULT 10,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS supply_chains (
    order_id VARCHAR(50) PRIMARY KEY,
    item_code VARCHAR(50) REFERENCES inventory(item_code),
    status VARCHAR(50) NOT NULL,
    expected_delivery TIMESTAMP
);
