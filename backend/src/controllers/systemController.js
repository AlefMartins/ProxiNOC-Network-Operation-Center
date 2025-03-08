const { SystemSetting, EmailConfig } = require("../models")
const emailService = require("../services/emailService")
const os = require("os")

// Obter informações do sistema
exports.getSystemInfo = async (req, res) => {
  try {
    const systemInfo = {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: Math.round(os.totalmem() / (1024 * 1024 * 1024)) + " GB",
      freeMemory: Math.round(os.freemem() / (1024 * 1024 * 1024)) + " GB",
      uptime: Math.round(os.uptime() / 3600) + " hours",
      nodeVersion: process.version,
      processUptime: Math.round(process.uptime() / 3600) + " hours",
    }

    res.json(systemInfo)
  } catch (error) {
    console.error("Error getting system info:", error)
    res.status(500).json({ message: "Error getting system information" })
  }
}

// Obter configurações do sistema
exports.getSystemSettings = async (req, res) => {
  try {
    const settings = await SystemSetting.findAll()
    const settingsObject = {}

    settings.forEach((setting) => {
      settingsObject[setting.key] = setting.value
    })

    res.json(settingsObject)
  } catch (error) {
    console.error("Error getting system settings:", error)
    res.status(500).json({ message: "Error getting system settings" })
  }
}

// Atualizar configurações do sistema
exports.updateSystemSettings = async (req, res) => {
  try {
    const { settings } = req.body

    if (!settings || typeof settings !== "object") {
      return res.status(400).json({ message: "Invalid settings data" })
    }

    for (const [key, value] of Object.entries(settings)) {
      await SystemSetting.upsert({ key, value })
    }

    res.json({ message: "System settings updated successfully" })
  } catch (error) {
    console.error("Error updating system settings:", error)
    res.status(500).json({ message: "Error updating system settings" })
  }
}

// Obter configuração de email
exports.getEmailConfig = async (req, res) => {
  try {
    const emailConfig = await EmailConfig.findOne()
    res.json(emailConfig || {})
  } catch (error) {
    console.error("Error getting email config:", error)
    res.status(500).json({ message: "Error getting email configuration" })
  }
}

// Atualizar configuração de email
exports.updateEmailConfig = async (req, res) => {
  try {
    const { host, port, secure, user, password, from } = req.body

    if (!host || !port || !from) {
      return res.status(400).json({ message: "Missing required email configuration fields" })
    }

    const [emailConfig] = await EmailConfig.upsert({
      id: 1,
      host,
      port,
      secure: !!secure,
      user,
      password,
      from,
    })

    res.json({ message: "Email configuration updated successfully", config: emailConfig })
  } catch (error) {
    console.error("Error updating email config:", error)
    res.status(500).json({ message: "Error updating email configuration" })
  }
}

// Testar configuração de email
exports.testEmailConfig = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: "Test email address is required" })
    }

    const emailConfig = await EmailConfig.findOne()

    if (!emailConfig) {
      return res.status(400).json({ message: "Email configuration not found" })
    }

    const result = await emailService.sendEmail({
      to: email,
      subject: "ProxiNOC-GDR Email Test",
      text: "This is a test email from ProxiNOC-GDR system. If you received this email, your email configuration is working correctly.",
      html: "<h1>ProxiNOC-GDR Email Test</h1><p>This is a test email from ProxiNOC-GDR system. If you received this email, your email configuration is working correctly.</p>",
    })

    res.json({ message: "Test email sent successfully", result })
  } catch (error) {
    console.error("Error sending test email:", error)
    res.status(500).json({ message: "Error sending test email: " + error.message })
  }
}

