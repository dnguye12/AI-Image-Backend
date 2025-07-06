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

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(middleware.requestLogger)

app.use("/api/user", userRouter)
app.use("/api/image", imageRouter)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app