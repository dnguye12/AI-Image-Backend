import { NextFunction, Request, Response } from "express"
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from "cookie-parser";

const express = require("express")
const config = require("./utils/config")
const helmet = require("helmet")
require("express-async-errors")
const app = express()
const cors = require("cors")

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
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'"],
        }
    }
}))
app.use((req: Request, res: Response, next: NextFunction) => {
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

app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.match(/^\/api\/image\/[^\/]+\/image$/)) {
        return next()
    }
    const referer = req.get("referer") || ""
    if (!referer.startsWith(config.FRONTEND_URL)) {
        return res.status(403).send("Forbidden")
    }

    next()
})

app.use("/api/user", userRouter)
app.use("/api/image", imageRouter)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app