const { LdapConfig, User, Group, UserGroup, AuditLog } = require("../models")
const ldapService = require("../services/ldapService")

// Verificar se LDAP está habilitado
exports.isLdapEnabled = async (req, res) => {
  try {
    const config = await LdapConfig.findOne()
    return res.json({ enabled: config?.enabled || false })
  } catch (error) {
    console.error("Erro ao verificar status LDAP:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

// Obter configuração LDAP
exports.getLdapConfig = async (req, res) => {
  try {
    let config = await LdapConfig.findOne()

    if (!config) {
      config = await LdapConfig.create({
        enabled: false,
        server: "",
        port: 389,
        baseDn: "",
        bindUser: "",
        bindPassword: "",
        userFilter: "(&(objectClass=person)(sAMAccountName=*))",
        userLoginAttribute: "sAMAccountName",
        userNameAttribute: "displayName",
        userEmailAttribute: "mail",
        groupFilter: "(&(objectClass=group)(cn=*))",
        groupNameAttribute: "cn",
        groupMemberAttribute: "member",
        groupDescriptionAttribute: "description",
        syncInterval: 60,
        sslEnabled: false,
      })
    }

    // Não retornar a senha
    const configData = config.toJSON()
    delete configData.bindPassword

    return res.json(configData)
  } catch (error) {
    console.error("Erro ao buscar configuração LDAP:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

// Testar conexão LDAP
exports.testLdapConnection = async (req, res) => {
  try {
    const config = await LdapConfig.findOne()

    if (!config) {
      return res.status(400).json({
        success: false,
        message: "Configuração LDAP não encontrada",
      })
    }

    const result = await ldapService.testConnection(config)

    // Registrar na auditoria
    await AuditLog.create({
      userId: req.user.id,
      username: req.user.username,
      action: "test",
      target: "LDAP Connection",
      details: result.success
        ? "Teste de conexão LDAP bem-sucedido"
        : `Teste de conexão LDAP falhou: ${result.message}`,
      ip: req.ip,
      timestamp: new Date(),
    })

    return res.json(result)
  } catch (error) {
    console.error("Erro ao testar conexão LDAP:", error)
    return res.status(500).json({
      success: false,
      message: `Erro ao testar conexão: ${error.message || "Erro interno do servidor"}`,
    })
  }
}

// Atualizar configuração LDAP
exports.updateLdapConfig = async (req, res) => {
  try {
    let config = await LdapConfig.findOne()

    if (!config) {
      config = await LdapConfig.create(req.body)
    } else {
      // Se a senha não foi enviada, manter a atual
      if (!req.body.bindPassword) {
        delete req.body.bindPassword
      }

      await config.update(req.body)
    }

    // Registrar na auditoria
    await AuditLog.create({
      userId: req.user.id,
      username: req.user.username,
      action: "update",
      target: "LDAP Config",
      details: "Configuração LDAP atualizada",
      ip: req.ip,
      timestamp: new Date(),
    })

    // Não retornar a senha
    const configData = config.toJSON()
    delete configData.bindPassword

    return res.json(configData)
  } catch (error) {
    console.error("Erro ao atualizar configuração LDAP:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

// Sincronizar usuários LDAP
exports.syncLdapUsers = async (req, res) => {
  try {
    const result = await ldapService.syncUsers()

    // Atualizar data da última sincronização
    const config = await LdapConfig.findOne()
    if (config) {
      config.lastSync = new Date()
      await config.save()
    }

    // Registrar na auditoria se a requisição veio de um usuário
    if (req.user) {
      await AuditLog.create({
        userId: req.user.id,
        username: req.user.username,
        action: "sync",
        target: "LDAP Users",
        details: `Sincronização de usuários LDAP: ${result.added} adicionados, ${result.updated} atualizados, ${result.groups} grupos sincronizados`,
        ip: req.ip,
        timestamp: new Date(),
      })
    }

    return res.json(result)
  } catch (error) {
    console.error("Erro ao sincronizar usuários LDAP:", error)
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error.message,
    })
  }
}

// Listar usuários LDAP
exports.getLdapUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { isLdapUser: true },
      include: [{ model: Group }],
      order: [["username", "ASC"]],
    })

    return res.json(users)
  } catch (error) {
    console.error("Erro ao buscar usuários LDAP:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

// Listar grupos LDAP
exports.getLdapGroups = async (req, res) => {
  try {
    const groups = await Group.findAll({
      where: { isLdapGroup: true },
      include: [{ model: User }],
      order: [["name", "ASC"]],
    })

    // Formatar resposta para incluir contagem de membros
    const formattedGroups = groups.map((group) => {
      // Garantir que permissions seja um objeto, não uma string
      let permissions = group.permissions
      if (typeof permissions === "string") {
        try {
          permissions = JSON.parse(permissions)
        } catch (e) {
          console.error(`Erro ao analisar permissões para o grupo ${group.name}:`, e)
          permissions = {
            dashboard: ["view"],
            devices: ["view"],
            audit: ["view"],
          }
        }
      }

      return {
        id: group.id,
        name: group.name,
        description: group.description,
        isLdapGroup: group.isLdapGroup,
        groupType: group.groupType || "system",
        permissions: permissions,
        members: group.Users.length,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      }
    })

    return res.json(formattedGroups)
  } catch (error) {
    console.error("Erro ao buscar grupos LDAP:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

// Buscar usuários disponíveis no LDAP para importação
exports.getAvailableLdapUsers = async (req, res) => {
  try {
    const result = await ldapService.getAvailableUsers()
    return res.json(result)
  } catch (error) {
    console.error("Erro ao buscar usuários disponíveis no LDAP:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

// Buscar grupos disponíveis no LDAP para importação
exports.getAvailableLdapGroups = async (req, res) => {
  try {
    const result = await ldapService.getAvailableGroups()

    console.log("Resultado da busca de grupos:", result)

    // Verificar se o resultado é um array ou um objeto com mensagem de erro
    if (Array.isArray(result)) {
      // Se for um array, retornar diretamente
      console.log(`Retornando ${result.length} grupos para o frontend`)
      return res.json(result)
    } else if (result && result.success === false) {
      // Se for um objeto de erro, retornar o erro
      console.log("Retornando erro para o frontend:", result.message)
      return res.status(400).json(result)
    } else {
      // Caso contrário, retornar um array vazio
      console.log("Retornando array vazio para o frontend")
      return res.json([])
    }
  } catch (error) {
    console.error("Erro ao buscar grupos disponíveis no LDAP:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

// Importar usuários selecionados do LDAP
exports.importLdapUsers = async (req, res) => {
  try {
    const { usernames, userGroups } = req.body

    if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
      return res.status(400).json({ message: "Lista de usuários inválida" })
    }

    const result = await ldapService.importUsers(usernames, userGroups)

    // Se houver erros mas alguns usuários foram importados com sucesso
    if (result.errors && result.errors.length > 0) {
      // Log detalhado dos erros
      console.log("Erros durante a importação:", result.errors)

      // Retornar mensagem com detalhes dos erros
      return res.json({
        success: result.imported > 0,
        imported: result.imported,
        errors: result.errors,
        message: `Importação parcial: ${result.imported} usuários importados, ${result.errors.length} erros encontrados`,
      })
    }

    // Registrar na auditoria
    await AuditLog.create({
      userId: req.user.id,
      username: req.user.username,
      action: "import",
      target: "LDAP Users",
      details: `Importação de usuários LDAP: ${result.imported} importados`,
      ip: req.ip,
      timestamp: new Date(),
    })

    console.log(`Importação de usuários LDAP concluída. Total importado: ${result.imported}`)
    return res.json(result)
  } catch (error) {
    console.error("Erro ao importar usuários LDAP:", error)
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error.message,
    })
  }
}

// Importar grupos selecionados do LDAP
exports.importLdapGroups = async (req, res) => {
  try {
    const { groupNames, groupTypes } = req.body

    if (!groupNames || !Array.isArray(groupNames) || groupNames.length === 0) {
      return res.status(400).json({ message: "Lista de grupos inválida" })
    }

    const result = await ldapService.importGroups(groupNames, groupTypes)

    // Registrar na auditoria
    await AuditLog.create({
      userId: req.user.id,
      username: req.user.username,
      action: "import",
      target: "LDAP Groups",
      details: `Importação de grupos LDAP: ${result.imported} importados`,
      ip: req.ip,
      timestamp: new Date(),
    })

    return res.json(result)
  } catch (error) {
    console.error("Erro ao importar grupos LDAP:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

// Alterar senha de usuário LDAP
exports.changeLdapPassword = async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body

    if (!username || !oldPassword || !newPassword) {
      return res.status(400).json({ message: "Todos os campos são obrigatórios" })
    }

    // Implementação simulada
    return res.json({
      success: true,
      message: "Senha alterada com sucesso",
    })
  } catch (error) {
    console.error("Erro ao alterar senha LDAP:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

