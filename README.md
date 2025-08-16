# 📚 Student Notes Hub

A modern web application for students to share, discover, and manage study materials. Built with the MERN stack (MongoDB, Express.js, React.js, Node.js) with a beautiful, responsive UI.

## ✨ Features

### 🔐 Authentication & User Management

- User registration and login with JWT authentication
- Secure password hashing with bcrypt
- User profile management
- Protected routes and middleware

### 📄 Notes Management

- Upload PDF notes with metadata (title, subject, university, tags)
- Public and private note visibility
- Advanced search and filtering capabilities
- Sort by latest, most upvoted, or most downvoted
- File upload with validation (PDF only, max 10MB)

### 🏷️ Social Features

- Upvote/downvote system for notes
- Comment system on notes
- Bookmark notes for later reference
- User activity tracking

### 🎨 Modern UI/UX

- Responsive design that works on all devices
- Modern card-based layout with hover effects
- Loading states and error handling
- Toast notifications for user feedback
- Beautiful gradients and animations
- Google Fonts integration (Inter & Poppins)

### 🔍 Advanced Search & Filters

- Real-time search across titles, subjects, universities, and tags
- Filter by subject and university
- Sort options (latest, top-rated, most downvoted)
- Pagination support

### 📊 Dashboard Analytics

- User statistics overview
- Recent notes display
- Quick action cards
- Community statistics

## 🚀 Tech Stack

### Frontend

- **React.js 19** - Modern React with hooks
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **React Icons** - Beautiful icon library
- **React Toastify** - Toast notifications
- **Axios** - HTTP client

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **multer** - File upload handling
- **express-rate-limit** - Rate limiting

## 📦 Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone the Repository

```bash
git clone <repository-url>
cd student-notes-hub
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

Start the backend server:

```bash
npm start
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Start the frontend development server:

```bash
npm start
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
student-notes-hub/
├── backend/
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API routes
│   ├── uploads/        # File uploads directory
│   ├── server.js       # Main server file
│   └── package.json
├── frontend/
│   ├── public/         # Static files
│   ├── src/
│   │   ├── components/ # Reusable components
│   │   ├── contexts/   # React contexts
│   │   ├── pages/      # Page components
│   │   ├── services/   # API services
│   │   ├── App.jsx     # Main app component
│   │   └── index.js    # Entry point
│   └── package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Notes

- `GET /api/notes` - Get all notes (with filters)
- `POST /api/notes/upload` - Upload new note
- `GET /api/notes/:id` - Get specific note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note
- `POST /api/notes/:id/upvote` - Upvote note
- `POST /api/notes/:id/downvote` - Downvote note
- `POST /api/notes/:id/bookmark` - Bookmark note
- `DELETE /api/notes/:id/bookmark` - Remove bookmark
- `GET /api/notes/bookmarks/me` - Get user bookmarks

### Comments

- `GET /api/notes/:id/comments` - Get note comments
- `POST /api/notes/:id/comments` - Add comment

## 🎯 Key Features Explained

### Dashboard

The dashboard provides an overview of user activity with:

- Statistics cards showing total notes, bookmarks, and views
- Quick action buttons for common tasks
- Recent notes from the community
- Community statistics

### Notes Browsing

Users can browse notes with advanced filtering:

- Search across multiple fields
- Filter by subject and university
- Sort by different criteria
- Responsive card layout with hover effects

### Bookmarking System

Users can bookmark notes for later reference:

- Dedicated bookmarks page
- Easy bookmark management
- Statistics on bookmarked content

### Modern UI Components

The application uses consistent design patterns:

- Custom button components with hover states
- Card layouts with shadows and transitions
- Loading spinners and error states
- Toast notifications for user feedback

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- File upload validation
- Protected routes and middleware
- Input sanitization

## 📱 Responsive Design

The application is fully responsive and works on:

- Desktop computers
- Tablets
- Mobile phones
- All modern browsers

## 🚀 Deployment

### Backend Deployment

1. Set up environment variables on your hosting platform
2. Configure MongoDB connection
3. Deploy to platforms like Heroku, Railway, or DigitalOcean

### Frontend Deployment

1. Build the production version: `npm run build`
2. Deploy to platforms like Vercel, Netlify, or GitHub Pages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- React.js team for the amazing framework
- Tailwind CSS for the utility-first approach
- MongoDB for the flexible database
- All the open-source contributors whose libraries made this possible

---

**Student Notes Hub** - Empowering students to share knowledge and learn together! 📚✨
