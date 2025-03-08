const bcrypt = require("bcrypt")
const { User } = require("../../models")
const sequelize = require("../../config/sequelize")

async function resetAdminPassword() {
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

    // Verificar se é usuário LDAP
    if (admin.isLdapUser) {
      console.log("Convertendo admin para usuário local...")
      await admin.update({ isLdapUser: false })
      console.log("Admin convertido para usuário local!")
    }

    // Resetar senha
    const newPassword = "admin"
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await admin.update({ password: hashedPassword })
    console.log(`Senha do usuário admin resetada para: ${newPassword}`)

    console.log("Operação concluída com sucesso!")
  } catch (error) {
    console.error("Erro:", error)
  } finally {
    process.exit()
  }
}

resetAdminPassword()

