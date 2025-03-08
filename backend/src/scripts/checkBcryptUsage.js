const fs = require("fs")
const path = require("path")

function checkBcryptUsage() {
  try {
    console.log("Verificando uso de bibliotecas bcrypt no projeto...")

    // Diretórios a serem verificados
    const directories = [
      path.join(__dirname, ".."),
      path.join(__dirname, "..", "services"),
      path.join(__dirname, "..", "models"),
      path.join(__dirname, "..", "controllers"),
    ]

    // Resultados
    const results = {
      bcrypt: [],
      bcryptjs: [],
    }

    // Função para verificar arquivos em um diretório
    function checkDirectory(dir) {
      const files = fs.readdirSync(dir)

      for (const file of files) {
        const filePath = path.join(dir, file)
        const stat = fs.statSync(filePath)

        if (stat.isDirectory() && !filePath.includes("node_modules")) {
          // Verificar subdiretórios recursivamente
          checkDirectory(filePath)
        } else if (stat.isFile() && file.endsWith(".js")) {
          // Verificar arquivos JavaScript
          const content = fs.readFileSync(filePath, "utf8")

          if (content.includes("require('bcrypt')") || content.includes('require("bcrypt")')) {
            results.bcrypt.push(filePath)
          }

          if (content.includes("require('bcryptjs')") || content.includes('require("bcryptjs")')) {
            results.bcryptjs.push(filePath)
          }
        }
      }
    }

    // Verificar todos os diretórios
    for (const dir of directories) {
      if (fs.existsSync(dir)) {
        checkDirectory(dir)
      }
    }

    // Exibir resultados
    console.log("\nArquivos usando bcrypt:")
    if (results.bcrypt.length > 0) {
      results.bcrypt.forEach((file) => {
        console.log(`- ${path.relative(path.join(__dirname, ".."), file)}`)
      })
    } else {
      console.log("Nenhum arquivo encontrado")
    }

    console.log("\nArquivos usando bcryptjs:")
    if (results.bcryptjs.length > 0) {
      results.bcryptjs.forEach((file) => {
        console.log(`- ${path.relative(path.join(__dirname, ".."), file)}`)
      })
    } else {
      console.log("Nenhum arquivo encontrado")
    }

    // Verificar o modelo User
    const userModelPath = path.join(__dirname, "..", "models", "User.js")
    if (fs.existsSync(userModelPath)) {
      const content = fs.readFileSync(userModelPath, "utf8")
      console.log("\nConteúdo do modelo User.js:")
      console.log(content)
    }
  } catch (error) {
    console.error("Erro:", error)
  }
}

checkBcryptUsage()

