const { Device, AuditLog, CommandLog } = require("../models")
const pingService = require("../services/pingService")
const sshService = require("../services/sshService")
const { Op } = require("sequelize")
const { sequelize } = require("../models") // Import sequelize

// Listar todos os dispositivos
exports.getAllDevices = async (req, res) => {
  try {
    const devices = await Device.findAll()
    return res.json(devices)
  } catch (error) {
    console.error("Erro ao buscar dispositivos:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

// Buscar dispositivo por ID
exports.getDeviceById = async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.id)

    if (!device) {
      return res.status(404).json({ message: "Dispositivo não encontrado" })
    }

    return res.json(device)
  } catch (error) {
    console.error("Erro ao buscar dispositivo:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

// Criar novo dispositivo
exports.createDevice = async (req, res) => {
  try {
    const device = await Device.create(req.body)

    // Registrar na auditoria
    await AuditLog.create({
      userId: req.user.id,
      username: req.user.username,
      action: "create",
      target: "Device",
      details: `Dispositivo criado: ${device.name}`,
      ip: req.ip,
      timestamp: new Date(),
    })

    return res.status(201).json(device)
  } catch (error) {
    console.error("Erro ao criar dispositivo:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

// Atualizar dispositivo
exports.updateDevice = async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.id)

    if (!device) {
      return res.status(404).json({ message: "Dispositivo não encontrado" })
    }

    await device.update(req.body)

    // Registrar na auditoria
    await AuditLog.create({
      userId: req.user.id,
      username: req.user.username,
      action: "update",
      target: "Device",
      details: `Dispositivo atualizado: ${device.name}`,
      ip: req.ip,
      timestamp: new Date(),
    })

    return res.json(device)
  } catch (error) {
    console.error("Erro ao atualizar dispositivo:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

// Excluir dispositivo
exports.deleteDevice = async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.id)

    if (!device) {
      return res.status(404).json({ message: "Dispositivo não encontrado" })
    }

    const deviceName = device.name

    await device.destroy()

    // Registrar na auditoria
    await AuditLog.create({
      userId: req.user.id,
      username: req.user.username,
      action: "delete",
      target: "Device",
      details: `Dispositivo excluído: ${deviceName}`,
      ip: req.ip,
      timestamp: new Date(),
    })

    return res.json({ message: "Dispositivo excluído com sucesso" })
  } catch (error) {
    console.error("Erro ao excluir dispositivo:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

// Verificar status do dispositivo (ping)
exports.checkDeviceStatus = async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.id)

    if (!device) {
      return res.status(404).json({ message: "Dispositivo não encontrado" })
    }

    const pingResult = await pingService.pingHost(device.ip)

    // Atualizar status e latência do dispositivo
    const oldStatus = device.status
    device.status = pingResult.alive ? "online" : "offline"
    device.latency = pingResult.time || 0
    device.lastSeen = pingResult.alive ? new Date() : device.lastSeen
    await device.save()

    // Se o status mudou, registrar na auditoria
    if (oldStatus !== device.status) {
      await AuditLog.create({
        userId: req.user.id,
        username: req.user.username,
        action: "status_change",
        target: device.name,
        details: `Status alterado de ${oldStatus} para ${device.status}`,
        ip: req.ip,
        timestamp: new Date(),
      })
    }

    return res.json({
      id: device.id,
      name: device.name,
      ip: device.ip,
      status: device.status,
      latency: device.latency,
      lastSeen: device.lastSeen,
    })
  } catch (error) {
    console.error("Erro ao verificar status do dispositivo:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

// Verificar status de todos os dispositivos
exports.checkAllDevicesStatus = async (req, res) => {
  try {
    const devices = await Device.findAll()
    const results = []

    for (const device of devices) {
      try {
        const pingResult = await pingService.pingHost(device.ip)

        // Atualizar status e latência do dispositivo
        const oldStatus = device.status
        device.status = pingResult.alive ? "online" : "offline"
        device.latency = pingResult.time || 0
        device.lastSeen = pingResult.alive ? new Date() : device.lastSeen
        await device.save()

        // Se o status mudou, registrar na auditoria
        if (oldStatus !== device.status) {
          await AuditLog.create({
            userId: req.user.id,
            username: req.user.username,
            action: "status_change",
            target: device.name,
            details: `Status alterado de ${oldStatus} para ${device.status}`,
            ip: req.ip,
            timestamp: new Date(),
          })
        }

        results.push({
          id: device.id,
          name: device.name,
          ip: device.ip,
          status: device.status,
          latency: device.latency,
          lastSeen: device.lastSeen,
        })
      } catch (error) {
        console.error(`Erro ao verificar dispositivo ${device.name}:`, error)
        results.push({
          id: device.id,
          name: device.name,
          ip: device.ip,
          status: "error",
          error: error.message,
        })
      }
    }

    return res.json(results)
  } catch (error) {
    console.error("Erro ao verificar status dos dispositivos:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

// Executar comando SSH
exports.executeCommand = async (req, res) => {
  try {
    const { command } = req.body
    const device = await Device.findByPk(req.params.id)

    if (!device) {
      return res.status(404).json({ message: "Dispositivo não encontrado" })
    }

    if (!device.sshEnabled) {
      return res.status(400).json({ message: "SSH não está habilitado para este dispositivo" })
    }

    // Executar comando SSH
    const result = await sshService.executeCommand(device, command)

    // Registrar comando na auditoria
    await CommandLog.create({
      userId: req.user.id,
      deviceId: device.id,
      command,
      output: result,
      protocol: "ssh",
      timestamp: new Date(),
    })

    return res.json({ output: result })
  } catch (error) {
    console.error("Erro ao executar comando SSH:", error)
    return res.status(500).json({ message: "Erro interno do servidor", error: error.message })
  }
}

// Buscar histórico de comandos de um dispositivo
exports.getCommandHistory = async (req, res) => {
  try {
    const deviceId = req.params.id
    const device = await Device.findByPk(deviceId)

    if (!device) {
      return res.status(404).json({ message: "Dispositivo não encontrado" })
    }

    const commands = await CommandLog.findAll({
      where: { deviceId },
      order: [["timestamp", "DESC"]],
      limit: 100,
    })

    return res.json(commands)
  } catch (error) {
    console.error("Erro ao buscar histórico de comandos:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

// Buscar estatísticas dos dispositivos
exports.getDeviceStats = async (req, res) => {
  try {
    const totalDevices = await Device.count()
    const onlineDevices = await Device.count({ where: { status: "online" } })
    const offlineDevices = await Device.count({ where: { status: "offline" } })
    const maintenanceDevices = await Device.count({ where: { status: "maintenance" } })

    const devicesByManufacturer = await Device.findAll({
      attributes: ["manufacturer", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
      group: ["manufacturer"],
    })

    return res.json({
      total: totalDevices,
      online: onlineDevices,
      offline: offlineDevices,
      maintenance: maintenanceDevices,
      byManufacturer: devicesByManufacturer,
    })
  } catch (error) {
    console.error("Erro ao buscar estatísticas dos dispositivos:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

