const fs = require("fs")
const path = require("path")

function standardizeBcrypt() {
  try {
    console.log("Padronizando o uso de bcrypt no projeto...")

    // Diretórios a serem verificados
    const directories = [
      path.join(__dirname, ".."),
      path.join(__dirname, "..", "services"),
      path.join(__dirname, "..", "models"),
      path.join(__dirname, "..", "controllers"),
    ]

    // Arquivos modificados
    const modifiedFiles = []

    // Função para verificar e modificar arquivos em um diretório
    function processDirectory(dir) {
      const files = fs.readdirSync(dir)

      for (const file of files) {
        const filePath = path.join(dir, file)
        const stat = fs.statSync(filePath)

        if (stat.isDirectory() && !filePath.includes("node_modules")) {
          // Verificar subdiretórios recursivamente
          processDirectory(filePath)
        } else if (stat.isFile() && file.endsWith(".js")) {
          // Verificar arquivos JavaScript
          let content = fs.readFileSync(filePath, "utf8")
          let modified = false

          // Substituir bcryptjs por bcrypt
          if (content.includes("require('bcryptjs')") || content.includes('require("bcryptjs")')) {
            content = content.replace(/require$$['"]bcryptjs['"]$$/g, 'require("bcrypt")')
            modified = true
          }

          // Se o arquivo foi modificado, salvar as alterações
          if (modified) {
            // Fazer backup do arquivo original
            fs.writeFileSync(`${filePath}.backup`, fs.readFileSync(filePath))

            // Salvar as alterações
            fs.writeFileSync(filePath, content)
            modifiedFiles.push(filePath)
          }
        }
      }
    }

    // Processar todos os diretórios
    for (const dir of directories) {
      if (fs.existsSync(dir)) {
        processDirectory(dir)
      }
    }

    // Exibir resultados
    console.log("\nArquivos modificados:")
    if (modifiedFiles.length > 0) {
      modifiedFiles.forEach((file) => {
        console.log(`- ${path.relative(path.join(__dirname, ".."), file)}`)
      })
    } else {
      console.log("Nenhum arquivo foi modificado")
    }

    console.log("\nPróximos passos:")
    console.log("1. Remova a dependência bcryptjs do package.json")
    console.log("2. Execute 'npm install' para atualizar o package-lock.json")
    console.log("3. Reinicie o servidor")
  } catch (error) {
    console.error("Erro:", error)
  }
}

standardizeBcrypt()

