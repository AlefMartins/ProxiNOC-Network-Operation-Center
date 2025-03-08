const { NodeSSH } = require("node-ssh")
const { AuditLog } = require("../models")

/**
 * Executa um comando SSH em um dispositivo
 * @param {Object} device - Objeto do dispositivo
 * @param {string} command - Comando a ser executado
 * @param {Object} user - Objeto do usuário (opcional)
 * @returns {Promise<string>} - Saída do comando
 */
exports.executeCommand = async (device, command, user = null) => {
  const ssh = new NodeSSH()

  try {
    // Obter credenciais do dispositivo (em um sistema real, isso seria armazenado de forma segura)
    // Aqui estamos usando credenciais de exemplo
    const username = "admin"
    const password = "password"

    // Conectar ao dispositivo
    await ssh.connect({
      host: device.ip,
      port: device.port,
      username,
      password,
      // Em um ambiente de produção, você pode querer usar chaves SSH
      // privateKey: '/path/to/private/key'
    })

    // Executar comando
    const result = await ssh.execCommand(command)

    // Registrar na auditoria se o usuário for fornecido
    if (user) {
      await AuditLog.create({
        userId: user.id,
        username: user.username,
        action: "command",
        target: device.name,
        details: `Comando SSH: ${command}`,
        ip: device.ip,
        timestamp: new Date(),
      })
    }

    // Fechar conexão
    ssh.dispose()

    if (result.code !== 0) {
      throw new Error(`Erro ao executar comando: ${result.stderr}`)
    }

    return result.stdout || "Comando executado com sucesso (sem saída)"
  } catch (error) {
    // Fechar conexão em caso de erro
    ssh.dispose()

    console.error(`Erro ao executar comando SSH em ${device.name}:`, error)
    throw error
  }
}

/**
 * Estabelece uma sessão SSH interativa com um dispositivo
 * Esta é uma implementação simplificada para demonstração
 * Em um ambiente real, você usaria WebSockets para comunicação em tempo real
 * @param {Object} device - Objeto do dispositivo
 * @returns {Promise<Object>} - Informações da sessão
 */
exports.startSession = async (device) => {
  try {
    // Em um sistema real, você estabeleceria uma sessão SSH interativa
    // e retornaria um identificador de sessão para o cliente

    return {
      sessionId: `session_${Date.now()}`,
      device: {
        id: device.id,
        name: device.name,
        ip: device.ip,
      },
      startTime: new Date(),
    }
  } catch (error) {
    console.error(`Erro ao iniciar sessão SSH com ${device.name}:`, error)
    throw error
  }
}

