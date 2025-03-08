const passwordService = require("../services/passwordService")
const { AuditLog } = require("../models")

/**
 * Controlador para gerenciamento de senhas
 */
const passwordController = {
  /**
   * Altera a senha do usuário logado
   * @param {Object} req - Requisição
   * @param {Object} res - Resposta
   */
  async changePassword(req, res) {
    try {
      const userId = req.user.id
      const { newPassword } = req.body

      // Validar campos obrigatórios
      if (!newPassword) {
        return res.status(400).json({
          success: false,
          message: "Nova senha é obrigatória",
        })
      }

      // Validar complexidade da senha
      const validationResult = passwordService.validatePasswordComplexity(newPassword)
      if (!validationResult.valid) {
        return res.status(400).json({
          success: false,
          message: validationResult.message,
        })
      }

      // Alterar senha
      console.log(`Iniciando alteração de senha para usuário ID ${userId}`)
      const result = await passwordService.changePassword(userId, newPassword)

      // Registrar na auditoria
      await AuditLog.create({
        userId: req.user.id,
        username: req.user.username,
        action: "change_password",
        target: "User",
        details: result.success ? "Senha alterada com sucesso" : "Falha ao alterar senha",
        ip: req.ip,
        timestamp: new Date(),
      })

      if (result.success) {
        return res.json(result)
      } else {
        return res.status(400).json(result)
      }
    } catch (error) {
      console.error("Erro ao alterar senha:", error)
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      })
    }
  },

  /**
   * Altera a senha de outro usuário (admin)
   * @param {Object} req - Requisição
   * @param {Object} res - Resposta
   */
  async changeUserPassword(req, res) {
    try {
      const { userId } = req.params
      const { newPassword } = req.body

      // Validar campos obrigatórios
      if (!newPassword) {
        return res.status(400).json({
          success: false,
          message: "Nova senha é obrigatória",
        })
      }

      // Validar complexidade da senha
      const validationResult = passwordService.validatePasswordComplexity(newPassword)
      if (!validationResult.valid) {
        return res.status(400).json({
          success: false,
          message: validationResult.message,
        })
      }

      // Alterar senha
      console.log(`Admin ${req.user.username} alterando senha para usuário ID ${userId}`)
      const result = await passwordService.changeUserPassword(userId, newPassword, req.user)

      // Registrar na auditoria
      await AuditLog.create({
        userId: req.user.id,
        username: req.user.username,
        action: "change_user_password",
        target: "User",
        targetId: userId,
        details: result.success ? "Senha alterada com sucesso" : "Falha ao alterar senha",
        ip: req.ip,
        timestamp: new Date(),
      })

      if (result.success) {
        return res.json(result)
      } else {
        return res.status(400).json(result)
      }
    } catch (error) {
      console.error("Erro ao alterar senha:", error)
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      })
    }
  },

  /**
   * Reseta a senha de um usuário (admin)
   * @param {Object} req - Requisição
   * @param {Object} res - Resposta
   */
  async resetUserPassword(req, res) {
    try {
      const { userId } = req.params
      const { newPassword } = req.body

      // Validar campos obrigatórios
      if (!newPassword) {
        return res.status(400).json({
          success: false,
          message: "Nova senha é obrigatória",
        })
      }

      // Validar complexidade da senha
      const validationResult = passwordService.validatePasswordComplexity(newPassword)
      if (!validationResult.valid) {
        return res.status(400).json({
          success: false,
          message: validationResult.message,
        })
      }

      // Resetar senha
      console.log(`Admin ${req.user.username} resetando senha para usuário ID ${userId}`)
      const result = await passwordService.resetUserPassword(userId, newPassword, req.user)

      // Registrar na auditoria
      await AuditLog.create({
        userId: req.user.id,
        username: req.user.username,
        action: "reset_user_password",
        target: "User",
        targetId: userId,
        details: result.success ? "Senha resetada com sucesso" : "Falha ao resetar senha",
        ip: req.ip,
        timestamp: new Date(),
      })

      if (result.success) {
        return res.json(result)
      } else {
        return res.status(400).json(result)
      }
    } catch (error) {
      console.error("Erro ao resetar senha:", error)
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      })
    }
  },
}

module.exports = passwordController

