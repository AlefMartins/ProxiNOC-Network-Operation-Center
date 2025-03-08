const bcrypt = require("bcrypt")
const { User } = require("../models")
const sequelize = require("../config/sequelize")

async function fixAdminPasswordForMariaDB() {
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

    // Verificar se o usuário é LDAP
    if (admin.isLdapUser) {
      console.log("Convertendo admin para usuário local...")
      await admin.update({ isLdapUser: false })
      console.log("Admin convertido para usuário local!")
    }

    // Gerar hash da senha usando bcrypt
    console.log("Gerando hash da senha usando bcrypt...")
    const hashedPassword = await bcrypt.hash(adminPassword, 10)
    console.log(`Hash gerado: ${hashedPassword}`)

    // Atualizar diretamente no banco de dados usando uma query SQL correta para MariaDB
    console.log("Atualizando senha diretamente no banco de dados...")
    await sequelize.query(
      `
      UPDATE Users 
      SET password = ? 
      WHERE username = ?
    `,
      {
        replacements: [hashedPassword, "admin"],
        type: sequelize.QueryTypes.UPDATE,
      },
    )

    console.log("Senha atualizada com sucesso!")

    // Verificar se a atualização foi bem-sucedida
    const updatedAdmin = await User.findOne({ where: { username: "admin" } })
    console.log(`Nova senha hash: ${updatedAdmin.password}`)

    // Testar a senha atualizada
    console.log("\nTestando a senha atualizada...")
    const passwordMatch = await bcrypt.compare(adminPassword, updatedAdmin.password)
    console.log(`Resultado: ${passwordMatch ? "SENHA CORRETA" : "SENHA INCORRETA"}`)
  } catch (error) {
    console.error("Erro:", error)
  } finally {
    await sequelize.close()
    process.exit()
  }
}

fixAdminPasswordForMariaDB()

