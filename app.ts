import { NextFunction, Request, Response } from "express"

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

app.use(helmet())
app.use(cors({
    origin: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin || !allowedOrigins.includes(origin)) {
            return callback(new Error("CORS: Not allowed"), false)
        }
        callback(null, true)
    },
    optionsSuccessStatus: 200
}))
app.use(express.json())
app.use(middleware.requestLogger)

app.use((req: Request, res: Response, next: NextFunction) => {
    const referer = req.get("referer") || ""
    if(!referer.startsWith(config.FRONTEND_URL)) {
        return res.status(403).send("Forbidden")
    }

    next()
})

app.use("/api/user", userRouter)
app.use("/api/image", imageRouter)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app