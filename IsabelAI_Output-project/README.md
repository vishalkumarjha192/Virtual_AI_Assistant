# Isabel AI — MERN Stack Full-Stack Application

A full-stack AI chatbot web application built with **MongoDB, Express, React, and Node.js**, featuring a beautiful animated avatar, real-time voice interaction, and GPT-4 powered conversations.

---

## 🏗️ Project Structure

```
isabel-ai/
├── backend/                  # Node.js + Express API
│   ├── config/
│   │   └── db.js             # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js # Register/login/logout
│   │   └── chatController.js # AI chat + conversation CRUD
│   ├── middleware/
│   │   ├── authMiddleware.js  # JWT protect middleware
│   │   └── errorMiddleware.js # Global error handler
│   ├── models/
│   │   ├── User.js            # User schema (bcrypt hashed)
│   │   └── Conversation.js    # Conversation + messages schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── chatRoutes.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/                 # React + Vite
    ├── src/
    │   ├── context/
    │   │   ├── AuthContext.jsx  # Auth state (login/register/logout)
    │   │   └── ChatContext.jsx  # Chat state (conversations/messages)
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── OrbAvatar.jsx    # Animated glowing orb
    │   │   └── MessageBubble.jsx # Markdown chat bubbles
    │   ├── pages/
    │   │   ├── Introduction.jsx # Landing page
    │   │   ├── Virtual.jsx      # Virtual avatar page
    │   │   ├── ChatPage.jsx     # Full MERN AI chat
    │   │   ├── Login.jsx
    │   │   └── Register.jsx
    │   ├── App.jsx              # Router + protected routes
    │   ├── main.jsx
    │   └── index.css            # Global styles + CSS variables
    ├── index.html
    ├── package.json
    └── vite.config.js           # Proxy to backend
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+
- **MongoDB** (local) or MongoDB Atlas
- **OpenAI API Key** — get one at [platform.openai.com](https://platform.openai.com)

---

### 1. Clone & install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env

PORT=5000
MONGO_URI=mongodb://localhost:27017/isabel-ai
JWT_SECRET=your_super_secret_jwt_key_here
COOKIE_SECRET=your_cookie_secret_here
NODE_ENV=development
GROQ_API_KEY=gsk_4iia...............


```

### 3. Start backend

```bash
cd backend
npm run dev
# Server running on http://localhost:5000
```

### 4. Start frontend

```bash
cd frontend
npm run dev
# App running on http://localhost:5173
```

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/register` | Create account | ❌ |
| POST | `/api/v1/auth/login` | Sign in | ❌ |
| POST | `/api/v1/auth/logout` | Sign out | ✅ |
| GET  | `/api/v1/auth/me` | Get current user | ✅ |

### Chat
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/chat` | Send message (new or existing conversation) | ✅ |
| GET  | `/api/v1/chat` | List all conversations | ✅ |
| GET  | `/api/v1/chat/:id` | Get conversation with messages | ✅ |
| DELETE | `/api/v1/chat/:id` | Delete a conversation | ✅ |
| DELETE | `/api/v1/chat/all` | Clear all conversations | ✅ |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, React Router v6, Vite |
| **State** | React Context API |
| **Styling** | Inline CSS + CSS animations |
| **AI** | Groq |
| **Markdown** | react-markdown + react-syntax-highlighter |
| **Backend** | Node.js, Express |
| **Database** | MongoDB + Mongoose |
| **Auth** | JWT + bcryptjs + httpOnly cookies |
| **HTTP Client** | Axios (with proxy) |
| **Notifications** | react-hot-toast |
| **Voice** | Web Speech API (STT + TTS) |

---

## 🔑 Features

- **JWT Authentication** with httpOnly cookies and secure sessions
- **MongoDB persistence** — all conversations saved per user
- **GPT-4o-mini** AI responses with last-20-message context window
- **React Markdown** rendering — code blocks with syntax highlighting
- **Voice Input** (Speech-to-Text) via Web Speech API
- **Text-to-Speech** output with voice selection
- **Animated Orb Avatar** with idle/thinking/talking/listening states
- **Conversation Sidebar** with history and delete support
- **Virtual Avatar Page** with settings and roadmap panels
- **Protected Routes** — chat requires authentication
- **Responsive Design** — works on mobile and desktop

---

## 🏭 Production Deployment

### Build frontend
```bash
cd frontend
npm run build
# Outputs to frontend/dist/
```

### Serve from Express (optional)
Add to `backend/server.js`:
```js
import path from "path";
app.use(express.static(path.join(process.cwd(), "../frontend/dist")));
app.get("*", (req, res) => res.sendFile(path.join(process.cwd(), "../frontend/dist/index.html")));
```

### Environment for production
```env
NODE_ENV=production
MONGO_URI=mongodb+srv://...   # MongoDB Atlas
```

---

## 📄 License
© 2026 Isabel AI. All rights reserved.

