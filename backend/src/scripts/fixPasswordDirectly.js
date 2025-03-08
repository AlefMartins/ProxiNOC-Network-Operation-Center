const bcrypt = require("bcrypt")
const sequelize = require("../config/sequelize")

async function fixPasswordDirectly() {
  try {
    console.log("Conectando ao banco de dados...")
    await sequelize.authenticate()
    console.log("Conexão estabelecida com sucesso!")

    // Definir a senha padrão para o admin
    const adminPassword = "admin"

    // Gerar hash da senha
    console.log("Gerando hash da senha...")
    const hashedPassword = await bcrypt.hash(adminPassword, 10)
    console.log(`Hash gerado: ${hashedPassword}`)

    // Atualizar diretamente no banco de dados usando uma query SQL
    console.log("Atualizando senha diretamente no banco de dados...")
    await sequelize.query(`
      UPDATE "Users" 
      SET "password" = '${hashedPassword}' 
      WHERE "username" = 'admin'
    `)

    console.log("Senha atualizada com sucesso!")

    // Verificar se a atualização foi bem-sucedida
    const [results] = await sequelize.query(`
      SELECT "id", "username", "password", "isLdapUser" 
      FROM "Users" 
      WHERE "username" = 'admin'
    `)

    if (results.length > 0) {
      console.log("\nUsuário admin verificado:")
      console.log(`ID: ${results[0].id}`)
      console.log(`Username: ${results[0].username}`)
      console.log(`Senha hash: ${results[0].password}`)
      console.log(`isLdapUser: ${results[0].isLdapUser}`)

      // Verificar se o hash foi preservado
      const hashPreserved = results[0].password === hashedPassword
      console.log(`Hash foi preservado: ${hashPreserved ? "SIM" : "NÃO"}`)

      // Testar a senha
      console.log("\nTestando a senha...")
      const passwordMatch = await bcrypt.compare(adminPassword, results[0].password)
      console.log(`Resultado: ${passwordMatch ? "SENHA CORRETA" : "SENHA INCORRETA"}`)
    } else {
      console.log("Usuário admin não encontrado!")
    }
  } catch (error) {
    console.error("Erro:", error)
  } finally {
    await sequelize.close()
    process.exit()
  }
}

fixPasswordDirectly()

