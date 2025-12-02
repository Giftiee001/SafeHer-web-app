SafeHer - Women's Safety Application

SafeHer is a web application dedicated to women's safety, providing emergency alerts, healthcare resources, and community support.

## 🚀 Tech Stack

* **Frontend:** React (Vite), Netlify (Hosting)
* **Backend:** Node.js, Express.js, Render (Hosting)
* **Database:** Supabase (PostgreSQL)
* **Authentication:** JWT (JSON Web Tokens) & Cookies

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:
* [Node.js](https://nodejs.org/) (v16 or higher)
* [npm](https://www.npmjs.com/) (Node Package Manager)
* A [Supabase](https://supabase.com/) account (for the database)

---

## ⚙️ Local Development Setup

To run this project locally, you need to set up the **Backend** and **Frontend** in two separate terminals.

### 1. Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd "SafeHer web/safeher-backend"
    # Note: Check your actual folder name, it might be 'safeher-backend'
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  **Create Environment Variables:**
    Create a file named `.env` in the backend folder and add the following config (fill in your Supabase keys):

    ```env
    NODE_ENV=development
    PORT=5000
    
    # Supabase Configuration
    SUPABASE_URL=your_supabase_project_url
    SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_KEY=your_supabase_service_key_secret

    # Frontend URL (For CORS)
    # Use localhost for local dev, or your Netlify URL for production
    CLIENT_URL=http://localhost:5173 

    # Security
    JWT_SECRET=your_super_secret_key
    JWT_EXPIRE=7d
    ```

4.  Start the Server:
    ```bash
    npm start
    # OR
    node server.js
    ```
    *The server should run on `http://localhost:5000`*

---

### 2. Frontend Setup

1.  Open a **new terminal** and navigate to the frontend directory:
    ```bash
    cd safeher-web
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  **Configure API Connection:**
    Ensure your frontend api configuration points to your local backend.
    
    * **For Local Dev:** `http://localhost:5000/api/v1`
    * **For Production:** `https://your-app.onrender.com/api/v1`

4.  Start the React App:
    ```bash
    npm run dev
    ```
    *The app should open at `http://localhost:5173` (or similar).*

---

## 📡 API Endpoints

The Backend API is prefixed with `/api/v1`.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/` | API Health Check |
| **POST** | `/api/v1/auth/register` | Register a new user |
| **POST** | `/api/v1/auth/login` | Login user |
| **GET** | `/api/v1/emergency` | Get emergency contacts |

---

## 🌍 Deployment

### Backend (Render)
1.  Connect your GitHub repo to Render.
2.  **Root Directory:** `SafeHer web/safeher-backend` (or your specific path).
3.  **Build Command:** `npm install`
4.  **Start Command:** `node server.js`
5.  **Environment Variables:** Add all variables from your `.env` file to the Render "Environment" tab.
    * *Important:* Set `CLIENT_URL` to your Netlify link (e.g., `https://safeher.netlify.app` - **no trailing slash**).

### Frontend (Netlify)
1.  Connect your GitHub repo to Netlify.
2.  **Build Command:** `npm run build`
3.  **Publish Directory:** `dist`
4.  Update your API base URL in the code to point to the Render backend link.
