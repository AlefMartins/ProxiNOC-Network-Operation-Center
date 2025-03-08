const nodemailer = require("nodemailer")
const { EmailConfig } = require("../models")

// Obter configuração de email
exports.getEmailConfig = async () => {
  try {
    const config = await EmailConfig.findOne()

    if (!config) {
      return null
    }

    // Não retornar a senha
    const configData = config.toJSON()
    delete configData.password

    return configData
  } catch (error) {
    console.error("Erro ao obter configuração de email:", error)
    throw error
  }
}

// Atualizar configuração de email
exports.updateEmailConfig = async (configData) => {
  try {
    let config = await EmailConfig.findOne()

    if (config) {
      // Se a senha não for fornecida, manter a atual
      if (!configData.password) {
        delete configData.password
      }

      await config.update(configData)
    } else {
      config = await EmailConfig.create(configData)
    }

    // Não retornar a senha
    const updatedConfig = config.toJSON()
    delete updatedConfig.password

    return updatedConfig
  } catch (error) {
    console.error("Erro ao atualizar configuração de email:", error)
    throw error
  }
}

// Criar transporter do Nodemailer
const createTransporter = async (configData) => {
  try {
    // Se foram fornecidos dados de configuração, usar eles
    if (configData && Object.keys(configData).length > 0) {
      return nodemailer.createTransport({
        host: configData.host,
        port: Number.parseInt(configData.port),
        secure: configData.secure,
        auth: {
          user: configData.username,
          pass: configData.password,
        },
      })
    }

    // Caso contrário, buscar do banco de dados
    const config = await EmailConfig.findOne()

    if (!config) {
      throw new Error("Configuração de email não encontrada")
    }

    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.username,
        pass: config.password,
      },
    })
  } catch (error) {
    console.error("Erro ao criar transporter:", error)
    throw error
  }
}

// Testar configuração de email
exports.testEmail = async (configData) => {
  try {
    let transporter

    // Se foram fornecidos dados de configuração, usar eles para o teste
    if (configData && Object.keys(configData).length > 0) {
      transporter = nodemailer.createTransport({
        host: configData.host,
        port: Number.parseInt(configData.port),
        secure: configData.secure,
        auth: {
          user: configData.username,
          pass: configData.password,
        },
      })
    } else {
      // Caso contrário, usar as configurações salvas
      transporter = await createTransporter()
    }

    // Verificar conexão com o servidor
    await transporter.verify()

    // Enviar email de teste
    const config = configData || (await EmailConfig.findOne())

    if (!config) {
      throw new Error("Configuração de email não encontrada")
    }

    const testMailOptions = {
      from: `"${config.fromName || "ProxiNOC-GDR"}" <${config.fromEmail}>`,
      to: config.fromEmail, // Enviar para o próprio email de origem
      subject: "ProxiNOC-GDR - Teste de Configuração SMTP",
      text: `
        Este é um email de teste enviado pelo sistema ProxiNOC-GDR.
        
        Horário do envio: ${new Date().toLocaleString()}
        
        Se você recebeu este email, a configuração SMTP está funcionando corretamente.
        
        Não é necessário responder este email.
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #1976d2;">ProxiNOC-GDR - Teste de Configuração SMTP</h2>
          <p>Este é um email de teste enviado pelo sistema ProxiNOC-GDR.</p>
          <p><strong>Horário do envio:</strong> ${new Date().toLocaleString()}</p>
          <p>Se você recebeu este email, a configuração SMTP está funcionando corretamente.</p>
          <p style="color: #666; font-size: 0.9em;">Não é necessário responder este email.</p>
        </div>
      `,
    }

    const info = await transporter.sendMail(testMailOptions)

    return {
      success: true,
      message: "Email de teste enviado com sucesso",
      messageId: info.messageId,
    }
  } catch (error) {
    console.error("Erro ao testar email:", error)
    return {
      success: false,
      message: `Erro ao testar email: ${error.message}`,
    }
  }
}

// Enviar email
exports.sendEmail = async (options) => {
  try {
    const transporter = await createTransporter()

    const config = await EmailConfig.findOne()

    if (!config) {
      throw new Error("Configuração de email não encontrada")
    }

    const mailOptions = {
      from: `"${config.fromName || "ProxiNOC-GDR"}" <${config.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
    }

    if (options.html) {
      mailOptions.html = options.html
    }

    const info = await transporter.sendMail(mailOptions)

    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error) {
    console.error("Erro ao enviar email:", error)
    throw error
  }
}

