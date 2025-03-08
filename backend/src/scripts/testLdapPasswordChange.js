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

async function testLdapPasswordChange() {
  try {
    console.log("=== Teste de Alteração de Senha LDAP ===\n")

    // Conectar ao banco de dados
    await sequelize.authenticate()
    console.log("Conexão com o banco de dados estabelecida com sucesso!")

    // Perguntar nome de usuário
    const username = await question("Digite o nome de usuário LDAP para alterar a senha: ")

    if (!username) {
      console.log("Nome de usuário não fornecido. Operação cancelada.")
      return
    }

    // Verificar se o usuário existe no banco local
    const user = await User.findOne({ where: { username, isLdapUser: true } })

    if (!user) {
      console.log(`Usuário ${username} não encontrado no banco local ou não é um usuário LDAP.`)
      console.log("Verifique se o usuário existe e é um usuário LDAP.")
      return
    }

    console.log(`Usuário ${username} encontrado no banco local.`)
    console.log(`ID: ${user.id}`)
    console.log(`Nome completo: ${user.fullName}`)
    console.log(`É usuário LDAP: ${user.isLdapUser ? "Sim" : "Não"}`)

    // Perguntar nova senha
    const newPassword = await question("Digite a nova senha: ")

    if (!newPassword) {
      console.log("Senha não fornecida. Operação cancelada.")
      return
    }

    // Confirmar alteração
    const confirm = await question(`Confirmar alteração de senha para o usuário ${username}? (s/n): `)

    if (confirm.toLowerCase() !== "s") {
      console.log("Operação cancelada pelo usuário.")
      return
    }

    console.log(`\nAlterando senha para o usuário ${username}...`)

    // Tentar alterar a senha
    const result = await ldapService.changePasswordLoggedUser(username, newPassword)

    if (result.success) {
      console.log("\n✅ Senha alterada com sucesso!")
      console.log(`Mensagem: ${result.message}`)
    } else {
      console.log("\n❌ Falha ao alterar senha!")
      console.log(`Erro: ${result.message}`)

      // Sugestões para resolver o problema
      console.log("\nSugestões para resolver o problema:")
      console.log("1. Verifique se o usuário administrador LDAP tem permissões para alterar senhas")
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

testLdapPasswordChange()

