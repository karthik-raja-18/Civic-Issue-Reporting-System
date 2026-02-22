# 🏙️ CivicPulse — Frontend

React frontend for the Crowdsourced Civic Issue Reporting and Resolution System.

---

## 📁 Project Structure

```
civic-frontend/
├── index.html
├── vite.config.js           ← Dev proxy: /api → http://localhost:8080
├── tailwind.config.js
├── postcss.config.js
├── .env.example             ← Copy to .env and configure
└── src/
    ├── main.jsx             ← App entry point
    ├── App.jsx              ← React Router configuration
    ├── index.css            ← Tailwind base + custom design tokens
    │
    ├── api/                 ← All Axios calls
    │   ├── axiosConfig.js   ★ JWT interceptor lives here
    │   ├── authApi.js
    │   ├── issueApi.js
    │   └── notificationApi.js
    │
    ├── context/
    │   └── AuthContext.jsx  ★ Global auth state (login/logout/register)
    │
    ├── components/
    │   ├── Navbar.jsx       ← Top navigation with role-aware links
    │   ├── ProtectedRoute.jsx
    │   ├── AdminRoute.jsx
    │   ├── IssueCard.jsx
    │   ├── StatusBadge.jsx
    │   ├── Spinner.jsx
    │   └── AlertMessage.jsx
    │
    ├── pages/
    │   ├── Login.jsx
    │   ├── Register.jsx
    │   ├── Dashboard.jsx         ← All issues + filter/search
    │   ├── CreateIssue.jsx       ← Issue submission form
    │   ├── IssueDetails.jsx      ← Single issue + comments
    │   ├── AdminDashboard.jsx    ← Status management table
    │   ├── Notifications.jsx
    │   └── NotFound.jsx
    │
    └── utils/
        └── helpers.js       ← formatDate, timeAgo, STATUS_META, etc.
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Spring Boot backend running on **http://localhost:8080**

### 1. Install dependencies
```bash
cd civic-frontend
npm install
```

### 2. Configure environment (optional for local dev)
```bash
cp .env.example .env
# Leave VITE_API_BASE_URL blank — Vite will proxy /api to localhost:8080
```

### 3. Start the dev server
```bash
npm run dev
```
Open **http://localhost:3000** in your browser.

---

## ⚙️ Backend URL Configuration

### Development (default)
The `vite.config.js` already includes a proxy:
```js
proxy: {
  '/api': {
    target: 'http://localhost:8080',
    changeOrigin: true,
  },
},
```
No `.env` changes needed for local development.

### Production / Different Host
Set the `VITE_API_BASE_URL` in your `.env`:
```env
VITE_API_BASE_URL=https://api.myapp.com
```
This becomes the `baseURL` in `src/api/axiosConfig.js`.

### CORS
Your Spring Boot `SecurityConfig` already allows all origins in development. For production, restrict it to your frontend domain.

---

## 🔑 Authentication Flow

1. User logs in → backend returns JWT token
2. Token is stored in `localStorage` via `AuthContext`
3. `axiosConfig.js` interceptor attaches `Authorization: Bearer <token>` to **every request**
4. If a `401` is received, the interceptor clears storage and redirects to `/login`
5. `ProtectedRoute` / `AdminRoute` guard routes client-side

---

## 🎭 Role-Based UI

| Feature | USER | ADMIN |
|---------|------|-------|
| View all issues | ✅ | ✅ |
| Report new issue | ✅ | ✅ |
| Add comments | ✅ | ✅ |
| View own issues | ✅ | ✅ |
| View notifications | ✅ | ✅ |
| Admin Dashboard tab | ❌ | ✅ |
| Update issue status | ❌ | ✅ |
| Delete issues | ❌ | ✅ |

To promote a USER to ADMIN, update the database directly:
```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';
```
Then log out and log in again to get a fresh token.

---

## 📡 API Endpoints Used

| Method | Endpoint | File |
|--------|----------|------|
| POST | `/api/auth/register` | `authApi.js` |
| POST | `/api/auth/login` | `authApi.js` |
| GET | `/api/issues` | `issueApi.js` |
| GET | `/api/issues?mine=true` | `issueApi.js` |
| GET | `/api/issues/:id` | `issueApi.js` |
| POST | `/api/issues` | `issueApi.js` |
| PUT | `/api/issues/:id/status` | `issueApi.js` |
| DELETE | `/api/issues/:id` | `issueApi.js` |
| POST | `/api/issues/:id/comments` | `issueApi.js` |
| GET | `/api/notifications` | `notificationApi.js` |

---

## 🎨 Design System

Built on **Tailwind CSS** with custom design tokens:

| Token | Usage |
|-------|-------|
| `civic-*` | Primary green accent (500 = main action) |
| `ink-*` | Dark neutral palette (900/950 = backgrounds) |
| `font-display` | Syne — headings |
| `font-sans` | DM Sans — body text |
| `font-mono` | JetBrains Mono — badges/IDs |

Custom CSS classes (in `index.css`):
- `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ghost`
- `.input`, `.label`
- `.card`, `.card-hover`
- `.badge`, `.badge-pending`, `.badge-progress`, `.badge-resolved`

---

## 🏗️ Build for Production

```bash
npm run build
# Output goes to /dist
npm run preview   # Preview the production build locally
```

---

## 🐛 Troubleshooting

**"Network Error" / CORS issues**
- Ensure Spring Boot is running on port 8080
- Check `vite.config.js` proxy target matches your backend port

**Login redirects back immediately**
- Check browser console for JWT errors
- Clear `localStorage` and try again: `localStorage.clear()`

**Admin routes show "Access denied"**
- Verify user role is `ADMIN` in the database
- Log out and log back in to refresh the token
