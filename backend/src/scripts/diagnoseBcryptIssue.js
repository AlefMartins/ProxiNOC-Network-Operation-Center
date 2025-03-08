const bcrypt = require("bcrypt")
const { User } = require("../models")
const sequelize = require("../config/sequelize")

async function diagnoseBcryptIssue() {
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

    // Verificar a versão do bcrypt
    console.log("\nVersão do bcrypt:", bcrypt.version || "Desconhecida")

    // Testar a geração e verificação de hash
    console.log("\nTestando geração e verificação de hash...")
    const testPassword = "testpassword"

    // Gerar hash com diferentes rounds
    console.log("\nGerando hashes com diferentes rounds:")
    for (let rounds = 8; rounds <= 12; rounds++) {
      const hash = await bcrypt.hash(testPassword, rounds)
      console.log(`Hash com ${rounds} rounds: ${hash}`)

      // Verificar o hash
      const isValid = await bcrypt.compare(testPassword, hash)
      console.log(`Verificação: ${isValid ? "SUCESSO" : "FALHA"}`)
    }

    // Testar verificação com o hash atual do admin
    console.log("\nTestando verificação com o hash atual do admin:")
    const adminPassword = "admin" // Assumindo que esta é a senha atual
    const isAdminValid = await bcrypt.compare(adminPassword, admin.password)
    console.log(`Verificação com senha 'admin': ${isAdminValid ? "SUCESSO" : "FALHA"}`)

    // Testar verificação com diferentes prefixos de hash
    console.log("\nTestando verificação com diferentes prefixos de hash:")
    const prefixes = ["$2a$", "$2b$", "$2y$"]
    for (const prefix of prefixes) {
      // Extrair o hash atual e substituir o prefixo
      const currentHash = admin.password
      const newHash = currentHash.replace(/^\$2[a-z]\$/, prefix)

      console.log(`Hash com prefixo ${prefix}: ${newHash}`)
      const isPrefixValid = await bcrypt.compare(adminPassword, newHash)
      console.log(`Verificação: ${isPrefixValid ? "SUCESSO" : "FALHA"}`)
    }

    // Resetar a senha do admin com um novo hash
    console.log("\nResetando a senha do admin...")
    const newAdminPassword = "admin"
    const newHash = await bcrypt.hash(newAdminPassword, 10)
    console.log(`Novo hash: ${newHash}`)

    // Atualizar a senha diretamente no banco de dados
    await sequelize.query(`UPDATE Users SET password = ? WHERE username = ?`, {
      replacements: [newHash, "admin"],
      type: sequelize.QueryTypes.UPDATE,
    })

    // Verificar se a senha foi atualizada
    const updatedAdmin = await User.findOne({ where: { username: "admin" } })
    console.log(`Senha atualizada: ${updatedAdmin.password}`)

    // Verificar a nova senha
    const isNewValid = await bcrypt.compare(newAdminPassword, updatedAdmin.password)
    console.log(`Verificação da nova senha: ${isNewValid ? "SUCESSO" : "FALHA"}`)

    if (isNewValid) {
      console.log('\nSENHA RESETADA COM SUCESSO! Agora você pode fazer login com a senha "admin".')
    } else {
      console.log("\nFALHA AO RESETAR SENHA! Ainda há problemas com a verificação de bcrypt.")
    }
  } catch (error) {
    console.error("Erro:", error)
  } finally {
    await sequelize.close()
    process.exit()
  }
}

diagnoseBcryptIssue()

