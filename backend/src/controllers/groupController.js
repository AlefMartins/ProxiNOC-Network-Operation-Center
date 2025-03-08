const { Group, User, UserGroup, AuditLog } = require("../models")
const { Op } = require("sequelize")

// Listar todos os grupos
exports.getAllGroups = async (req, res) => {
  try {
    const groups = await Group.findAll({
      include: [{ model: User, attributes: ["id", "username", "fullName"] }],
      order: [["name", "ASC"]],
    })

    // Formatar resposta para incluir contagem de membros
    const formattedGroups = await Promise.all(
      groups.map(async (group) => {
        // Contar membros separadamente
        const memberCount = await UserGroup.count({
          where: { groupId: group.id },
        })

        return {
          ...group.toJSON(),
          members: memberCount,
        }
      }),
    )

    return res.json(formattedGroups)
  } catch (error) {
    console.error("Erro ao buscar grupos:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

// Buscar grupo por ID
exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findByPk(req.params.id, {
      include: [{ model: User, attributes: ["id", "username", "fullName"] }],
    })

    if (!group) {
      return res.status(404).json({ message: "Grupo não encontrado" })
    }

    // Contar membros
    const memberCount = await UserGroup.count({
      where: { groupId: group.id },
    })

    const groupData = {
      ...group.toJSON(),
      members: memberCount,
    }

    return res.json(groupData)
  } catch (error) {
    console.error("Erro ao buscar grupo:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

// Criar novo grupo
exports.createGroup = async (req, res) => {
  try {
    const { name, description, permissions, userIds, groupType } = req.body

    // Verificar se grupo já existe
    const existingGroup = await Group.findOne({ where: { name } })

    if (existingGroup) {
      return res.status(400).json({ message: "Grupo já existe" })
    }

    // Criar grupo
    const group = await Group.create({
      name,
      description,
      permissions,
      groupType: groupType || "sistema",
      isLdapGroup: false,
    })

    // Associar usuários
    if (userIds && userIds.length > 0) {
      const userGroups = userIds.map((userId) => ({
        userId,
        groupId: group.id,
      }))

      await UserGroup.bulkCreate(userGroups)
    }

    // Registrar na auditoria
    await AuditLog.create({
      userId: req.user?.id,
      username: req.user?.username || "sistema",
      action: "create",
      target: "Group",
      details: `Grupo criado: ${name}`,
      ip: req.ip,
      timestamp: new Date(),
    })

    // Buscar grupo com usuários
    const createdGroup = await Group.findByPk(group.id, {
      include: [{ model: User, attributes: ["id", "username", "fullName"] }],
    })

    return res.status(201).json(createdGroup)
  } catch (error) {
    console.error("Erro ao criar grupo:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

// Atualizar grupo
exports.updateGroup = async (req, res) => {
  try {
    const { name, description, permissions, userIds, groupType } = req.body
    const groupId = req.params.id

    const group = await Group.findByPk(groupId)

    if (!group) {
      return res.status(404).json({ message: "Grupo não encontrado" })
    }

    // Preparar dados para atualização
    const updateData = {}

    // Para grupos LDAP, permitir apenas atualização de permissões e tipo de grupo
    if (group.isLdapGroup) {
      // Não permitir alterar nome ou descrição de grupos LDAP
      if (permissions) updateData.permissions = permissions
      if (groupType) updateData.groupType = groupType
    } else {
      // Para grupos locais, permitir atualizar todos os campos
      if (name) updateData.name = name
      if (description) updateData.description = description
      if (permissions) updateData.permissions = permissions
      if (groupType) updateData.groupType = groupType
    }

    await group.update(updateData)

    // Atualizar usuários apenas para grupos locais
    if (!group.isLdapGroup && userIds) {
      // Remover associações existentes
      await UserGroup.destroy({ where: { groupId } })

      // Criar novas associações
      if (userIds.length > 0) {
        const userGroups = userIds.map((userId) => ({
          userId,
          groupId,
        }))

        await UserGroup.bulkCreate(userGroups)
      }
    }

    // Registrar na auditoria
    await AuditLog.create({
      userId: req.user?.id,
      username: req.user?.username || "sistema",
      action: "update",
      target: "Group",
      details: `Grupo atualizado: ${group.name}`,
      ip: req.ip,
      timestamp: new Date(),
    })

    // Buscar grupo atualizado com usuários
    const updatedGroup = await Group.findByPk(groupId, {
      include: [{ model: User, attributes: ["id", "username", "fullName"] }],
    })

    return res.json(updatedGroup)
  } catch (error) {
    console.error("Erro ao atualizar grupo:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

// Excluir grupo
exports.deleteGroup = async (req, res) => {
  try {
    const groupId = req.params.id

    const group = await Group.findByPk(groupId)

    if (!group) {
      return res.status(404).json({ message: "Grupo não encontrado" })
    }

    // Verificar se o grupo tem usuários vinculados
    const userCount = await UserGroup.count({ where: { groupId } })

    if (userCount > 0) {
      return res.status(400).json({
        message: "Não é possível excluir grupo com usuários vinculados. Remova os usuários primeiro.",
        userCount,
      })
    }

    const groupName = group.name

    await group.destroy()

    // Registrar na auditoria
    await AuditLog.create({
      userId: req.user?.id,
      username: req.user?.username || "sistema",
      action: "delete",
      target: "Group",
      details: `Grupo excluído: ${groupName}`,
      ip: req.ip,
      timestamp: new Date(),
    })

    return res.json({ message: "Grupo excluído com sucesso" })
  } catch (error) {
    console.error("Erro ao excluir grupo:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

