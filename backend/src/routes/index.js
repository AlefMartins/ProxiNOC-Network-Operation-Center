const express = require("express")
const router = express.Router()
const authRoutes = require("./authRoutes")
const deviceRoutes = require("./deviceRoutes")
const auditRoutes = require("./auditRoutes")
const userRoutes = require("./userRoutes")
const groupRoutes = require("./groupRoutes")
const ldapRoutes = require("./ldapRoutes")
const systemRoutes = require("./systemRoutes")
const emailRoutes = require("./emailRoutes")

// Rotas da API
router.use("/auth", authRoutes)
router.use("/devices", deviceRoutes)
router.use("/audit", auditRoutes)
router.use("/users", userRoutes)
router.use("/groups", groupRoutes)
router.use("/ldap", ldapRoutes)
router.use("/system", systemRoutes)
router.use("/email", emailRoutes)

module.exports = router

