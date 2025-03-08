const ldapService = require("../services/ldapService")
const { User } = require("../models")
const sequelize = require("../config/sequelize")
const readline = require("readline")

// Criar interface de leitura
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// Função para perguntar
function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

async function testAdminPasswordReset() {
  try {
    console.log("=== Teste de Reset de Senha LDAP (Admin) ===\n")

    // Conectar ao banco de dados
    await sequelize.authenticate()
    console.log("Conexão com o banco de dados estabelecida com sucesso!")

    // Listar usuários LDAP
    console.log("\nListando usuários LDAP disponíveis...")
    const ldapUsers = await User.findAll({
      where: { isLdapUser: true },
      attributes: ["id", "username", "fullName", "email"],
    })

    if (ldapUsers.length === 0) {
      console.log("Nenhum usuário LDAP encontrado no banco de dados.")
      return
    }

    console.log("\nUsuários LDAP disponíveis:")
    ldapUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.fullName || "Sem nome"})`)
    })

    // Perguntar qual usuário resetar
    const userIndex = Number.parseInt(
      await question("\nDigite o número do usuário para resetar a senha (ou 0 para digitar o nome): "),
      10,
    )

    let username
    if (userIndex === 0) {
      username = await question("Digite o nome de usuário: ")
    } else if (userIndex > 0 && userIndex <= ldapUsers.length) {
      username = ldapUsers[userIndex - 1].username
    } else {
      console.log("Escolha inválida. Operação cancelada.")
      return
    }

    // Verificar se o usuário existe
    const user = await User.findOne({ where: { username, isLdapUser: true } })

    if (!user) {
      console.log(`Usuário ${username} não encontrado ou não é um usuário LDAP.`)
      return
    }

    console.log(`\nUsuário selecionado: ${username} (${user.fullName || "Sem nome"})`)

    // Perguntar nova senha
    const newPassword = await question("Digite a nova senha: ")

    if (!newPassword) {
      console.log("Senha não fornecida. Operação cancelada.")
      return
    }

    // Confirmar reset
    const confirm = await question(`Confirmar reset de senha para o usuário ${username}? (s/n): `)

    if (confirm.toLowerCase() !== "s") {
      console.log("Operação cancelada pelo usuário.")
      return
    }

    console.log(`\nResetando senha para o usuário ${username}...`)

    // Tentar resetar a senha
    const result = await ldapService.resetPassword(username, newPassword)

    if (result.success) {
      console.log("\n✅ Senha resetada com sucesso!")
      console.log(`Mensagem: ${result.message}`)
    } else {
      console.log("\n❌ Falha ao resetar senha!")
      console.log(`Erro: ${result.message}`)

      // Sugestões para resolver o problema
      console.log("\nSugestões para resolver o problema:")
      console.log("1. Verifique se o usuário administrador LDAP tem permissões para resetar senhas")
      console.log("2. Verifique se há políticas de complexidade de senha no Active Directory")
      console.log("3. Verifique se a conta do usuário não está bloqueada ou expirada")
      console.log("4. Tente uma senha mais complexa (letras maiúsculas, minúsculas, números e símbolos)")
    }
  } catch (error) {
    console.error("Erro durante o teste:", error)
  } finally {
    rl.close()
    await sequelize.close()
    process.exit()
  }
}

testAdminPasswordReset()

