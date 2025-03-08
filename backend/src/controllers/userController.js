const { User, Group, UserGroup, AuditLog } = require("../models")
const bcrypt = require("bcrypt")
const { Op } = require("sequelize")
const ldapService = require("../services/ldapService")

// Listar todos os usuários
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{ model: Group }],
      order: [["username", "ASC"]],
    })

    // Não retornar senhas e garantir que todos os usuários tenham a propriedade groups
    const formattedUsers = users.map((user) => {
      const userData = user.toJSON()
      delete userData.password
      // Garantir que groups sempre exista
      userData.groups = userData.Groups || []
      delete userData.Groups // Remover a propriedade Groups original
      return userData
    })

    return res.json(formattedUsers)
  } catch (error) {
    console.error("Erro ao buscar usuários:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

// Buscar usuário por ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [{ model: Group }],
    })

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" })
    }

    // Não retornar senha
    const userData = user.toJSON()
    delete userData.password

    return res.json(userData)
  } catch (error) {
    console.error("Erro ao buscar usuário:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

// Criar novo usuário
exports.createUser = async (req, res) => {
  try {
    const { username, password, email, fullName, isActive, groupIds } = req.body

    // Verificar se usuário já existe
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }],
      },
    })

    if (existingUser) {
      return res.status(400).json({ message: "Usuário ou email já existe" })
    }

    // Criar usuário
    const user = await User.create({
      username,
      password,
      email,
      fullName,
      isLdapUser: false,
      isActive: isActive !== undefined ? isActive : true,
    })

    // Associar grupos
    if (groupIds && Array.isArray(groupIds) && groupIds.length > 0) {
      // Filtrar apenas grupos não-LDAP para usuários locais
      const validGroups = await Group.findAll({
        where: {
          id: { [Op.in]: groupIds },
          isLdapGroup: false, // Apenas grupos locais para usuários locais
        },
        attributes: ["id"],
      })

      const validGroupIds = validGroups.map((g) => g.id)

      if (validGroupIds.length > 0) {
        // Criar associações manualmente em vez de usar setGroups
        const userGroups = validGroupIds.map((groupId) => ({
          userId: user.id,
          groupId: Number.parseInt(groupId),
        }))

        await UserGroup.bulkCreate(userGroups)
      }
    }

    // Registrar na auditoria
    await AuditLog.create({
      userId: req.user.id,
      username: req.user.username,
      action: "create",
      target: "User",
      details: `Usuário criado: ${username}`,
      ip: req.ip,
      timestamp: new Date(),
    })

    // Buscar usuário com grupos
    const createdUser = await User.findByPk(user.id, {
      include: [{ model: Group }],
    })

    // Não retornar senha
    const userData = createdUser.toJSON()
    delete userData.password

    return res.status(201).json(userData)
  } catch (error) {
    console.error("Erro ao criar usuário:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

// Atualizar usuário
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id
    const { email, fullName, isActive, groupIds } = req.body

    // Buscar o usuário
    const user = await User.findByPk(userId)
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" })
    }

    // Atualizar dados básicos do usuário
    if (email) user.email = email
    if (fullName) user.fullName = fullName
    if (typeof isActive === "boolean") user.isActive = isActive

    await user.save()

    // Se houver grupos para atualizar
    if (Array.isArray(groupIds)) {
      try {
        // Se for usuário LDAP, usar o serviço LDAP para sincronizar grupos
        if (user.isLdapUser) {
          console.log(
            `Sincronizando grupos para usuário LDAP ${user.username} (ID: ${user.id}), grupos: ${groupIds.join(", ")}`,
          )

          // Sincronizar com o AD
          const syncResult = await ldapService.syncUserGroups(user.username, groupIds)
          if (!syncResult.success) {
            console.error(`Erro ao sincronizar grupos com AD: ${syncResult.message}`)
            return res.status(400).json({
              message: `Erro ao sincronizar grupos com AD: ${syncResult.message}`,
            })
          }

          // Mesmo que a sincronização com o AD tenha sido bem-sucedida,
          // precisamos atualizar o banco de dados local também
          console.log(`Atualizando grupos no banco de dados local para o usuário ${user.id}`)

          // Remover associações existentes
          await UserGroup.destroy({ where: { userId: user.id } })

          // Criar novas associações
          if (groupIds.length > 0) {
            const userGroupEntries = groupIds.map((groupId) => ({
              userId: user.id,
              groupId,
            }))

            await UserGroup.bulkCreate(userGroupEntries)
            console.log(`${userGroupEntries.length} grupos associados ao usuário ${user.id} no banco local`)
          }
        } else {
          // Para usuários locais, atualizar apenas no banco local
          console.log(`Atualizando grupos para usuário local ${user.username} (ID: ${user.id})`)

          await UserGroup.destroy({ where: { userId: user.id } })

          if (groupIds.length > 0) {
            await UserGroup.bulkCreate(
              groupIds.map((groupId) => ({
                userId: user.id,
                groupId,
              })),
            )
            console.log(`${groupIds.length} grupos associados ao usuário ${user.id}`)
          }
        }
      } catch (error) {
        console.error("Erro ao atualizar grupos:", error)
        return res.status(400).json({
          message: `Erro ao atualizar grupos: ${error.message}`,
        })
      }
    }

    // Recarregar usuário com grupos atualizados
    const updatedUser = await User.findByPk(userId, {
      include: [{ model: Group }],
    })

    return res.json(updatedUser)
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

// Atualizar grupos de um usuário
exports.updateUserGroups = async (req, res) => {
  try {
    const userId = req.params.id
    const { groupIds } = req.body

    if (!Array.isArray(groupIds)) {
      return res.status(400).json({ message: "groupIds deve ser um array" })
    }

    // Buscar o usuário
    const user = await User.findByPk(userId)
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" })
    }

    // Verificar se os grupos existem
    const validGroups = await Group.findAll({
      where: { id: { [Op.in]: groupIds } },
    })

    const validGroupIds = validGroups.map((g) => g.id)

    // Obter grupos atuais do usuário
    const currentUserGroups = await UserGroup.findAll({
      where: { userId },
      include: [{ model: Group }],
    })

    const currentGroupIds = currentUserGroups.map((ug) => ug.groupId)

    if (user.isLdapUser) {
      // Para usuários LDAP, permitir associação a qualquer grupo
      // Mas sincronizar apenas os grupos LDAP com o servidor AD

      // Separar grupos LDAP e locais
      const ldapGroups = validGroups.filter((g) => g.isLdapGroup)
      const localGroups = validGroups.filter((g) => !g.isLdapGroup)

      const ldapGroupIds = ldapGroups.map((g) => g.id)
      const localGroupIds = localGroups.map((g) => g.id)

      // Identificar quais grupos LDAP foram adicionados ou removidos
      const currentLdapGroups = currentUserGroups.filter((ug) => ug.Group && ug.Group.isLdapGroup).map((ug) => ug.Group)

      const currentLdapGroupIds = currentLdapGroups.map((g) => g.id)

      // Sincronizar grupos LDAP com o servidor AD
      if (ldapGroupIds.length > 0 || currentLdapGroupIds.length > 0) {
        try {
          // Sincronizar grupos LDAP com o AD
          const syncResult = await ldapService.syncUserGroups(user.username, ldapGroupIds)

          if (!syncResult.success) {
            console.error(`Erro ao sincronizar grupos LDAP: ${syncResult.message}`)
            // Continuar mesmo com erro na sincronização AD
          } else {
            console.log(`Grupos LDAP sincronizados com sucesso: ${syncResult.message}`)
          }
        } catch (syncError) {
          console.error("Erro ao sincronizar grupos com AD:", syncError)
          // Continuar mesmo com erro na sincronização AD
        }
      }

      // Atualizar associações no banco de dados local
      await UserGroup.destroy({ where: { userId } })

      if (validGroupIds.length > 0) {
        const userGroupEntries = validGroupIds.map((groupId) => ({
          userId,
          groupId,
        }))

        await UserGroup.bulkCreate(userGroupEntries)
      }

      return res.json({
        success: true,
        message: `Grupos atualizados: ${ldapGroups.length} grupos LDAP e ${localGroups.length} grupos locais associados`,
      })
    } else {
      // Para usuários locais, permitir associação apenas a grupos locais
      const localGroups = validGroups.filter((g) => !g.isLdapGroup)
      const localGroupIds = localGroups.map((g) => g.id)

      // Verificar se há tentativa de associar a grupos LDAP
      const ldapGroups = validGroups.filter((g) => g.isLdapGroup)
      if (ldapGroups.length > 0) {
        console.warn(`Tentativa de associar usuário local a grupos LDAP: ${ldapGroups.map((g) => g.name).join(", ")}`)
        // Ignorar grupos LDAP para usuários locais
      }

      // Atualizar associações apenas com grupos locais
      await UserGroup.destroy({ where: { userId } })

      if (localGroupIds.length > 0) {
        const userGroupEntries = localGroupIds.map((groupId) => ({
          userId,
          groupId,
        }))

        await UserGroup.bulkCreate(userGroupEntries)
      }

      return res.json({
        success: true,
        message: `Grupos atualizados: ${localGroupIds.length} grupos locais associados`,
      })
    }
  } catch (error) {
    console.error("Erro ao atualizar grupos do usuário:", error)
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    })
  }
}

// Obter grupos disponíveis para um usuário
exports.getAvailableGroups = async (req, res) => {
  try {
    const userId = req.params.id

    // Buscar o usuário
    const user = await User.findByPk(userId)
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" })
    }

    // Buscar todos os grupos
    let groups

    if (user.isLdapUser) {
      // Usuários LDAP podem ver todos os grupos
      groups = await Group.findAll({
        attributes: ["id", "name", "description", "isLdapGroup", "groupType"],
        order: [["name", "ASC"]],
      })
    } else {
      // Usuários locais só podem ver grupos locais
      groups = await Group.findAll({
        where: { isLdapGroup: false },
        attributes: ["id", "name", "description", "isLdapGroup", "groupType"],
        order: [["name", "ASC"]],
      })
    }

    return res.json(groups)
  } catch (error) {
    console.error("Erro ao buscar grupos disponíveis:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

// Excluir usuário
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id

    const user = await User.findByPk(userId)

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" })
    }

    // Não permitir excluir o próprio usuário
    if (user.id === req.user.id) {
      return res.status(400).json({ message: "Não é possível excluir o próprio usuário" })
    }

    const username = user.username

    await user.destroy()

    // Registrar na auditoria
    await AuditLog.create({
      userId: req.user.id,
      username: req.user.username,
      action: "delete",
      target: "User",
      details: `Usuário excluído: ${username}`,
      ip: req.ip,
      timestamp: new Date(),
    })

    return res.json({ message: "Usuário excluído com sucesso" })
  } catch (error) {
    console.error("Erro ao excluir usuário:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

// Alterar senha
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const userId = req.params.id

    // Verificar se é o próprio usuário ou um administrador
    if (userId != req.user.id) {
      // Verificar se o usuário tem permissão de administrador
      const isAdmin = req.user.Groups.some((g) => g.name === "Administradores")

      if (!isAdmin) {
        return res.status(403).json({ message: "Sem permissão para alterar senha de outro usuário" })
      }
    }

    const user = await User.findByPk(userId)

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" })
    }

    // Verificar se é usuário LDAP
    if (user.isLdapUser) {
      return res.status(400).json({ message: "Não é possível alterar senha de usuário LDAP" })
    }

    // Se for o próprio usuário, verificar senha atual
    if (userId == req.user.id) {
      const isValid = await user.validatePassword(currentPassword)

      if (!isValid) {
        return res.status(400).json({ message: "Senha atual incorreta" })
      }
    }

    // Atualizar senha
    user.password = newPassword
    await user.save()

    // Registrar na auditoria
    await AuditLog.create({
      userId: req.user.id,
      username: req.user.username,
      action: "password_change",
      target: user.username,
      details: "Senha alterada",
      ip: req.ip,
      timestamp: new Date(),
    })

    return res.json({ message: "Senha alterada com sucesso" })
  } catch (error) {
    console.error("Erro ao alterar senha:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

