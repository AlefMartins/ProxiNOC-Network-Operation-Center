const fs = require("fs")
const path = require("path")

function fixAuthService() {
  try {
    const authServicePath = path.join(__dirname, "..", "services", "authService.js")
    console.log(`Verificando arquivo: ${authServicePath}`)

    if (!fs.existsSync(authServicePath)) {
      console.error(`Arquivo não encontrado: ${authServicePath}`)
      return
    }

    // Ler o conteúdo atual do arquivo
    let content = fs.readFileSync(authServicePath, "utf8")

    // Fazer backup do arquivo original
    const backupPath = `${authServicePath}.backup-${Date.now()}`
    fs.writeFileSync(backupPath, content)
    console.log(`Backup criado em: ${backupPath}`)

    // Modificar a função login para corrigir o problema de autenticação LDAP
    const updatedLogin = `
  /**
   * Realiza o login do usuário
   * @param {string} username - Nome de usuário
   * @param {string} password - Senha
   * @returns {Promise<Object>} Resultado do login
   */
  async login(username, password) {
    try {
      console.log(\`Tentativa de login para usuário: \${username}\`)

      // Primeiro, verificar se o usuário existe no banco local
      const user = await User.findOne({
        where: { username },
        include: [
          {
            model: Group,
            through: { attributes: [] },
          },
        ],
      })

      if (!user) {
        console.log(\`Usuário \${username} não encontrado no banco local\`)
        return {
          success: false,
          message: "Credenciais inválidas",
        }
      }

      console.log(\`Usuário \${username} encontrado. isLdapUser: \${user.isLdapUser}\`)
      console.log(\`Senha armazenada: \${user.password.substring(0, 20)}...\`)

      let authSuccess = false

      // Verificar se é usuário LDAP
      if (user.isLdapUser) {
        console.log(\`Autenticando \${username} no LDAP...\`)

        try {
          // Autenticar no LDAP
          const ldapResult = await ldapService.authenticate(username, password)
          authSuccess = ldapResult.success

          console.log(\`Resultado da autenticação LDAP para \${username}: \${authSuccess ? "Sucesso" : "Falha"}\`)
        } catch (ldapError) {
          console.error(\`Erro na autenticação LDAP para \${username}:\`, ldapError)
          
          // Tentar autenticação local como fallback
          console.log(\`Tentando autenticação local como fallback para \${username}...\`)
          authSuccess = await bcrypt.compare(password, user.password)
          console.log(\`Resultado da autenticação local fallback para \${username}: \${authSuccess ? "Sucesso" : "Falha"}\`)
        }
      } else {
        // Autenticar localmente
        console.log(\`Autenticando \${username} localmente...\`)

        // Verificar senha usando bcrypt
        authSuccess = await bcrypt.compare(password, user.password)

        console.log(\`Resultado da autenticação local para \${username}: \${authSuccess ? "Sucesso" : "Falha"}\`)
      }

      if (!authSuccess) {
        console.log(\`Autenticação falhou para \${username}\`)
        return {
          success: false,
          message: "Credenciais inválidas",
        }
      }

      // Gerar token JWT
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          isLdapUser: user.isLdapUser,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1d",
        }
      )

      console.log(\`Login bem-sucedido para \${username}\`)

      // Atualizar data do último login
      await user.update({ lastLogin: new Date() })

      // Retornar dados do usuário e token
      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          isLdapUser: user.isLdapUser,
          groups: user.Groups,
        },
        token,
      }
    } catch (error) {
      console.error("Erro no login:", error)
      return {
        success: false,
        message: "Erro ao realizar login",
      }
    }
  },`

    // Substituir a função login no arquivo
    content = content.replace(
      /async login$$username, password$$ {[\s\S]*?success: false,[\s\S]*?message: "Erro ao realizar login",[\s\S]*?}\s*}/,
      updatedLogin,
    )

    // Salvar as alterações
    fs.writeFileSync(authServicePath, content)
    console.log("Arquivo authService.js modificado com sucesso!")
  } catch (error) {
    console.error("Erro ao modificar o arquivo:", error)
  }
}

fixAuthService()

