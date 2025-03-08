const bcrypt = require("bcrypt")
const { User } = require("../models")
const sequelize = require("../config/sequelize")

async function fixBcryptVersion() {
  try {
    console.log("Conectando ao banco de dados...")
    await sequelize.authenticate()
    console.log("Conexão estabelecida com sucesso!")

    // Definir a senha padrão para o admin
    const adminPassword = "admin"

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

    // Gerar um novo hash com a versão correta do bcrypt
    console.log("\nGerando novo hash com a versão correta do bcrypt...")

    // Usar a opção específica para gerar um hash compatível com $2a$
    const saltRounds = 10
    const salt = await bcrypt.genSalt(saltRounds)
    const hashedPassword = await bcrypt.hash(adminPassword, salt)

    console.log(`Novo hash: ${hashedPassword}`)

    // Verificar se o novo hash funciona
    console.log("\nVerificando se o novo hash funciona...")
    const hashMatch = await bcrypt.compare(adminPassword, hashedPassword)
    console.log(`Resultado: ${hashMatch ? "FUNCIONA" : "NÃO FUNCIONA"}`)

    // Atualizar senha do admin
    console.log("\nAtualizando senha do admin para 'admin'...")
    await admin.update({
      password: hashedPassword,
      isLdapUser: false, // Garantir que o usuário seja local
    })
    console.log("Senha atualizada!")

    // Verificar se a senha foi atualizada
    const updatedAdmin = await User.findOne({ where: { username: "admin" } })
    console.log(`Nova senha hash: ${updatedAdmin.password}`)

    // Testar a senha atualizada
    console.log("\nTestando a senha atualizada...")
    const updatedPasswordMatch = await bcrypt.compare(adminPassword, updatedAdmin.password)
    console.log(`Resultado: ${updatedPasswordMatch ? "SENHA CORRETA" : "SENHA INCORRETA"}`)

    // Modificar o arquivo passwordService.js para usar a versão correta do bcrypt
    console.log("\nVerificando se é necessário modificar o passwordService.js...")

    // Verificar a versão do bcrypt
    console.log(`Versão do bcrypt: ${bcrypt.version || "Desconhecida"}`)
  } catch (error) {
    console.error("Erro:", error)
  } finally {
    await sequelize.close()
    process.exit()
  }
}

fixBcryptVersion()

