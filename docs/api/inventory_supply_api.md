# Inventory Agent & Supply Agent - API Specification

This documentation specifies the endpoints, data contracts, validation rules, status codes, and example payloads for the **Inventory Agent** and the **Supply Agent** microservices inside the ManuSphere AI platform.

---

## 1. System Integration Overview

The Hub-and-Spoke **Orchestrator Gateway** routes operations sequentially to both agents. Below are their network details:

| Service | Port (Local/Docker) | Base URL | Primary Role |
| :--- | :--- | :--- | :--- |
| **Inventory Agent** | `8003` | `http://localhost:8003` | Safety Stock, ROP, EOQ calculation & Stock health CRUD |
| **Supply Agent** | `8004` | `http://localhost:8004` | Lead time delay classification, vendor risk ranking & Supplier database CRUD |

### Orchestrator Call Sequence
When analyzing disruptions:
1. **Orchestrator** calls **Inventory Agent** `POST /inventory/calculate` with forecasted demand to evaluate current inventory health.
2. **Orchestrator** calls **Supply Agent** `POST /supply/analyze` to analyze vendor reliability and seek low-risk alternative suppliers.

---

## 2. Shared CRUD Schema Validation Rules

The following validation constraints are enforced globally by Pydantic on the database entities of both agents:

| Schema | Field | Type | Rules / Constraints |
| :--- | :--- | :--- | :--- |
| **Product** | `name` | String | Max 255 characters |
| | `category` | String | Max 100 characters |
| | `sku` | String | Max 50 characters, **Unique** |
| **Inventory** | `product_id` | Integer | Must reference existing `Product.id` |
| | `current_stock` | Integer | Must be `ge=0` (non-negative) |
| | `daily_demand` | Float | Must be `ge=0.0` (non-negative) |
| | `lead_time` | Integer | Must be `ge=0` (non-negative days) |
| | `warehouse` | String | Max 100 characters |
| **Supplier** | `supplier_name` | String | Max 255 characters |
| | `supplier_rating`| Float | Must be between `0.0` and `5.0` inclusive |
| | `contact_email` | String | Max 255 characters |
| | `region` | String | Max 100 characters |
| | `is_active` | Boolean | Default: `true` |
| **Delivery** | `supplier_id` | Integer | Must reference existing `Supplier.id` |
| | `product_id` | Integer | Must reference existing `Product.id` |
| | `expected_delivery_days` | Integer | Must be `ge=0` |
| | `actual_delivery_days` | Integer | Must be `ge=0` (optional) |
| | `delivery_status` | String | Max 50 characters, Default: `"PENDING"` |

---

## 3. Inventory Agent APIs (Port 8003)

### 3.1. Health Check
* **HTTP Method**: `GET`
* **Endpoint**: `/health`
* **Purpose**: Query service health status and API version.
* **Status Codes**: 
  * `200 OK` - Service is healthy.
* **Example Request**:
```http
GET /health HTTP/1.1
Host: localhost:8003
```
* **Example Response**:
```json
{
  "service": "Inventory Agent",
  "status": "healthy",
  "version": "1.0.0"
}
```

---

### 3.2. Calculate Safety Stock & Reorder Point
* **HTTP Method**: `POST`
* **Endpoint**: `/inventory/calculate`
* **Purpose**: Calculate safety stock levels, reorder points, economic order quantity (EOQ), and diagnose stock health.
* **Request Body** (`InventoryRequest`):
```json
{
  "product": "Widget A",
  "forecast_demand": 100,
  "current_stock": 50,
  "daily_demand": 5,
  "lead_time": 3
}
```
* **Response Body** (`InventoryResponse`):
```json
{
  "product": "Widget A",
  "current_stock": 50,
  "safety_stock": 15,
  "reorder_point": 30,
  "inventory_status": "HEALTHY",
  "economic_order_quantity": 45,
  "message": "Inventory calculation completed successfully."
}
```
* **Status Codes**:
  * `200 OK` - Successful calculation.
  * `400 Bad Request` - Validation error or calculation parameters invalid (e.g. negative values).
  * `500 Internal Server Error` - Unexpected calculation crash.

---

### 3.3. Product CRUD Endpoints

#### POST /products/ (Create Product)
* **Purpose**: Create a new product. SKU must be unique.
* **Request Body**:
```json
{
  "name": "Linear Guide Rail",
  "category": "Mechanical",
  "sku": "MECH-RAIL-902"
}
```
* **Response Body**:
```json
{
  "id": 1,
  "name": "Linear Guide Rail",
  "category": "Mechanical",
  "sku": "MECH-RAIL-902",
  "created_at": "2026-07-28T11:05:44Z"
}
```
* **Status Codes**:
  * `201 Created` - Product registered successfully.
  * `400 Bad Request` - SKU already exists or payload violates schema limits.

#### GET /products/ (List Products)
* **Purpose**: Retrieve a paginated list of products.
* **Query Parameters**: `skip` (default 0), `limit` (default 100).
* **Response Body**:
```json
[
  {
    "id": 1,
    "name": "Linear Guide Rail",
    "category": "Mechanical",
    "sku": "MECH-RAIL-902",
    "created_at": "2026-07-28T11:05:44Z"
  }
]
```
* **Status Codes**: `200 OK`

#### GET /products/{product_id} (Retrieve Product)
* **Purpose**: Fetch a single product by ID.
* **Response Body**:
```json
{
  "id": 1,
  "name": "Linear Guide Rail",
  "category": "Mechanical",
  "sku": "MECH-RAIL-902",
  "created_at": "2026-07-28T11:05:44Z"
}
```
* **Status Codes**:
  * `200 OK` - Success.
  * `404 Not Found` - Product ID does not exist.

#### PUT /products/{product_id} (Update Product)
* **Purpose**: Update a product (all parameters optional in body).
* **Request Body**:
```json
{
  "name": "Linear Guide Rail V2"
}
```
* **Response Body**:
```json
{
  "id": 1,
  "name": "Linear Guide Rail V2",
  "category": "Mechanical",
  "sku": "MECH-RAIL-902",
  "created_at": "2026-07-28T11:05:44Z"
}
```
* **Status Codes**:
  * `200 OK` - Updated.
  * `400 Bad Request` - Conflict on updated SKU.
  * `404 Not Found` - Product ID does not exist.

#### DELETE /products/{product_id} (Delete Product)
* **Purpose**: Delete product and all cascading inventory/delivery records.
* **Status Codes**:
  * `204 No Content` - Deletion complete.
  * `404 Not Found` - Product ID does not exist.

---

### 3.4. Inventory CRUD Endpoints

#### POST /inventories/ (Create Stock Entry)
* **Request Body**:
```json
{
  "product_id": 1,
  "current_stock": 250,
  "daily_demand": 12.5,
  "lead_time": 5,
  "warehouse": "Main Warehouse"
}
```
* **Response Body**:
```json
{
  "id": 1,
  "product_id": 1,
  "current_stock": 250,
  "daily_demand": 12.5,
  "lead_time": 5,
  "warehouse": "Main Warehouse",
  "updated_at": "2026-07-28T11:06:12Z"
}
```
* **Status Codes**:
  * `201 Created` - Success.
  * `400 Bad Request` - Referenced `product_id` does not exist.

#### GET /inventories/ (List Stock Entries)
* **Query Parameters**: `skip`, `limit`.
* **Status Codes**: `200 OK`

#### GET /inventories/{inventory_id} (Retrieve Stock Entry)
* **Status Codes**: `200 OK`, `404 Not Found`

#### PUT /inventories/{inventory_id} (Update Stock Entry)
* **Request Body**:
```json
{
  "current_stock": 230
}
```
* **Status Codes**: `200 OK`, `404 Not Found`, `400 Bad Request` (referencing invalid product ID)

#### DELETE /inventories/{inventory_id} (Delete Stock Entry)
* **Status Codes**: `204 No Content`, `404 Not Found`

---

### 3.5. Supplier CRUD Endpoints

#### POST /suppliers/ (Create Supplier)
* **Request Body**:
```json
{
  "supplier_name": "Apex Manufacturing Ltd",
  "supplier_rating": 4.6,
  "contact_email": "orders@apex.com",
  "region": "North America",
  "is_active": true
}
```
* **Response Body**:
```json
{
  "id": 1,
  "supplier_name": "Apex Manufacturing Ltd",
  "supplier_rating": 4.6,
  "contact_email": "orders@apex.com",
  "region": "North America",
  "is_active": true,
  "created_at": "2026-07-28T11:07:01Z"
}
```
* **Status Codes**:
  * `201 Created` - Success.
  * `400 Bad Request` - Validation failure (e.g. rating > 5.0).

#### GET /suppliers/ (List Suppliers)
* **Status Codes**: `200 OK`

#### GET /suppliers/{supplier_id} (Retrieve Supplier)
* **Status Codes**: `200 OK`, `404 Not Found`

#### PUT /suppliers/{supplier_id} (Update Supplier)
* **Status Codes**: `200 OK`, `404 Not Found`

#### DELETE /suppliers/{supplier_id} (Delete Supplier)
* **Status Codes**: `204 No Content`, `404 Not Found`

---

### 3.6. SupplierDelivery CRUD Endpoints

#### POST /deliveries/ (Create Delivery Log)
* **Request Body**:
```json
{
  "supplier_id": 1,
  "product_id": 1,
  "expected_delivery_days": 10,
  "actual_delivery_days": null,
  "delivery_date": null,
  "delivery_status": "PENDING"
}
```
* **Response Body**:
```json
{
  "id": 1,
  "supplier_id": 1,
  "product_id": 1,
  "expected_delivery_days": 10,
  "actual_delivery_days": null,
  "delivery_date": null,
  "delivery_status": "PENDING",
  "created_at": "2026-07-28T11:08:15Z"
}
```
* **Status Codes**:
  * `201 Created` - Success.
  * `400 Bad Request` - `supplier_id` or `product_id` does not exist.

#### GET /deliveries/ (List Deliveries)
* **Status Codes**: `200 OK`

#### GET /deliveries/{delivery_id} (Retrieve Delivery Log)
* **Status Codes**: `200 OK`, `404 Not Found`

#### PUT /deliveries/{delivery_id} (Update Delivery Log)
* **Request Body**:
```json
{
  "actual_delivery_days": 11,
  "delivery_status": "DELIVERED",
  "delivery_date": "2026-07-28T11:09:00Z"
}
```
* **Status Codes**: `200 OK`, `404 Not Found`

#### DELETE /deliveries/{delivery_id} (Delete Delivery Log)
* **Status Codes**: `204 No Content`, `404 Not Found`

---

## 4. Supply Agent APIs (Port 8004)

### 4.1. Health Check
* **HTTP Method**: `GET`
* **Endpoint**: `/health`
* **Purpose**: Query service health status.
* **Response Body**:
```json
{
  "service": "Supply Agent",
  "status": "healthy",
  "version": "1.0.0"
}
```

---

### 4.2. Analyze Supply & Vendor Risks
* **HTTP Method**: `POST`
* **Endpoint**: `/supply/analyze`
* **Purpose**: Classify supplier delay metrics, rank vendor performance risk, and select recommended alternative vendors.
* **Request Body** (`SupplyRequest`):
```json
{
  "supplier_name": "Apex Manufacturing Ltd",
  "expected_delivery_days": 10,
  "actual_delivery_days": 15,
  "supplier_rating": 4.2
}
```
* **Response Body** (`SupplyResponse`):
```json
{
  "supplier_name": "Apex Manufacturing Ltd",
  "supplier_delay": true,
  "delay_days": 5,
  "risk": "HIGH",
  "recommended_supplier": "Summit Tech Electronics"
}
```
* **Status Codes**:
  * `200 OK` - Analysis complete.
  * `400 Bad Request` - Invalid fields (e.g. negative days).

---

### 4.3. CRUD Endpoints (Port 8004)
The **Supply Agent** exposes the exact same CRUD endpoint pathways for Products, Inventories, Suppliers, and SupplierDeliveries as the **Inventory Agent** to support dual-microservice storage patterns or synchronized nodes.

#### CRUD Routes list:
* **Products**:
  * `POST /products/` - Register product
  * `GET /products/` - List products
  * `GET /products/{product_id}` - Retrieve product
  * `PUT /products/{product_id}` - Update product
  * `DELETE /products/{product_id}` - Delete product
* **Inventories**:
  * `POST /inventories/` - Create stock inventory entry
  * `GET /inventories/` - List stock inventory entries
  * `GET /inventories/{inventory_id}` - Retrieve stock entry
  * `PUT /inventories/{inventory_id}` - Update stock entry
  * `DELETE /inventories/{inventory_id}` - Delete stock entry
* **Suppliers**:
  * `POST /suppliers/` - Create supplier profile
  * `GET /suppliers/` - List suppliers
  * `GET /suppliers/{supplier_id}` - Retrieve supplier
  * `PUT /suppliers/{supplier_id}` - Update supplier profile
  * `DELETE /suppliers/{supplier_id}` - Remove supplier profile
* **Deliveries**:
  * `POST /deliveries/` - Create supplier delivery log
  * `GET /deliveries/` - List supplier delivery logs
  * `GET /deliveries/{delivery_id}` - Retrieve delivery log
  * `PUT /deliveries/{delivery_id}` - Update delivery log status
  * `DELETE /deliveries/{delivery_id}` - Delete delivery log
