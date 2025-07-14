require("dotenv").config()

const PORT = process.env.PORT || 3001
const MONGODB_URI = process.env.MONGODB_URI
const FRONTEND_URL = process.env.FRONTEND_URL
const CLERK_DB_URL = process.env.CLERK_DB_URL

module.exports = {
    PORT,
    MONGODB_URI,
    FRONTEND_URL,
    CLERK_DB_URL
}