const bcrypt = require("bcrypt")
const { User } = require("../models")
const sequelize = require("../config/sequelize")
const authService = require("../services/authService")

async function testLoginWithBcrypt() {
  try {
    console.log("Conectando ao banco de dados...")
    await sequelize.authenticate()
    console.log("Conexão estabelecida com sucesso!")

    // Definir credenciais de teste
    const username = "admin"
    const password = "admin"

    // Buscar usuário admin
    console.log(`Buscando usuário ${username}...`)
    const admin = await User.findOne({ where: { username } })

    if (!admin) {
      console.log(`Usuário ${username} não encontrado!`)
      return
    }

    console.log(`Usuário ${username} encontrado:`)
    console.log(`ID: ${admin.id}`)
    console.log(`Username: ${admin.username}`)
    console.log(`isLdapUser: ${admin.isLdapUser}`)
    console.log(`Senha hash: ${admin.password}`)

    // Testar senha diretamente com bcrypt
    console.log(`\nTestando senha "${password}" com bcrypt.compare...`)
    const passwordMatch = await bcrypt.compare(password, admin.password)
    console.log(`Resultado direto com bcrypt: ${passwordMatch ? "SENHA CORRETA" : "SENHA INCORRETA"}`)

    // Testar login usando o authService
    console.log("\nTestando login usando authService...")
    const loginResult = await authService.login(username, password)
    console.log("Resultado do login:", loginResult.success ? "SUCESSO" : "FALHA")

    if (!loginResult.success) {
      console.log("Mensagem de erro:", loginResult.message)
    }
  } catch (error) {
    console.error("Erro:", error)
  } finally {
    await sequelize.close()
    process.exit()
  }
}

testLoginWithBcrypt()

