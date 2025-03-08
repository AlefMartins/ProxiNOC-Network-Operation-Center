const bcrypt = require("bcrypt")
const { User } = require("../models")
const sequelize = require("../config/sequelize")

async function testAuthentication() {
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
    console.log(`Senha hash: ${admin.password}`)

    // Testar senha
    const testPassword = "X9-gedz3" // Substitua pela senha que você definiu
    console.log(`\nTestando senha "${testPassword}" com bcrypt.compare...`)

    const passwordMatch = await bcrypt.compare(testPassword, admin.password)
    console.log(`Resultado: ${passwordMatch ? "SENHA CORRETA" : "SENHA INCORRETA"}`)

    // Criar nova senha hash para comparação
    console.log("\nGerando novo hash para a mesma senha...")
    const newHash = await bcrypt.hash(testPassword, 10)
    console.log(`Novo hash: ${newHash}`)

    // Verificar se o novo hash funciona
    console.log("\nVerificando se o novo hash funciona...")
    const newHashMatch = await bcrypt.compare(testPassword, newHash)
    console.log(`Resultado: ${newHashMatch ? "FUNCIONA" : "NÃO FUNCIONA"}`)

    // Atualizar senha do admin para teste
    console.log("\nAtualizando senha do admin para teste...")
    await admin.update({ password: newHash })
    console.log("Senha atualizada!")

    // Verificar se a senha foi atualizada
    const updatedAdmin = await User.findOne({ where: { username: "admin" } })
    console.log(`Nova senha hash: ${updatedAdmin.password}`)

    // Testar a senha atualizada
    console.log("\nTestando a senha atualizada...")
    const updatedPasswordMatch = await bcrypt.compare(testPassword, updatedAdmin.password)
    console.log(`Resultado: ${updatedPasswordMatch ? "SENHA CORRETA" : "SENHA INCORRETA"}`)
  } catch (error) {
    console.error("Erro:", error)
  } finally {
    await sequelize.close()
    process.exit()
  }
}

testAuthentication()

