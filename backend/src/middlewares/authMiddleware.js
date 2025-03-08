const jwt = require("jsonwebtoken")
const { User, Group } = require("../models")

/**
 * Middleware para verificar autenticação
 */
exports.authenticate = async (req, res, next) => {
  try {
    // Verificar se o token foi fornecido
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token não fornecido" })
    }

    const token = authHeader.split(" ")[1]

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Buscar usuário
    const user = await User.findByPk(decoded.id, {
      include: [{ model: Group }],
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Usuário não encontrado ou inativo" })
    }

    // Adicionar usuário ao request
    req.user = user

    next()
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expirado" })
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Token inválido" })
    }

    console.error("Erro na autenticação:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

/**
 * Middleware para verificar permissões
 * @param {string} resource - Recurso a ser verificado
 * @param {string} action - Ação a ser verificada
 */
exports.authorize = (resource, action) => {
  return async (req, res, next) => {
    try {
      const { user } = req

      // Verificar se o usuário tem grupos
      if (!user.Groups || user.Groups.length === 0) {
        return res.status(403).json({ message: "Sem permissão para acessar este recurso" })
      }

      // Verificar se algum grupo tem a permissão necessária
      const hasPermission = user.Groups.some((group) => {
        const permissions = group.permissions

        if (!permissions) return false

        return permissions[resource] && permissions[resource].includes(action)
      })

      if (!hasPermission) {
        return res.status(403).json({ message: "Sem permissão para acessar este recurso" })
      }

      next()
    } catch (error) {
      console.error("Erro na autorização:", error)
      return res.status(500).json({ message: "Erro interno do servidor" })
    }
  }
}

