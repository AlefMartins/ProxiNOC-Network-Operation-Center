const emailService = require("../services/emailService")
const { AuditLog } = require("../models")

// Obter configuração de email
exports.getEmailConfig = async (req, res) => {
  try {
    console.log("Obtendo configuração de email")
    const config = await emailService.getEmailConfig()

    // Retornar um objeto estruturado mesmo quando não há configuração
    return res.json(
      config || {
        host: "",
        port: 587,
        secure: false,
        username: "",
        fromEmail: "",
        fromName: "ProxiNOC-GDR",
        enabled: false,
      },
    )
  } catch (error) {
    console.error("Erro ao obter configuração de email:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

// Atualizar configuração de email
exports.updateEmailConfig = async (req, res) => {
  try {
    console.log("Atualizando configuração de email", req.body)
    const updatedConfig = await emailService.updateEmailConfig(req.body)

    // Registrar na auditoria
    await AuditLog.create({
      userId: req.user.id,
      username: req.user.username,
      action: "update",
      target: "EmailConfig",
      details: "Configuração de email atualizada",
      ip: req.ip,
      timestamp: new Date(),
    })

    return res.json(updatedConfig)
  } catch (error) {
    console.error("Erro ao atualizar configuração de email:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

// Testar configuração de email
exports.testEmail = async (req, res) => {
  try {
    console.log("Testando configuração de email", req.body)
    const result = await emailService.testEmail(req.body)

    // Registrar na auditoria
    await AuditLog.create({
      userId: req.user.id,
      username: req.user.username,
      action: "test",
      target: "EmailConfig",
      details: result.success ? "Teste de email bem-sucedido" : `Teste de email falhou: ${result.message}`,
      ip: req.ip,
      timestamp: new Date(),
    })

    return res.json(result)
  } catch (error) {
    console.error("Erro ao testar email:", error)
    return res.status(500).json({
      success: false,
      message: `Erro ao testar email: ${error.message}`,
    })
  }
}

// Verificar permissões (endpoint de debug)
exports.checkPermissions = async (req, res) => {
  try {
    const user = req.user
    const groups = user.Groups.map((g) => ({
      name: g.name,
      permissions: g.permissions,
    }))

    return res.json({
      username: user.username,
      groups: groups,
    })
  } catch (error) {
    console.error("Erro ao verificar permissões:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

