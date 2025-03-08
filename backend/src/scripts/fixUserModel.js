const fs = require("fs")
const path = require("path")

function fixUserModel() {
  try {
    const userModelPath = path.join(__dirname, "..", "models", "User.js")
    console.log(`Verificando arquivo: ${userModelPath}`)

    if (!fs.existsSync(userModelPath)) {
      console.error(`Arquivo não encontrado: ${userModelPath}`)
      return
    }

    // Ler o conteúdo atual do arquivo
    let content = fs.readFileSync(userModelPath, "utf8")
    console.log("Conteúdo original do arquivo User.js:")
    console.log(content)

    // Fazer backup do arquivo original
    const backupPath = `${userModelPath}.backup`
    fs.writeFileSync(backupPath, content)
    console.log(`Backup criado em: ${backupPath}`)

    // Verificar se há hooks beforeSave ou beforeCreate que modificam a senha
    const hasPasswordHook =
      content.includes("beforeSave") ||
      content.includes("beforeCreate") ||
      content.includes("beforeUpdate") ||
      content.includes("bcrypt.hash")

    if (hasPasswordHook) {
      console.log("Encontrado hook que pode estar modificando a senha!")

      // Modificar o conteúdo para remover ou comentar os hooks
      // Esta é uma abordagem simplificada - pode precisar de ajustes dependendo do código real
      content = content.replace(/hooks: {[\s\S]*?},/g, "// hooks: {}, // Temporariamente desabilitado")

      // Salvar as alterações
      fs.writeFileSync(userModelPath, content)
      console.log("Arquivo User.js modificado com sucesso!")
      console.log("Conteúdo modificado:")
      console.log(content)
    } else {
      console.log("Nenhum hook de senha encontrado no modelo User.")
    }
  } catch (error) {
    console.error("Erro ao modificar o arquivo:", error)
  }
}

fixUserModel()

