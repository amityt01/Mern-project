# Backend-26 Project Documentation

Welcome to the **Backend-26** REST API documentation. This project is a Node.js and Express-based backend application that provides complete CRUD (Create, Read, Update, Delete) operations for managing **Student** records in a MongoDB database using Mongoose ODM.

---

## 📂 Project Directory Structure

```text
backend-26/
├── bin/
│   └── www                 # Application entry point and server setup
├── config/
│   └── db.js               # MongoDB database connection configuration
├── models/
│   └── Student.js          # Mongoose schema and model for Student
├── routes/
│   └── students.js         # API endpoint routes for Student CRUD operations
├── views/                  # Jade views (for error and default layouts)
│   ├── error.jade
│   ├── index.jade
│   └── layout.jade
├── public/                 # Static files (images, javascripts, stylesheets)
├── .env                    # Environment variables configuration
├── app.js                  # Express application setup and middleware configuration
├── package.json            # Project dependencies and metadata
└── package-lock.json       # Dependency tree lock file
```

---

## 🛠️ Technology Stack & Dependencies

The project relies on the following core dependencies (defined in [package.json](file:///C:/Users/golua/OneDrive/Desktop/Backend-27-main/Backend-27-main/backend-27/backend-26/backend-26/package.json)):

*   **Runtime:** [Node.js](https://nodejs.org/)
*   **Web Framework:** [Express.js](https://expressjs.com/) (v4.16.1) - Fast, unopinionated, minimalist web framework.
*   **Database ODM:** [Mongoose](https://mongoosejs.com/) (v9.7.4) - MongoDB object modeling tool.
*   **Environment Variables:** [dotenv](https://github.com/motdotla/dotenv) (v17.4.2) - Loads environment variables from `.env`.
*   **HTTP Logger:** [morgan](https://github.com/expressjs/morgan) (v1.9.1) - HTTP request logger middleware.
*   **Cookie Parser:** [cookie-parser](https://github.com/expressjs/cookie-parser) (v1.4.4) - Parse `Cookie` headers.
*   **Template Engine:** [jade](https://jade-lang.com/) (v1.11.0) - Template rendering (used primarily for server-side error page rendering).

---

## ⚙️ Environment Configuration

Environment variables are managed in the [.env](file:///C:/Users/golua/OneDrive/Desktop/Backend-27-main/Backend-27-main/backend-27/backend-26/backend-26/.env) file:

```env
MONGO_URI=mongodb+srv://yashwardhankumar12:<password>@cluster0.zrd7jyj.mongodb.net/studentbigDB?retryWrites=true&w=majority&appName=Cluster0
PORT=5050 (Defaults to 5000 if not specified in .env, configured in bin/www)
```

---

## 🔌 Core Components

### 1. Database Connection: [config/db.js](file:///C:/Users/golua/OneDrive/Desktop/Backend-27-main/Backend-27-main/backend-27/backend-26/backend-26/config/db.js)
Establishes connection to the MongoDB database using the `MONGO_URI` environmental variable. To bypass standard DNS resolution issues (such as `querySrv ECONNREFUSED` error when using MongoDB Atlas `mongodb+srv://` URIs), public DNS servers (Google `8.8.8.8` and Cloudflare `1.1.1.1`) are explicitly set before connecting. If connection fails, the process exits with status code `1`.
```javascript
const mongoose = require("mongoose");
const dns = require("dns");

const connectDB = async () => {
  try {
    // Set DNS servers to resolve querySrv ECONNREFUSED issues on certain networks
    dns.setServers(["8.8.8.8", "1.1.1.1"]);

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};
```

### 2. Mongoose Model: [models/Student.js](file:///C:/Users/golua/OneDrive/Desktop/Backend-27-main/Backend-27-main/backend-27/backend-26/backend-26/models/Student.js)
Defines the schema for student documents stored in the `students` collection:
*   `name` (String, Required)
*   `email` (String, Required)
*   `age` (Number, Required)

### 3. Express Application Setup: [app.js](file:///C:/Users/golua/OneDrive/Desktop/Backend-27-main/Backend-27-main/backend-27/backend-26/backend-26/app.js)
Initializes Express, configures Jade view engine, handles middleware (JSON/URL-encoded parsing, static files, logger), connects to MongoDB, mounts the `/students` route, and configures error handling.

---

## 🚀 API Endpoints: [routes/students.js](file:///C:/Users/golua/OneDrive/Desktop/Backend-27-main/Backend-27-main/backend-27/backend-26/backend-26/routes/students.js)

All endpoints below are prefixed with `/students`.

### 1. Create Student
*   **Route:** `POST /students`
*   **Description:** Creates and saves a new student record to the database.
*   **Request Body (JSON):**
    ```json
    {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "age": 21
    }
    ```
*   **Response (201 Created):** Returns the created student object including database-generated `_id` and `__v`.

### 2. Read All Students
*   **Route:** `GET /students`
*   **Description:** Retrieves all student records from the database.
*   **Response (200 OK):** An array of student objects.

### 3. Read One Student
*   **Route:** `GET /students/:id`
*   **Description:** Retrieves a specific student record by its MongoDB ID.
*   **Response (200 OK):** The matching student object, or `null` if not found.

### 4. Update Student
*   **Route:** `PUT /students/:id`
*   **Description:** Updates a student record by its MongoDB ID.
*   **Request Body (JSON):** Fields to update (e.g., name, email, age).
*   **Response (200 OK):** The updated student object.

### 5. Delete Student
*   **Route:** `DELETE /students/:id`
*   **Description:** Deletes a student record by its MongoDB ID.
*   **Response (200 OK):**
    ```json
    {
      "message": "Student Deleted Successfully"
    }
    ```

---

## 🏃 How to Run the Project

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Start the server:**
    ```bash
    npm start
    ```
    This script executes `node ./bin/www` (configured in [bin/www](file:///C:/Users/golua/OneDrive/Desktop/Backend-27-main/Backend-27-main/backend-27/backend-26/backend-26/bin/www)), starting the server at `http://localhost:5000` (or the configured `PORT`).
