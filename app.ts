import { NextFunction, Request, Response } from "express"
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from "cookie-parser";

const express = require("express")
const config = require("./utils/config")
const helmet = require("helmet")
require("express-async-errors")
const app = express()
const cors = require("cors")
const path = require("path");

const userRouter = require("./controllers/user")
const imageRouter = require("./controllers/image")

const middleware = require("./utils/middleware")
const logger = require("./utils/logger")

const mongoose = require("mongoose")

mongoose.set("strictQuery", false);

logger.info("connecting to", config.MONGODB_URI)

mongoose
    .connect(config.MONGODB_URI)
    .then(() => {
        logger.info("connected to MongoDB");
    })
    .catch((error: Error) => {
        logger.error("error connecting to MongoDB:", error.message);
    });

const allowedOrigins = [
    config.FRONTEND_URL
]

app.use(helmet({
    crossOriginResourcePolicy: {
        policy: "cross-origin"
    },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'", "https://challenges.cloudflare.com", "https://clerk-telemetry.com"],
            scriptSrc: ["'self'", config.CLERK_DB_URL, config.FRONTEND_URL],
            scriptSrcElem: [
                "'self'",
                config.CLERK_DB_URL,
                "https://challenges.cloudflare.com",
                config.FRONTEND_URL
            ],
            connectSrc: [
                "'self'",
                config.CLERK_DB_URL,
                "https://clerk-telemetry.com",
                config.FRONTEND_URL
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
            ],
            workerSrc: [
                "'self'",
                "blob:",
            ],
            imgSrc: [
                "'self'", 
                "data:", 
                "blob:",
                "https://img.clerk.com",
                "https://pollinations.ai",
                "https://image.pollinations.ai",
                config.FRONTEND_URL
            ],
            fontSrc: ["'self'", "data:"],
        }
    }
}))

const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === "OPTIONS") {
        return next()
    }
    const isPublicImage = req.method === "GET" && /^\/api\/image\/[^\/]+\/image$/.test(req.path)

    if (isPublicImage) {
        return cors()(req, res, next)
    }

    return cors({
        origin: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true)
            }
            callback(new Error("CORS: Not allowed"), false)
        },
        optionsSuccessStatus: 200
    })(req, res, next)
})

app.use(express.json())

app.use(mongoSanitize({
    replaceWith: '_'
}))
app.use(cookieParser());

app.use(middleware.requestLogger)

app.use("/api/user", userRouter)
app.use("/api/image", imageRouter)

app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
})

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app