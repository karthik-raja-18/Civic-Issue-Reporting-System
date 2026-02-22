# 🏙️ Civic Issue Reporting System — Backend

A production-style Spring Boot REST API for crowdsourced civic issue reporting and resolution.

---

## 📁 Project Structure

```
civic-issue-backend/
├── pom.xml
└── src/
    └── main/
        ├── java/com/civic/issue/
        │   ├── CivicIssueApplication.java          # Main entry point
        │   │
        │   ├── config/
        │   │   ├── CustomUserDetailsService.java    # Loads user from DB for Spring Security
        │   │   └── SecurityConfig.java              # JWT + route protection configuration
        │   │
        │   ├── controller/
        │   │   ├── AuthController.java              # POST /api/auth/register, /login
        │   │   ├── IssueController.java             # CRUD + status + comments
        │   │   └── NotificationController.java      # GET /api/notifications
        │   │
        │   ├── dto/
        │   │   ├── request/
        │   │   │   ├── RegisterRequest.java
        │   │   │   ├── LoginRequest.java
        │   │   │   ├── IssueRequest.java
        │   │   │   ├── UpdateStatusRequest.java
        │   │   │   └── CommentRequest.java
        │   │   └── response/
        │   │       ├── ApiResponse.java             # Generic wrapper { success, message, data }
        │   │       ├── AuthResponse.java
        │   │       ├── IssueResponse.java
        │   │       ├── CommentResponse.java
        │   │       └── NotificationResponse.java
        │   │
        │   ├── entity/
        │   │   ├── User.java
        │   │   ├── Issue.java
        │   │   ├── Comment.java
        │   │   └── Notification.java
        │   │
        │   ├── enums/
        │   │   ├── RoleType.java                    # USER, ADMIN
        │   │   └── IssueStatus.java                 # PENDING, IN_PROGRESS, RESOLVED
        │   │
        │   ├── exception/
        │   │   ├── GlobalExceptionHandler.java      # @RestControllerAdvice
        │   │   ├── ResourceNotFoundException.java
        │   │   ├── DuplicateResourceException.java
        │   │   └── UnauthorizedException.java
        │   │
        │   ├── filter/
        │   │   └── JwtAuthenticationFilter.java     # Intercepts requests, validates JWT
        │   │
        │   ├── repository/
        │   │   ├── UserRepository.java
        │   │   ├── IssueRepository.java
        │   │   ├── CommentRepository.java
        │   │   └── NotificationRepository.java
        │   │
        │   ├── service/
        │   │   ├── AuthService.java
        │   │   ├── IssueService.java
        │   │   ├── NotificationService.java
        │   │   └── impl/
        │   │       ├── AuthServiceImpl.java
        │   │       ├── IssueServiceImpl.java
        │   │       └── NotificationServiceImpl.java
        │   │
        │   └── util/
        │       └── JwtUtil.java                     # Token generation & validation
        │
        └── resources/
            └── application.properties
```

---

## 🛠️ Prerequisites

| Tool | Version |
|------|---------|
| Java | 21 (LTS) |
| Maven | 3.8+ |
| MySQL | 8.x |
| (Optional) PostgreSQL | 15+ |

---

## ⚡ Quick Start

### 1. Create MySQL Database

```sql
CREATE DATABASE civic_db;
```

> Or set `createDatabaseIfNotExist=true` in the connection URL (already done in `application.properties`).

### 2. Configure Database Credentials

Edit `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/civic_db?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD
```

### 3. Build and Run

```bash
# Clone / navigate to project root
cd civic-issue-backend

# Build
mvn clean install

# Run
mvn spring-boot:run
```

The server starts at **http://localhost:8080**

> Hibernate will auto-create tables on first run (`spring.jpa.hibernate.ddl-auto=update`).

---

## 🔑 JWT Secret (Production)

The default secret in `application.properties` is **for development only**.  
In production, override with an environment variable:

```bash
APP_JWT_SECRET=your-super-secret-64-char-hex-string mvn spring-boot:run
```

Or set it in `application.properties`:
```properties
app.jwt.secret=${JWT_SECRET:default-dev-secret}
```

---

## 🔐 Role System

| Role | Permissions |
|------|------------|
| `USER` | Register, login, create issues, view all issues, view own issues, add comments, view notifications |
| `ADMIN` | Everything USER can do + update issue status, delete issues |

> To promote a user to ADMIN, update the DB directly or create a dedicated admin endpoint.

---

## 📡 REST API Reference

### Auth

#### `POST /api/auth/register`
```json
// Request Body
{
  "name": "Alice Smith",
  "email": "alice@example.com",
  "password": "password123"
}

// Response 201
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGci...",
    "type": "Bearer",
    "userId": 1,
    "name": "Alice Smith",
    "email": "alice@example.com",
    "role": "USER"
  }
}
```

#### `POST /api/auth/login`
```json
// Request Body
{
  "email": "alice@example.com",
  "password": "password123"
}

// Response 200 — same shape as register
```

---

### Issues

> All issue and notification endpoints require: `Authorization: Bearer <token>`

#### `GET /api/issues`
Returns all issues sorted by newest first.

Optional query param: `?mine=true` — returns only the authenticated user's issues.

#### `GET /api/issues/{id}`
Returns a single issue with all its comments.

#### `POST /api/issues`
```json
// Request Body
{
  "title": "Broken streetlight on Main St",
  "description": "The streetlight at Main & Oak has been broken for 2 weeks.",
  "category": "Infrastructure",
  "imageUrl": "https://example.com/image.jpg",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

#### `PUT /api/issues/{id}/status` 🔒 ADMIN only
```json
// Request Body
{
  "status": "IN_PROGRESS"  // PENDING | IN_PROGRESS | RESOLVED
}
```
> This also creates a `Notification` for the issue owner automatically.

#### `DELETE /api/issues/{id}` 🔒 ADMIN only
Deletes a fake or invalid issue.

#### `POST /api/issues/{id}/comments`
```json
// Request Body
{
  "text": "I also noticed this — it's a safety hazard at night."
}
```

---

### Notifications

#### `GET /api/notifications`
Returns all notifications for the logged-in user, sorted newest first.

```json
// Response
{
  "success": true,
  "message": "Operation successful",
  "data": [
    {
      "id": 1,
      "message": "Your issue 'Broken streetlight on Main St' status has been updated to IN_PROGRESS.",
      "createdAt": "2025-01-15T10:30:00",
      "read": false
    }
  ]
}
```

---

## 🧪 Postman Testing Guide

### Step 1 — Register a User
```
POST http://localhost:8080/api/auth/register
Content-Type: application/json

{ "name": "Alice", "email": "alice@test.com", "password": "pass123" }
```
Copy the `token` from the response.

### Step 2 — Register an Admin (then update role in DB)
```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@test.com';
```

### Step 3 — Set Auth Header in Postman
In the **Authorization** tab:
- Type: `Bearer Token`
- Token: paste the JWT

### Step 4 — Create an Issue
```
POST http://localhost:8080/api/issues
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Pothole on 5th Avenue",
  "description": "Large pothole causing damage to vehicles.",
  "category": "Roads"
}
```

### Step 5 — Admin: Update Status
```
PUT http://localhost:8080/api/issues/1/status
Authorization: Bearer <admin_token>

{ "status": "IN_PROGRESS" }
```

### Step 6 — Check Notifications
```
GET http://localhost:8080/api/notifications
Authorization: Bearer <user_token>
```

---

## 🗄️ Database Schema (Auto-generated by Hibernate)

Hibernate generates these tables automatically:

```
users           → id, name, email, password, role
issues          → id, title, description, category, status, image_url, latitude, longitude, created_at, created_by_id
comments        → id, text, created_at, user_id, issue_id
notifications   → id, message, created_at, user_id, read
```

---

## 🔒 Security Summary

- All `/api/auth/**` endpoints are public
- All other endpoints require a valid `Authorization: Bearer <JWT>` header
- JWT expires in **24 hours** (configurable via `app.jwt.expiration-ms`)
- Passwords are hashed with **BCrypt**
- ADMIN-only routes enforce `@PreAuthorize("hasRole('ADMIN')")` at controller level

---

## ⚙️ Configuration Reference

| Property | Default | Description |
|----------|---------|-------------|
| `server.port` | 8080 | HTTP port |
| `spring.jpa.hibernate.ddl-auto` | update | Schema strategy |
| `app.jwt.secret` | (see properties) | 256-bit Base64 secret |
| `app.jwt.expiration-ms` | 86400000 | 24 hours in milliseconds |
