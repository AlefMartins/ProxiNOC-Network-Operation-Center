const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const { User, Group } = require("../models")
const ldapService = require("./ldapService") // Restaurando a importação do ldapService

/**
 * Serviço de autenticação
 */
const authService = {
  /**
   * Realiza o login do usuário
   * @param {string} username - Nome de usuário
   * @param {string} password - Senha
   * @returns {Promise<Object>} Resultado do login
   */
  async login(username, password) {
    try {
      console.log(`Tentativa de login para usuário: ${username}`)

      // Primeiro, verificar se o usuário existe no banco local
      const user = await User.findOne({
        where: { username },
        include: [
          {
            model: Group,
            through: { attributes: [] },
          },
        ],
      })

      if (!user) {
        console.log(`Usuário ${username} não encontrado no banco local`)
        return {
          success: false,
          message: "Credenciais inválidas",
        }
      }

      console.log(`Usuário ${username} encontrado. isLdapUser: ${user.isLdapUser}`)
      console.log(`Senha armazenada: ${user.password.substring(0, 20)}...`)

      let authSuccess = false

      // Verificar se é usuário LDAP
      if (user.isLdapUser) {
        console.log(`Autenticando ${username} no LDAP...`)

        // Autenticar no LDAP
        const ldapResult = await ldapService.authenticate(username, password)
        authSuccess = ldapResult.success

        console.log(`Resultado da autenticação LDAP para ${username}: ${authSuccess ? "Sucesso" : "Falha"}`)
      } else {
        // Autenticar localmente
        console.log(`Autenticando ${username} localmente...`)

        // Verificar senha usando bcrypt
        authSuccess = await bcrypt.compare(password, user.password)

        console.log(`Resultado da autenticação local para ${username}: ${authSuccess ? "Sucesso" : "Falha"}`)
      }

      if (!authSuccess) {
        console.log(`Autenticação falhou para ${username}`)
        return {
          success: false,
          message: "Credenciais inválidas",
        }
      }

      // Gerar token JWT
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          isLdapUser: user.isLdapUser,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1d",
        },
      )

      console.log(`Login bem-sucedido para ${username}`)

      // Retornar dados do usuário e token
      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          isLdapUser: user.isLdapUser,
          groups: user.Groups,
        },
        token,
      }
    } catch (error) {
      console.error("Erro no login:", error)
      return {
        success: false,
        message: "Erro ao realizar login",
      }
    }
  },

  /**
   * Verifica se o token é válido
   * @param {string} token - Token JWT
   * @returns {Promise<Object>} Resultado da verificação
   */
  async verifyToken(token) {
    try {
      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      // Buscar usuário
      const user = await User.findByPk(decoded.id, {
        include: [
          {
            model: Group,
            through: { attributes: [] },
          },
        ],
      })

      if (!user) {
        return {
          success: false,
          message: "Usuário não encontrado",
        }
      }

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          isLdapUser: user.isLdapUser,
          groups: user.Groups,
        },
      }
    } catch (error) {
      console.error("Erro ao verificar token:", error)
      return {
        success: false,
        message: "Token inválido",
      }
    }
  },
}

module.exports = authService

