const { User } = require("../models")
const sequelize = require("../config/sequelize")
const fs = require("fs")
const path = require("path")

async function inspectUserModel() {
  try {
    console.log("Conectando ao banco de dados...")
    await sequelize.authenticate()
    console.log("Conexão estabelecida com sucesso!")

    // Exibir o modelo User
    console.log("\nInspecionando modelo User:")
    console.log("Atributos:", Object.keys(User.rawAttributes))
    console.log("Hooks:", User.options.hooks ? "Sim" : "Não")

    // Verificar se há hooks no modelo
    if (User.options.hooks) {
      console.log("\nHooks encontrados:")
      console.log(JSON.stringify(User.options.hooks, null, 2))
    }

    // Ler o arquivo do modelo User
    const userModelPath = path.join(__dirname, "..", "models", "User.js")
    console.log(`\nLendo arquivo do modelo: ${userModelPath}`)

    if (fs.existsSync(userModelPath)) {
      const modelContent = fs.readFileSync(userModelPath, "utf8")
      console.log("\nConteúdo do arquivo User.js:")
      console.log(modelContent)
    } else {
      console.log("Arquivo do modelo não encontrado!")
    }

    // Testar inserção direta no banco
    console.log("\nTestando inserção direta no banco de dados...")

    // Criar um usuário de teste
    const testUser = await User.create({
      username: "testuser_" + Date.now(),
      password: "$2b$10$CMJsCAFYHH9C3XVi4fhvz.Odi/eMPk5NhY7hngG0xnvVKBHf7Hy6W", // Hash gerado anteriormente
      fullName: "Usuário de Teste",
      email: "test@example.com",
      isLdapUser: false,
      isActive: true,
    })

    console.log("Usuário de teste criado:")
    console.log(`ID: ${testUser.id}`)
    console.log(`Username: ${testUser.username}`)
    console.log(`Senha hash: ${testUser.password}`)

    // Verificar se o hash foi modificado
    const hashModified = testUser.password !== "$2b$10$CMJsCAFYHH9C3XVi4fhvz.Odi/eMPk5NhY7hngG0xnvVKBHf7Hy6W"
    console.log(`Hash foi modificado: ${hashModified ? "SIM" : "NÃO"}`)

    // Limpar usuário de teste
    await testUser.destroy()
    console.log("Usuário de teste removido")
  } catch (error) {
    console.error("Erro:", error)
  } finally {
    await sequelize.close()
    process.exit()
  }
}

inspectUserModel()

