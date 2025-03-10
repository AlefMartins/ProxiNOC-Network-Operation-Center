const fs = require("fs")
const path = require("path")

function findJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir)

  files.forEach((file) => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory() && file !== "node_modules") {
      fileList = findJsFiles(filePath, fileList)
    } else if (stat.isFile() && (file.endsWith(".js") || file.endsWith(".ts"))) {
      fileList.push(filePath)
    }
  })

  return fileList
}

function replaceBcryptjs() {
  const rootDir = path.join(__dirname, "..", "..")
  const jsFiles = findJsFiles(path.join(rootDir, "src"))

  console.log(`Encontrados ${jsFiles.length} arquivos JavaScript/TypeScript para verificar.`)

  let replacedFiles = 0

  jsFiles.forEach((filePath) => {
    let content = fs.readFileSync(filePath, "utf8")
    const originalContent = content

    // Substituir require('bcryptjs') por require('bcrypt')
    content = content.replace(/require$$['"]bcryptjs['"]$$/g, "require('bcrypt')")

    // Substituir import bcryptjs from 'bcrypt' por import bcrypt from 'bcrypt'
    content = content.replace(/import\s+(\w+)\s+from\s+['"]bcryptjs['"]/g, "import $1 from 'bcrypt'")

    // Substituir import * as bcryptjs from 'bcrypt' por import * as bcrypt from 'bcrypt'
    content = content.replace(/import\s+\*\s+as\s+(\w+)\s+from\s+['"]bcryptjs['"]/g, "import * as $1 from 'bcrypt'")

    if (content !== originalContent) {
      // Criar backup do arquivo original
      fs.writeFileSync(`${filePath}.bak`, originalContent)

      // Salvar o arquivo modificado
      fs.writeFileSync(filePath, content)

      console.log(`Arquivo modificado: ${filePath}`)
      replacedFiles++
    }
  })

  console.log(`Total de arquivos modificados: ${replacedFiles}`)
}

replaceBcryptjs()

