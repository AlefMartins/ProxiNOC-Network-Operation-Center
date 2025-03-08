const fs = require("fs")
const path = require("path")

function fixPasswordService() {
  try {
    const passwordServicePath = path.join(__dirname, "..", "services", "passwordService.js")
    console.log(`Verificando arquivo: ${passwordServicePath}`)

    if (!fs.existsSync(passwordServicePath)) {
      console.error(`Arquivo não encontrado: ${passwordServicePath}`)
      return
    }

    // Ler o conteúdo atual do arquivo
    let content = fs.readFileSync(passwordServicePath, "utf8")

    // Fazer backup do arquivo original
    const backupPath = `${passwordServicePath}.backup-${Date.now()}`
    fs.writeFileSync(backupPath, content)
    console.log(`Backup criado em: ${backupPath}`)

    // Modificar a função changePassword para corrigir o problema de verificação de senha
    const updatedChangePassword = `
  /**
   * Altera a senha do usuário logado
   * @param {number} userId - ID do usuário
   * @param {string} newPassword - Nova senha
   * @returns {Promise<Object>} Resultado da operação
   */
  async changePassword(userId, newPassword) {
    try {
      // Buscar usuário
      const user = await User.findByPk(userId)

      if (!user) {
        return {
          success: false,
          message: "Usuário não encontrado",
        }
      }

      console.log(\`Alterando senha para usuário \${user.username} (LDAP: \${user.isLdapUser})\`)

      // Verificar se é usuário LDAP
      if (user.isLdapUser) {
        console.log(\`Usuário \${user.username} é LDAP, alterando senha no LDAP...\`)

        // Alterar senha no LDAP
        const ldapResult = await ldapService.changePasswordLoggedUser(user.username, newPassword)

        if (!ldapResult.success) {
          console.error(\`Erro ao alterar senha no LDAP para \${user.username}: \${ldapResult.message}\`)
          return ldapResult
        }

        console.log(\`Senha alterada com sucesso no LDAP para \${user.username}\`)
        return ldapResult
      }

      // Se não for LDAP, alterar senha localmente
      console.log(\`Alterando senha local para \${user.username}\`)

      // Gerar hash da senha usando bcrypt
      console.log(\`Gerando hash da senha para \${user.username}\`)
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      console.log(\`Hash gerado: \${hashedPassword.substring(0, 20)}...\`)

      // Atualizar diretamente no banco de dados usando uma query SQL
      // para evitar hooks que possam interferir
      console.log(\`Atualizando senha no banco de dados para \${user.username}\`)
      await sequelize.query(
        \`UPDATE Users SET password = ? WHERE id = ?\`,
        {
          replacements: [hashedPassword, userId],
          type: sequelize.QueryTypes.UPDATE,
        }
      )

      // Verificar se a senha foi atualizada corretamente
      const updatedUser = await User.findByPk(userId)
      console.log(\`Senha atualizada: \${updatedUser.password.substring(0, 20)}...\`)

      // Verificar se a nova senha funciona
      console.log(\`Verificando se a nova senha funciona para \${user.username}\`)
      const passwordMatch = await bcrypt.compare(newPassword, updatedUser.password)
      console.log(\`Resultado da verificação: \${passwordMatch}\`)

      if (!passwordMatch) {
        console.error(\`ERRO: A nova senha não funciona para \${user.username}!\`)
        return {
          success: false,
          message: "Erro ao verificar a nova senha",
        }
      }

      console.log(\`Senha alterada com sucesso para \${user.username}\`)
      return {
        success: true,
        message: "Senha alterada com sucesso",
      }
    } catch (error) {
      console.error("Erro ao alterar senha:", error)
      return {
        success: false,
        message: "Erro ao alterar senha",
      }
    }
  },`

    // Substituir a função changePassword no arquivo
    content = content.replace(
      /async changePassword$$userId, newPassword$$ {[\s\S]*?success: false,[\s\S]*?message: "Erro ao alterar senha",[\s\S]*?}\s*}/,
      updatedChangePassword,
    )

    // Adicionar a importação do sequelize se não existir
    if (!content.includes("const sequelize = require")) {
      content = content.replace(
        "const bcrypt = require",
        'const sequelize = require("../config/sequelize")\nconst bcrypt = require',
      )
    }

    // Salvar as alterações
    fs.writeFileSync(passwordServicePath, content)
    console.log("Arquivo passwordService.js modificado com sucesso!")
  } catch (error) {
    console.error("Erro ao modificar o arquivo:", error)
  }
}

fixPasswordService()

