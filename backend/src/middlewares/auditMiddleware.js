const { AuditLog } = require("../models")

/**
 * Middleware para registrar ações na auditoria
 * @param {string} action - Ação a ser registrada
 * @param {string} target - Alvo da ação
 * @param {Function} detailsFunction - Função para gerar detalhes (opcional)
 */
exports.auditLog = (action, target, detailsFunction = null) => {
  return async (req, res, next) => {
    // Armazenar o método original de envio de resposta
    const originalSend = res.send

    // Sobrescrever o método para capturar a resposta
    res.send = function (body) {
      // Restaurar o método original
      res.send = originalSend

      // Processar a resposta
      try {
        const responseBody = typeof body === "string" ? JSON.parse(body) : body
        const success = res.statusCode >= 200 && res.statusCode < 300

        // Gerar detalhes
        let details = ""

        if (typeof detailsFunction === "function") {
          details = detailsFunction(req, responseBody, success)
        } else {
          details = success ? `${action} bem-sucedido` : `${action} falhou`
        }

        // Registrar na auditoria se o usuário estiver autenticado ou for login
        if (req.user || action === "login") {
          const userId = req.user ? req.user.id : null
          const username = req.user ? req.user.username : req.body.username || "Anônimo"

          AuditLog.create({
            userId,
            username,
            action,
            target,
            details,
            ip: req.ip,
            timestamp: new Date(),
            // Remover o campo status
          }).catch((err) => {
            console.error("Erro ao registrar na auditoria:", err)
          })
        }
      } catch (error) {
        console.error("Erro ao processar resposta para auditoria:", error)
      }

      // Chamar o método original
      return originalSend.call(this, body)
    }

    next()
  }
}

