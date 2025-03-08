const fs = require("fs")
const path = require("path")

function fixAuthController() {
  try {
    const authControllerPath = path.join(__dirname, "..", "controllers", "authController.js")
    console.log(`Verificando arquivo: ${authControllerPath}`)

    if (!fs.existsSync(authControllerPath)) {
      console.error(`Arquivo não encontrado: ${authControllerPath}`)
      return
    }

    // Ler o conteúdo atual do arquivo
    let content = fs.readFileSync(authControllerPath, "utf8")

    // Fazer backup do arquivo original
    const backupPath = `${authControllerPath}.backup-${Date.now()}`
    fs.writeFileSync(backupPath, content)
    console.log(`Backup criado em: ${backupPath}`)

    // Substituir bcryptjs por bcrypt
    content = content.replace(/require$$['"]bcryptjs['"]$$/g, "require('bcrypt')")

    // Salvar as alterações
    fs.writeFileSync(authControllerPath, content)
    console.log("Arquivo authController.js modificado com sucesso!")
  } catch (error) {
    console.error("Erro ao modificar o arquivo:", error)
  }
}

fixAuthController()

