const bcrypt = require("bcrypt")
const { User } = require("../models")
const sequelize = require("../config/sequelize")
const passwordService = require("../services/passwordService")

async function testPasswordChange() {
  try {
    console.log("Conectando ao banco de dados...")
    await sequelize.authenticate()
    console.log("Conexão estabelecida com sucesso!")

    // Buscar usuário admin
    console.log("Buscando usuário admin...")
    const admin = await User.findOne({ where: { username: "admin" } })

    if (!admin) {
      console.log("Usuário admin não encontrado!")
      return
    }

    console.log("Usuário admin encontrado:")
    console.log(`ID: ${admin.id}`)
    console.log(`Username: ${admin.username}`)
    console.log(`isLdapUser: ${admin.isLdapUser}`)
    console.log(`Senha hash atual: ${admin.password}`)

    // Testar alteração de senha
    console.log("\nTestando alteração de senha...")
    const newPassword = "X9-gedz3"
    const result = await passwordService.changePassword(admin.id, newPassword)

    console.log("Resultado da alteração de senha:", result)

    if (result.success) {
      // Verificar se a senha foi alterada corretamente
      const updatedAdmin = await User.findOne({ where: { username: "admin" } })
      console.log(`Nova senha hash: ${updatedAdmin.password}`)

      // Testar a senha atualizada
      console.log("\nTestando a senha atualizada...")
      const passwordMatch = await bcrypt.compare(newPassword, updatedAdmin.password)
      console.log(`Resultado: ${passwordMatch ? "SENHA CORRETA" : "SENHA INCORRETA"}`)
    }
  } catch (error) {
    console.error("Erro:", error)
  } finally {
    await sequelize.close()
    process.exit()
  }
}

testPasswordChange()

