const ldapService = require("../services/ldapService")
const authService = require("../services/authService")
const { User } = require("../models")
const sequelize = require("../config/sequelize")

async function testLdapAuthentication() {
  try {
    console.log("Conectando ao banco de dados...")
    await sequelize.authenticate()
    console.log("Conexão estabelecida com sucesso!")

    // Testar conexão com o servidor LDAP
    console.log("\nTestando conexão com o servidor LDAP...")
    const connectionResult = await ldapService.testConnection()
    console.log("Resultado:", connectionResult.success ? "SUCESSO" : "FALHA")

    if (!connectionResult.success) {
      console.log("Mensagem:", connectionResult.message)
      return
    }

    // Solicitar credenciais de um usuário LDAP
    const username = process.argv[2]
    const password = process.argv[3]

    if (!username || !password) {
      console.log("\nUso: node src/scripts/testLdapAuthentication.js <username> <password>")
      return
    }

    // Verificar se o usuário existe no banco local
    console.log(`\nVerificando se o usuário ${username} existe no banco local...`)
    const user = await User.findOne({ where: { username } })

    if (user) {
      console.log("Usuário encontrado:")
      console.log(`ID: ${user.id}`)
      console.log(`Username: ${user.username}`)
      console.log(`isLdapUser: ${user.isLdapUser}`)
    } else {
      console.log("Usuário não encontrado no banco local")
      return
    }

    // Testar autenticação LDAP diretamente
    console.log("\nTestando autenticação LDAP diretamente...")
    const ldapResult = await ldapService.authenticate(username, password)
    console.log("Resultado:", ldapResult.success ? "SUCESSO" : "FALHA")
    console.log("Mensagem:", ldapResult.message)

    // Testar login usando o authService
    console.log("\nTestando login usando authService...")
    const loginResult = await authService.login(username, password)
    console.log("Resultado:", loginResult.success ? "SUCESSO" : "FALHA")

    if (!loginResult.success) {
      console.log("Mensagem:", loginResult.message)
    } else {
      console.log("Usuário autenticado com sucesso!")
    }
  } catch (error) {
    console.error("Erro:", error)
  } finally {
    await sequelize.close()
    process.exit()
  }
}

testLdapAuthentication()

