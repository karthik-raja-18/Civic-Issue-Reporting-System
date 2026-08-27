# ⚡ Quick Reference Cheat Sheet - Civic Issue Reporting System

## 🎯 30-Second Elevator Pitch
"I built a full-stack Civic Issue Reporting System with React and Spring Boot. Citizens report civic issues with photos and GPS, while admins manage them through a zone-based system. It uses JWT authentication, role-based access, WhatsApp bot integration, and includes analytics dashboard."

## 🏗️ Tech Stack (One-Liners)
- **Frontend:** React 18 + Vite + Tailwind CSS + React Router + Axios
- **Backend:** Spring Boot 3.3 + Java 21 + MySQL + Spring Security + JWT
- **Auth:** JWT (24h expiry) + OAuth2 (Google/GitHub) + BCrypt
- **Storage:** Cloudinary for images
- **Bot:** Twilio WhatsApp integration
- **Build:** Maven (backend), npm (frontend)

## 🔐 Security Flow
```
Login → BCrypt validation → JWT generation → Token in localStorage 
→ Axios interceptor adds "Bearer <token>" → JwtFilter validates 
→ SecurityContext populated → Authorization check
```

## 👥 Roles & Permissions
| Role | Can Create | Can Update Status | Can Delete | Scope |
|------|-----------|------------------|------------|-------|
| USER | ✅ | ❌ | ❌ | Own issues only |
| REGIONAL_ADMIN | ✅ | ✅ (zone only) | ❌ | Assigned zone |
| ADMIN | ✅ | ✅ (all zones) | ✅ | All zones |

## 📊 Issue Lifecycle
```
PENDING → IN_PROGRESS → RESOLVED → CLOSED
                    ↓ (if rejected)
                  REOPENED → IN_PROGRESS...
```

## 🗄️ Database Schema
```
users: id, name, email, password, role, zone, oauth_provider, oauth_id, phone
issues: id, title, description, category, status, image_url, resolved_image_url, 
        latitude, longitude, upvote_count, priority_score, zone, created_by_id, assigned_to_id
comments: id, text, user_id, issue_id
notifications: id, message, user_id, read
issue_upvotes: id, user_id, issue_id
```

## 🌐 Key API Endpoints
```
POST   /api/auth/register          - User registration
POST   /api/auth/login             - User login
GET    /api/issues                 - Get all issues (authenticated)
GET    /api/issues?mine=true        - Get user's issues
POST   /api/issues                 - Create issue
GET    /api/issues/{id}            - Get issue details
PUT    /api/issues/{id}/status     - Update status (ADMIN/REGIONAL_ADMIN)
DELETE /api/issues/{id}            - Delete issue (ADMIN)
POST   /api/issues/{id}/comments   - Add comment
POST   /api/issues/upload-image    - Upload image to Cloudinary
GET    /api/notifications          - Get user notifications
POST   /api/admin/regional-admin   - Create regional admin (ADMIN)
GET    /api/regional/my-issues     - Get zone issues (REGIONAL_ADMIN)
POST   /api/bot/webhook            - WhatsApp webhook
```

## 🏢 Zones (Coimbatore)
- **NORTH:** Mettupalayam, Annur, Karamadai, Thudiyalur, Saravanampatti
- **SOUTH:** Pollachi, Valparai, Anaimalai, Kinathukadavu, Aliyar
- **EAST:** Sulur, Palladam, Avinashi border, Tiruppur border
- **WEST:** Madukkarai, Thondamuthur, Coimbatore West
- **CENTRAL:** Gandhipuram, RS Puram, Peelamedu, Singanallur, Ukkadam

## 🔑 Key Files to Mention
**Backend:**
- `SecurityConfig.java` - JWT + OAuth2 + RBAC configuration
- `JwtAuthenticationFilter.java` - Token validation filter
- `JwtUtil.java` - Token generation and validation
- `IssueController.java` - Issue CRUD endpoints
- `IssueService.java` - Business logic
- `CustomUserDetailsService.java` - Load user for Spring Security
- `CustomOAuth2UserService.java` - OAuth user info handling

**Frontend:**
- `AuthContext.jsx` - Global auth state
- `axiosConfig.js` - JWT interceptor
- `Dashboard.jsx` - Issue list with filters
- `AdminDashboard.jsx` - Admin management interface
- `CreateIssue.jsx` - Issue submission form

## 💡 Key Features to Highlight
1. **JWT Authentication** - Stateless, 24h expiry, BCrypt passwords
2. **Role-Based Access** - USER, REGIONAL_ADMIN, ADMIN with different permissions
3. **Zone Management** - 5 zones, auto-detection from GPS, regional admin assignment
4. **Issue Lifecycle** - 5 states with citizen confirmation workflow
5. **Image Upload** - Cloudinary integration, proof photos for resolved issues
6. **WhatsApp Bot** - Twilio integration, report issues via WhatsApp
7. **OAuth2** - Google/GitHub login support
8. **Analytics** - Zone performance, resolution time tracking
9. **Upvote System** - Priority scoring based on community engagement
10. **Notifications** - Real-time updates for status changes

## 🐛 Challenges & Solutions
| Challenge | Solution |
|-----------|----------|
| JWT expiration handling | Axios interceptor catches 401, clears token, redirects to login |
| Zone detection from coordinates | Coordinate-based zone mapping algorithm |
| Image storage scalability | Cloudinary CDN instead of local storage |
| SQL injection prevention | JPA parameterized queries |
| XSS prevention | React auto-escapes, input validation |
| CORS issues | Vite proxy in dev, proper CORS config in production |

## 📈 Performance Optimizations
- Database indexing on email, status, zone, created_at
- Lazy loading for JPA relationships
- Pagination for large result sets
- CDN delivery via Cloudinary
- React code splitting and lazy loading
- Connection pooling for database

## 🎨 Frontend Architecture
```
App.jsx (Router)
├── AuthContext (Provider)
├── ProtectedRoute (Guard)
├── AdminRoute (Admin Guard)
├── Pages
│   ├── Login/Register
│   ├── Dashboard (Issue list)
│   ├── CreateIssue
│   ├── IssueDetails
│   ├── AdminDashboard
│   └── Notifications
└── API Layer
    ├── axiosConfig (JWT interceptor)
    ├── authApi
    ├── issueApi
    └── notificationApi
```

## 🔧 Backend Architecture
```
Controller Layer (REST endpoints)
    ↓
Service Layer (Business logic)
    ↓
Repository Layer (JPA/Hibernate)
    ↓
Database (MySQL)
```

## 🚀 Deployment Talking Points
- **Frontend:** `npm run build` → static files → Nginx/Apache
- **Backend:** `mvn package` → JAR → `java -jar`
- **Database:** MySQL server with proper backups
- **Environment Variables:** JWT secret, DB credentials, Cloudinary keys
- **Docker:** Containerize both services for consistency
- **CI/CD:** GitHub Actions for automated testing and deployment

## 📊 Project Metrics
- **Development Time:** [Your answer]
- **Team Size:** Individual project
- **Users:** [If deployed, mention user count]
- **Issues Reported:** [If deployed, mention count]
- **Resolution Rate:** [If deployed, mention percentage]

## 🎯 Common Follow-up Questions

**Q: Why Spring Boot over Node.js?**
A: Spring Boot provides robust security, excellent JPA/Hibernate integration, strong typing with Java, and is widely used in enterprise applications.

**Q: Why JWT over session-based auth?**
A: JWT is stateless, scales horizontally, works well for microservices, and reduces server memory overhead.

**Q: How do you handle concurrent issue updates?**
A: JPA's optimistic locking with @Version can handle concurrent updates. Alternatively, database transactions with proper isolation levels.

**Q: What if Cloudinary is down?**
A: Implement fallback to local storage or alternative cloud provider. Add retry logic and proper error handling.

**Q: How do you prevent spam issues?**
A: Rate limiting per user, CAPTCHA verification, require email verification, implement reporting system for abuse.

---

## ✅ Last-Minute Checklist
- [ ] Can you explain the JWT flow in 30 seconds?
- [ ] Can you name all 3 user roles and their permissions?
- [ ] Can you describe the 5 issue statuses?
- [ ] Can you explain how zone-based routing works?
- [ ] Can you name 3 security features you implemented?
- [ ] Can you explain the difference between lazy and eager loading?
- [ ] Can you describe a challenging bug you fixed?
- [ ] Can you explain why you chose your tech stack?

---

**Remember: Be confident, be specific, and show enthusiasm for your project! 💪**
