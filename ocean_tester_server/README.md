# Ocean Tester Server

A lightweight Node.js server for managing Ocean App beta testers and feedback submissions.

## Features

- ✅ Seller & Buyer Beta Tester Registration
- ✅ Tester Management (Selection, ID Generation, Status Updates)
- ✅ Feedback Submission & Management
- ✅ Simple Password Authentication
- ✅ MySQL Database with Sequelize ORM
- ✅ RESTful API

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5002
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ocean_app_db
ADMIN_PASSWORD=oceanpulse2024
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

**Environment Variables Explained:**
- `PORT` - Server port (default: 5002)
- `DB_HOST` - MySQL host
- `DB_USER` - MySQL username
- `DB_PASSWORD` - MySQL password
- `DB_NAME` - Database name
- `ADMIN_PASSWORD` - Password for admin API access
- `FRONTEND_URL` - Allowed frontend origin(s) for CORS (comma-separated for multiple URLs)
- `NODE_ENV` - Environment mode (development/production)

### 3. Run Database Migration

```bash
node migrations/001-create-tester-tables.js
```

### 4. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will run on `http://localhost:5002`

## API Endpoints

### Health Check
```
GET /health
```

### Tester Endpoints

#### Register Seller (Public)
```
POST /api/testers/sellers/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+234 801 234 5678",
  "whatsapp": "+234 801 234 5678",
  "deviceType": "Android",
  "deviceModel": "Samsung Galaxy S21",
  "osVersion": "Android 13",
  "screenSize": "6.2 inches",
  "businessType": ["Retailers"],
  "productCategories": ["Electronics", "Mobile Phones & Tablets"]
}
```

#### Register Buyer (Public)
```
POST /api/testers/buyers/register
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+234 802 345 6789",
  "whatsapp": "+234 802 345 6789",
  "deviceType": "IOS",
  "deviceModel": "iPhone 14",
  "osVersion": "iOS 16",
  "screenSize": "6.1 inches",
  "buyingPreferences": ["Fashion", "Electronics"]
}
```

#### Get All Sellers (Protected)
```
GET /api/testers/sellers?password=oceanpulse2024&status=pending&search=john&page=1&limit=50
```

#### Get All Buyers (Protected)
```
GET /api/testers/buyers?password=oceanpulse2024&status=pending&search=jane&page=1&limit=50
```

#### Select Tester & Generate ID (Protected)
```
POST /api/testers/:id/select
Content-Type: application/json
x-admin-password: oceanpulse2024

{
  "type": "seller"  // or "buyer"
}
```

#### Update Tester (Protected)
```
PATCH /api/testers/:id
Content-Type: application/json
x-admin-password: oceanpulse2024

{
  "type": "seller",
  "status": "rejected",
  "notes": "Does not meet criteria"
}
```

#### Get Tester Stats (Protected)
```
GET /api/testers/stats?password=oceanpulse2024&type=seller
```

### Feedback Endpoints

#### Submit Feedback (Public)
```
POST /api/feedback
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "testerId": "OBTS1001",
  "role": "seller",
  "deviceType": "Android",
  "deviceModel": "Samsung Galaxy S21",
  "osVersion": "Android 13",
  "issueType": "Bug",
  "priority": "High",
  "title": "App crashes on product upload",
  "description": "Detailed description...",
  "stepsToReproduce": "1. Open app\n2. Go to Add Product...",
  "expectedBehavior": "Should upload successfully",
  "actualBehavior": "App crashes",
  "rating": 4,
  "screenshotUrl": "https://example.com/screenshot.png"
}
```

#### Get All Feedback (Protected)
```
GET /api/feedback?password=oceanpulse2024&status=new&priority=Critical&search=crash&page=1&limit=50
```

#### Get Feedback by ID (Protected)
```
GET /api/feedback/:id?password=oceanpulse2024
```

#### Update Feedback (Protected)
```
PATCH /api/feedback/:id
Content-Type: application/json
x-admin-password: oceanpulse2024

{
  "status": "resolved",
  "adminNotes": "Fixed in version 1.2.0"
}
```

#### Get Feedback Stats (Protected)
```
GET /api/feedback/stats?password=oceanpulse2024
```

## Authentication

Protected endpoints require admin password in one of three ways:

1. **Header:** `x-admin-password: oceanpulse2024`
2. **Query:** `?password=oceanpulse2024`
3. **Body:** `{ "password": "oceanpulse2024" }`

## Database Tables

### seller_testers
- id, name, email, phone, whatsapp
- deviceType, deviceModel, osVersion, screenSize
- businessType (JSON), productCategories (JSON)
- status, testerId, notes
- timestamps

### buyer_testers
- id, name, email, phone, whatsapp
- deviceType, deviceModel, osVersion, screenSize
- buyingPreferences (JSON)
- status, testerId, notes
- timestamps

### feedback
- id, name, email, testerId, role
- deviceType, deviceModel, osVersion
- issueType, priority, title, description
- stepsToReproduce, expectedBehavior, actualBehavior
- rating, screenshotUrl
- status, adminNotes
- timestamps

## Status Values

**Tester Status:**
- `pending` - Awaiting review
- `selected` - Accepted as tester with generated ID
- `rejected` - Not accepted

**Feedback Status:**
- `new` - Just submitted
- `reviewed` - Admin has reviewed
- `resolved` - Issue fixed/completed

## Development

### Test Database Connection
```bash
node test-db-connection.js
```

### Run Migration
```bash
node migrations/001-create-tester-tables.js
```

## Tech Stack

- **Node.js** - Runtime
- **Express.js** - Web framework
- **Sequelize** - ORM
- **MySQL** - Database
- **dotenv** - Environment variables
- **cors** - CORS middleware

## License

ISC
