// server.js

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middlewares/ErrorHandler');
const collectedCashRoutes = require('./routers/collectedCashRoutes');
const userRouter = require('./routers/UserRouters');
const solutionCardRouter = require('./routers/SolutionCardRouters');
const expenseRouter = require('./routers/ExpenseRouter');
const dashboardRouter = require('./routers/DashboardRoutes');
const cookieParser = require('cookie-parser');


const app = express();
app.use(cookieParser());

// --- Security Middlewares ---

// Use helmet to set secure HTTP headers
app.use(helmet());

// Enable CORS for all origins (development - change to specific origins in production)
// app.use(cors({
//     origin: '*',
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
// }));

app.use(cors({
    origin: 'http://localhost:5173', // <-- set your Vite app's URL
    credentials: true,
}));
// --- Rate Limiting ---

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 100,                 // limit each IP to 100 requests per window
    standardHeaders: true,    // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,     // Disable the `X-RateLimit-*` headers
    message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api', apiLimiter);

// --- Body Parser ---

app.use(express.json()); // Parse JSON bodies

// --- MongoDB Connection ---

// Connection with caching to avoid multiple connections in serverless environments
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }).then(mongoose => mongoose);
    }
    cached.conn = await cached.promise;
    return cached.conn;
}

// Connect to DB on start (optional - serverless functions will connect on-demand)
// You can uncomment below to connect on startup
/*
connectToDatabase()
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
*/

// --- Routes ---

// Use routers for different API sections
app.use('/api', userRouter);
app.use('/api/solution', solutionCardRouter);
app.use('/api/expense', expenseRouter);
app.use('/api/collected-cash', collectedCashRoutes);
app.use('/api', dashboardRouter);

// --- Error Handling Middleware ---

app.use(errorHandler);

// --- Start Server ---

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

connectToDatabase()
    .then(() => {
        console.log('MongoDB connected');
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });