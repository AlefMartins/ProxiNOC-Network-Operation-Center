const { AuditLog, User, CommandLog, Device } = require("../models")
const { Op } = require("sequelize")
const sequelize = require("../models").sequelize // Import sequelize

// Listar logs de auditoria com filtros
exports.getAuditLogs = async (req, res) => {
  try {
    const { startDate, endDate, username, action, target, page = 1, limit = 20 } = req.query

    const offset = (page - 1) * limit

    // Construir condições de filtro
    const where = {}

    if (startDate && endDate) {
      where.timestamp = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      }
    } else if (startDate) {
      where.timestamp = {
        [Op.gte]: new Date(startDate),
      }
    } else if (endDate) {
      where.timestamp = {
        [Op.lte]: new Date(endDate),
      }
    }

    if (username) {
      where.username = username
    }

    if (action) {
      where.action = action
    }

    if (target) {
      where.target = target
    }

    // Buscar logs com paginação
    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      include: [{ model: User, attributes: ["id", "username", "fullName"] }],
      order: [["timestamp", "DESC"]],
      limit: Number.parseInt(limit),
      offset,
    })

    return res.json({
      total: count,
      page: Number.parseInt(page),
      limit: Number.parseInt(limit),
      pages: Math.ceil(count / limit),
      logs: rows,
    })
  } catch (error) {
    console.error("Erro ao buscar logs de auditoria:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

// Obter ações disponíveis para filtro
exports.getAuditActions = async (req, res) => {
  try {
    const actions = await AuditLog.findAll({
      attributes: [[sequelize.fn("DISTINCT", sequelize.col("action")), "action"]],
      order: [["action", "ASC"]],
    })

    return res.json(actions.map((a) => a.action))
  } catch (error) {
    console.error("Erro ao buscar ações de auditoria:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

// Obter alvos disponíveis para filtro
exports.getAuditTargets = async (req, res) => {
  try {
    const targets = await AuditLog.findAll({
      attributes: [[sequelize.fn("DISTINCT", sequelize.col("target")), "target"]],
      order: [["target", "ASC"]],
    })

    return res.json(targets.map((t) => t.target))
  } catch (error) {
    console.error("Erro ao buscar alvos de auditoria:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

// Listar logs de comandos com filtros
exports.getCommandLogs = async (req, res) => {
  try {
    const { startDate, endDate, username, deviceId, protocol, command, page = 1, limit = 20 } = req.query

    const offset = (page - 1) * limit

    // Construir condições de filtro
    const where = {}

    if (startDate && endDate) {
      where.timestamp = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      }
    } else if (startDate) {
      where.timestamp = {
        [Op.gte]: new Date(startDate),
      }
    } else if (endDate) {
      where.timestamp = {
        [Op.lte]: new Date(endDate),
      }
    }

    if (deviceId) {
      where.deviceId = deviceId
    }

    if (protocol) {
      where.protocol = protocol
    }

    if (command) {
      where.command = {
        [Op.like]: `%${command}%`,
      }
    }

    // Configurar include para usuário
    const include = [{ model: Device, attributes: ["id", "name", "ip"] }]

    if (username) {
      include.push({
        model: User,
        attributes: ["id", "username", "fullName"],
        where: { username },
      })
    } else {
      include.push({
        model: User,
        attributes: ["id", "username", "fullName"],
      })
    }

    // Buscar logs com paginação
    const { count, rows } = await CommandLog.findAndCountAll({
      where,
      include,
      order: [["timestamp", "DESC"]],
      limit: Number.parseInt(limit),
      offset,
    })

    return res.json({
      total: count,
      page: Number.parseInt(page),
      limit: Number.parseInt(limit),
      pages: Math.ceil(count / limit),
      logs: rows,
    })
  } catch (error) {
    console.error("Erro ao buscar logs de comandos:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

// Exportar logs de auditoria
exports.exportAuditLogs = async (req, res) => {
  try {
    const { startDate, endDate, username, action, target, format = "json" } = req.query

    // Construir condições de filtro
    const where = {}

    if (startDate && endDate) {
      where.timestamp = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      }
    } else if (startDate) {
      where.timestamp = {
        [Op.gte]: new Date(startDate),
      }
    } else if (endDate) {
      where.timestamp = {
        [Op.lte]: new Date(endDate),
      }
    }

    if (username) {
      where.username = username
    }

    if (action) {
      where.action = action
    }

    if (target) {
      where.target = target
    }

    // Buscar logs
    const logs = await AuditLog.findAll({
      where,
      include: [{ model: User, attributes: ["id", "username", "fullName"] }],
      order: [["timestamp", "DESC"]],
    })

    // Formatar dados para exportação
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      timestamp: log.timestamp,
      username: log.username,
      fullName: log.User ? log.User.fullName : null,
      action: log.action,
      target: log.target,
      details: log.details,
      ip: log.ip,
    }))

    // Exportar no formato solicitado
    switch (format.toLowerCase()) {
      case "csv":
        // Implementar exportação CSV
        res.setHeader("Content-Type", "text/csv")
        res.setHeader("Content-Disposition", "attachment; filename=audit_logs.csv")
        // Lógica para converter para CSV
        break
      case "xlsx":
        // Implementar exportação XLSX
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        res.setHeader("Content-Disposition", "attachment; filename=audit_logs.xlsx")
        // Lógica para converter para XLSX
        break
      case "pdf":
        // Implementar exportação PDF
        res.setHeader("Content-Type", "application/pdf")
        res.setHeader("Content-Disposition", "attachment; filename=audit_logs.pdf")
        // Lógica para converter para PDF
        break
      case "json":
      default:
        res.setHeader("Content-Type", "application/json")
        res.setHeader("Content-Disposition", "attachment; filename=audit_logs.json")
        return res.json(formattedLogs)
    }
  } catch (error) {
    console.error("Erro ao exportar logs de auditoria:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

