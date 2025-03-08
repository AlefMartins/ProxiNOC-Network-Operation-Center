const jwt = require("jsonwebtoken")
const { User, Group, LdapConfig, UserGroup } = require("../models")
const bcrypt = require("bcrypt")
const ldapService = require("../services/ldapService")
const { Op } = require("sequelize")

// Função para gerar token JWT
const generateToken = (user) => {
  return jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "24h" })
}

// Login unificado
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ message: "Usuário e senha são obrigatórios" })
    }

    // Verificar se LDAP está habilitado
    const ldapConfig = await LdapConfig.findOne()
    const ldapEnabled = ldapConfig?.enabled || false

    // Se LDAP estiver habilitado, tentar autenticação LDAP primeiro
    if (ldapEnabled) {
      try {
        // Tentar autenticação LDAP
        const ldapResult = await ldapService.authenticate(username, password)

        if (ldapResult.success && ldapResult.user) {
          // LDAP autenticado com sucesso
          // Buscar ou criar usuário local
          const [user] = await User.findOrCreate({
            where: { username },
            defaults: {
              email: ldapResult.user.email || "",
              fullName: ldapResult.user.fullName || "",
              isLdapUser: true,
              isActive: true,
            },
            include: [{ model: Group }],
          })

          // Atualizar dados do usuário
          if (ldapResult.user.email) user.email = ldapResult.user.email
          if (ldapResult.user.fullName) user.fullName = ldapResult.user.fullName
          user.lastLogin = new Date()
          await user.save()

          // Sincronizar grupos se disponíveis
          if (ldapResult.user.groups?.length > 0) {
            // Buscar IDs dos grupos no sistema
            const ldapGroups = await Group.findAll({
              where: {
                name: { [Op.in]: ldapResult.user.groups },
                isLdapGroup: true,
              },
              attributes: ["id"],
            })

            const groupIds = ldapGroups.map((g) => g.id)

            if (groupIds.length > 0) {
              // Usar o método simplificado para sincronizar grupos localmente
              await ldapService.syncUserGroups(user.id, groupIds)

              // Recarregar usuário para obter grupos atualizados
              await user.reload({ include: [{ model: Group }] })
            }
          }

          // Gerar token
          const token = generateToken(user)

          return res.json({
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              fullName: user.fullName,
              isLdapUser: true,
              groups: user.Groups,
            },
            token,
          })
        }
        // Se LDAP falhar, continuar para autenticação local
      } catch (error) {
        console.error("Erro na autenticação LDAP:", error)
        // Continuar para autenticação local
      }
    }

    // Autenticação local
    const user = await User.findOne({
      where: { username, isActive: true },
      include: [{ model: Group }],
    })

    if (!user) {
      return res.status(401).json({ message: "Usuário não encontrado ou credenciais inválidas" })
    }

    // Se for usuário LDAP e a autenticação LDAP falhou, não tentar autenticação local
    if (user.isLdapUser && ldapEnabled) {
      return res.status(401).json({ message: "Usuário não encontrado ou credenciais inválidas" })
    }

    // Verificar senha para usuários locais
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return res.status(401).json({ message: "Usuário não encontrado ou credenciais inválidas" })
    }

    // Atualizar último login
    user.lastLogin = new Date()
    await user.save()

    // Gerar token
    const token = generateToken(user)

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        isLdapUser: user.isLdapUser,
        groups: user.Groups,
      },
      token,
    })
  } catch (error) {
    console.error("Erro no login:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

// Verificar token
exports.verifyToken = async (req, res) => {
  try {
    // O middleware de autenticação já verificou o token
    return res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        fullName: req.user.fullName,
        isLdapUser: req.user.isLdapUser,
        groups: req.user.Groups,
      },
    })
  } catch (error) {
    console.error("Erro na verificação do token:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

// Logout
exports.logout = async (req, res) => {
  try {
    return res.json({ message: "Logout realizado com sucesso" })
  } catch (error) {
    console.error("Erro no logout:", error)
    return res.status(500).json({ message: "Erro interno do servidor" })
  }
}

