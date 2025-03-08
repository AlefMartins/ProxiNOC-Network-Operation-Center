const bcrypt = require("bcrypt")
const { User } = require("../models")
const ldapService = require("./ldapService")
const sequelize = require("../config/sequelize")

/**
 * Serviço para gerenciamento de senhas
 */
const passwordService = {
  /**
   * Altera a senha do usuário logado
   * @param {number} userId - ID do usuário
   * @param {string} newPassword - Nova senha
   * @returns {Promise<Object>} Resultado da operação
   */
  async changePassword(userId, newPassword) {
    try {
      // Buscar usuário
      const user = await User.findByPk(userId)

      if (!user) {
        return {
          success: false,
          message: "Usuário não encontrado",
        }
      }

      console.log(`Alterando senha para usuário ${user.username} (LDAP: ${user.isLdapUser})`)

      // Verificar se é usuário LDAP
      if (user.isLdapUser) {
        console.log(`Usuário ${user.username} é LDAP, alterando senha no LDAP...`)

        // Alterar senha no LDAP
        const ldapResult = await ldapService.changePasswordLoggedUser(user.username, newPassword)

        if (!ldapResult.success) {
          console.error(`Erro ao alterar senha no LDAP para ${user.username}: ${ldapResult.message}`)
          return ldapResult
        }

        console.log(`Senha alterada com sucesso no LDAP para ${user.username}`)
        return ldapResult
      }

      // Se não for LDAP, alterar senha localmente
      console.log(`Alterando senha local para ${user.username}`)

      try {
        // Gerar hash da senha usando bcrypt
        console.log(`Gerando hash da senha para ${user.username}`)
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        console.log(`Hash gerado: ${hashedPassword.substring(0, 20)}...`)

        // Atualizar diretamente no banco de dados usando uma query SQL
        console.log(`Atualizando senha no banco de dados para ${user.username}`)
        await sequelize.query(`UPDATE Users SET password = ? WHERE id = ?`, {
          replacements: [hashedPassword, userId],
          type: sequelize.QueryTypes.UPDATE,
        })

        // Verificar se a senha foi atualizada corretamente
        const updatedUser = await User.findByPk(userId)
        console.log(`Senha atualizada: ${updatedUser.password.substring(0, 20)}...`)

        // Verificar se a nova senha funciona
        console.log(`Verificando se a nova senha funciona para ${user.username}`)
        const passwordMatch = await bcrypt.compare(newPassword, updatedUser.password)
        console.log(`Resultado da verificação: ${passwordMatch}`)

        if (!passwordMatch) {
          console.error(`ERRO: A nova senha não funciona para ${user.username}!`)

          // Tentar uma abordagem alternativa
          console.log(`Tentando abordagem alternativa para ${user.username}...`)
          const alternativeHash = await bcrypt.hash(newPassword, 10)

          // Verificar se o hash alternativo funciona
          const alternativeMatch = await bcrypt.compare(newPassword, alternativeHash)

          if (!alternativeMatch) {
            console.error(`ERRO: Problema com a biblioteca bcrypt!`)
            return {
              success: false,
              message: "Erro ao verificar a nova senha",
            }
          }

          // Usar o hash alternativo
          console.log(`Usando hash alternativo para ${user.username}`)
          await sequelize.query(`UPDATE Users SET password = ? WHERE id = ?`, {
            replacements: [alternativeHash, userId],
            type: sequelize.QueryTypes.UPDATE,
          })

          console.log(`Senha atualizada com hash alternativo para ${user.username}`)
        }

        console.log(`Senha alterada com sucesso para ${user.username}`)
        return {
          success: true,
          message: "Senha alterada com sucesso",
        }
      } catch (bcryptError) {
        console.error(`Erro ao processar bcrypt: ${bcryptError.message}`)
        return {
          success: false,
          message: `Erro ao processar bcrypt: ${bcryptError.message}`,
        }
      }
    } catch (error) {
      console.error("Erro ao alterar senha:", error)
      return {
        success: false,
        message: "Erro ao alterar senha",
      }
    }
  },

  /**
   * Altera a senha de outro usuário (admin)
   * @param {number} userId - ID do usuário
   * @param {string} newPassword - Nova senha
   * @param {Object} adminUser - Usuário administrador
   * @returns {Promise<Object>} Resultado da operação
   */
  async changeUserPassword(userId, newPassword, adminUser) {
    try {
      // Buscar usuário
      const user = await User.findByPk(userId)

      if (!user) {
        return {
          success: false,
          message: "Usuário não encontrado",
        }
      }

      console.log(
        `Admin ${adminUser.username} alterando senha para usuário ${user.username} (LDAP: ${user.isLdapUser})`,
      )

      // Verificar se é usuário LDAP
      if (user.isLdapUser) {
        console.log(`Usuário ${user.username} é LDAP, alterando senha no LDAP...`)

        // Alterar senha no LDAP
        const ldapResult = await ldapService.resetPassword(user.username, newPassword)

        if (!ldapResult.success) {
          console.error(`Erro ao alterar senha no LDAP para ${user.username}: ${ldapResult.message}`)
          return ldapResult
        }

        console.log(`Senha alterada com sucesso no LDAP para ${user.username}`)
        return ldapResult
      }

      // Se não for LDAP, alterar senha localmente
      console.log(`Alterando senha local para ${user.username}`)

      try {
        // Gerar hash da senha usando bcrypt
        console.log(`Gerando hash da senha para ${user.username}`)
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        console.log(`Hash gerado: ${hashedPassword.substring(0, 20)}...`)

        // Atualizar diretamente no banco de dados usando uma query SQL
        console.log(`Atualizando senha no banco de dados para ${user.username}`)
        await sequelize.query(`UPDATE Users SET password = ? WHERE id = ?`, {
          replacements: [hashedPassword, userId],
          type: sequelize.QueryTypes.UPDATE,
        })

        // Verificar se a senha foi atualizada corretamente
        const updatedUser = await User.findByPk(userId)
        console.log(`Senha atualizada: ${updatedUser.password.substring(0, 20)}...`)

        console.log(`Senha alterada com sucesso para ${user.username}`)
        return {
          success: true,
          message: "Senha alterada com sucesso",
        }
      } catch (bcryptError) {
        console.error(`Erro ao processar bcrypt: ${bcryptError.message}`)
        return {
          success: false,
          message: `Erro ao processar bcrypt: ${bcryptError.message}`,
        }
      }
    } catch (error) {
      console.error("Erro ao alterar senha:", error)
      return {
        success: false,
        message: "Erro ao alterar senha",
      }
    }
  },

  /**
   * Reseta a senha de um usuário (admin)
   * @param {number} userId - ID do usuário
   * @param {string} newPassword - Nova senha
   * @param {Object} adminUser - Usuário administrador
   * @returns {Promise<Object>} Resultado da operação
   */
  async resetUserPassword(userId, newPassword, adminUser) {
    // Implementação similar ao changeUserPassword
    return this.changeUserPassword(userId, newPassword, adminUser)
  },

  /**
   * Valida a complexidade da senha
   * @param {string} password - Senha a ser validada
   * @returns {Object} Resultado da validação
   */
  validatePasswordComplexity(password) {
    // Verificar tamanho mínimo
    if (password.length < 8) {
      return {
        valid: false,
        message: "A senha deve ter pelo menos 8 caracteres",
      }
    }

    // Verificar se contém pelo menos um número
    if (!/\d/.test(password)) {
      return {
        valid: false,
        message: "A senha deve conter pelo menos um número",
      }
    }

    // Verificar se contém pelo menos uma letra maiúscula
    if (!/[A-Z]/.test(password)) {
      return {
        valid: false,
        message: "A senha deve conter pelo menos uma letra maiúscula",
      }
    }

    // Verificar se contém pelo menos uma letra minúscula
    if (!/[a-z]/.test(password)) {
      return {
        valid: false,
        message: "A senha deve conter pelo menos uma letra minúscula",
      }
    }

    // Verificar se contém pelo menos um caractere especial
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      return {
        valid: false,
        message: "A senha deve conter pelo menos um caractere especial",
      }
    }

    return {
      valid: true,
      message: "Senha válida",
    }
  },
}

module.exports = passwordService

