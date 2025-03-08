const ldap = require("ldapjs")
const { LdapConfig } = require("../models")
const sequelize = require("../config/sequelize")

async function verifyLdapPasswordRequirements() {
  let client = null

  try {
    console.log("=== Verificação de Requisitos de Senha LDAP ===\n")

    // Conectar ao banco de dados
    await sequelize.authenticate()
    console.log("Conexão com o banco de dados estabelecida com sucesso!")

    // Obter configuração LDAP
    const config = await LdapConfig.findOne()

    if (!config) {
      console.log("Nenhuma configuração LDAP encontrada no banco de dados!")
      return
    }

    // Criar cliente LDAP
    const url = `ldap://${config.server}:${config.port}`
    console.log(`Conectando ao servidor LDAP: ${url}`)

    client = ldap.createClient({
      url: url,
      timeout: 10000,
      connectTimeout: 10000,
      tlsOptions: {
        rejectUnauthorized: false,
      },
    })

    // Autenticar com o servidor LDAP
    console.log(`Autenticando com DN: ${config.bindUser}`)

    await new Promise((resolve, reject) => {
      client.bind(config.bindUser, config.bindPassword, (err) => {
        if (err) {
          console.error("Erro na autenticação LDAP:", err)
          reject(err)
        } else {
          console.log("Autenticação LDAP bem-sucedida!")
          resolve()
        }
      })
    })

    // Buscar políticas de senha
    console.log("\nBuscando políticas de senha no domínio...")

    await new Promise((resolve) => {
      client.search(
        config.baseDn,
        {
          scope: "sub",
          filter: "(objectClass=domainDNS)",
          attributes: ["minPwdLength", "pwdProperties", "pwdHistoryLength", "lockoutThreshold"],
        },
        (err, res) => {
          if (err) {
            console.error("Erro na busca LDAP:", err)
            resolve()
            return
          }

          let policyFound = false

          res.on("searchEntry", (entry) => {
            policyFound = true
            console.log("\n=== Políticas de Senha Encontradas ===")

            const attrs = entry.attributes
            const minPwdLength = attrs.find((a) => a.type === "minPwdLength")?.vals[0]
            const pwdProperties = attrs.find((a) => a.type === "pwdProperties")?.vals[0]
            const pwdHistoryLength = attrs.find((a) => a.type === "pwdHistoryLength")?.vals[0]
            const lockoutThreshold = attrs.find((a) => a.type === "lockoutThreshold")?.vals[0]

            if (minPwdLength) {
              console.log(`Tamanho mínimo da senha: ${minPwdLength}`)
            }

            if (pwdProperties) {
              const pwdPropertiesInt = Number.parseInt(pwdProperties, 10)
              console.log(`Propriedades da senha (valor bruto): ${pwdPropertiesInt}`)

              // Interpretar propriedades da senha
              const passwordComplexity = !!(pwdPropertiesInt & 1)
              const cantChangePassword = !!(pwdPropertiesInt & 2)
              const passwordNeverExpires = !!(pwdPropertiesInt & 4)
              const passwordEncrypted = !!(pwdPropertiesInt & 8)
              const passwordNoAnonymousChange = !!(pwdPropertiesInt & 16)

              console.log("Interpretação das propriedades:")
              console.log(`- Complexidade de senha obrigatória: ${passwordComplexity ? "Sim" : "Não"}`)
              console.log(`- Usuário não pode alterar senha: ${cantChangePassword ? "Sim" : "Não"}`)
              console.log(`- Senha nunca expira: ${passwordNeverExpires ? "Sim" : "Não"}`)
              console.log(`- Senha armazenada com criptografia reversível: ${passwordEncrypted ? "Sim" : "Não"}`)
              console.log(`- Não permitir alteração anônima: ${passwordNoAnonymousChange ? "Sim" : "Não"}`)

              if (passwordComplexity) {
                console.log("\nRequisitos de complexidade de senha (padrão do Active Directory):")
                console.log("- Não conter o nome da conta do usuário ou partes do nome completo")
                console.log("- Ter pelo menos 6 caracteres")
                console.log("- Conter caracteres de três das seguintes categorias:")
                console.log("  * Letras maiúsculas (A-Z)")
                console.log("  * Letras minúsculas (a-z)")
                console.log("  * Números (0-9)")
                console.log("  * Caracteres especiais (!, $, #, %, etc.)")
              }
            }

            if (pwdHistoryLength) {
              console.log(`\nHistórico de senhas: ${pwdHistoryLength} senhas lembradas`)
              if (Number.parseInt(pwdHistoryLength, 10) > 0) {
                console.log("O usuário não pode reutilizar senhas recentes.")
              }
            }

            if (lockoutThreshold) {
              console.log(`\nLimite de bloqueio: ${lockoutThreshold} tentativas incorretas`)
              if (Number.parseInt(lockoutThreshold, 10) > 0) {
                console.log("A conta será bloqueada após várias tentativas incorretas.")
              }
            }
          })

          res.on("error", (err) => {
            console.error("Erro na resposta LDAP:", err)
          })

          res.on("end", () => {
            if (!policyFound) {
              console.log("\nNenhuma política de senha encontrada diretamente.")
              console.log("Usando requisitos padrão do Active Directory:")
              console.log("- Tamanho mínimo: 7 caracteres")
              console.log("- Complexidade: deve conter caracteres de 3 das 4 categorias")
              console.log("  * Letras maiúsculas (A-Z)")
              console.log("  * Letras minúsculas (a-z)")
              console.log("  * Números (0-9)")
              console.log("  * Caracteres especiais (!, $, #, %, etc.)")
            }

            resolve()
          })
        },
      )
    })

    // Buscar informações sobre o usuário administrador
    console.log("\nVerificando permissões do usuário administrador...")

    const adminDN = config.bindUser
    await new Promise((resolve) => {
      client.search(
        adminDN,
        {
          scope: "base",
          filter: "(objectClass=*)",
          attributes: ["userAccountControl", "memberOf"],
        },
        (err, res) => {
          if (err) {
            console.error("Erro na busca do usuário administrador:", err)
            resolve()
            return
          }

          res.on("searchEntry", (entry) => {
            const attrs = entry.attributes
            const userAccountControl = attrs.find((a) => a.type === "userAccountControl")?.vals[0]
            const memberOf = attrs.find((a) => a.type === "memberOf")?.vals || []

            console.log("\n=== Informações do Usuário Administrador ===")

            if (userAccountControl) {
              const uacInt = Number.parseInt(userAccountControl, 10)
              console.log(`userAccountControl: ${uacInt}`)

              // Interpretar flags
              const disabled = !!(uacInt & 2)
              const passwordCantChange = !!(uacInt & 64)
              const passwordNeverExpires = !!(uacInt & 65536)
              const passwordExpired = !!(uacInt & 8388608)

              console.log("Status da conta:")
              console.log(`- Conta desabilitada: ${disabled ? "Sim" : "Não"}`)
              console.log(`- Não pode alterar senha: ${passwordCantChange ? "Sim" : "Não"}`)
              console.log(`- Senha nunca expira: ${passwordNeverExpires ? "Sim" : "Não"}`)
              console.log(`- Senha expirada: ${passwordExpired ? "Sim" : "Não"}`)
            }

            if (memberOf.length > 0) {
              console.log("\nGrupos do usuário administrador:")
              memberOf.forEach((group) => {
                const match = group.match(/CN=([^,]+)/)
                if (match) {
                  console.log(`- ${match[1]}`)
                } else {
                  console.log(`- ${group}`)
                }
              })

              // Verificar se é membro de grupos administrativos
              const isAdmin = memberOf.some(
                (group) =>
                  group.includes("CN=Domain Admins") ||
                  group.includes("CN=Enterprise Admins") ||
                  group.includes("CN=Administrators"),
              )

              if (isAdmin) {
                console.log("\n✅ O usuário administrador tem privilégios administrativos.")
                console.log("Deve ter permissões para alterar senhas de outros usuários.")
              } else {
                console.log("\n⚠️ O usuário administrador não parece ter privilégios administrativos.")
                console.log("Pode não ter permissões para alterar senhas de outros usuários.")
              }
            }
          })

          res.on("error", (err) => {
            console.error("Erro na resposta LDAP:", err)
          })

          res.on("end", resolve)
        },
      )
    })

    console.log("\n=== Conclusão ===")
    console.log("Ao alterar senhas, certifique-se de que atendem aos requisitos de complexidade.")
    console.log("Senhas recomendadas devem ter:")
    console.log("- Pelo menos 8 caracteres")
    console.log("- Letras maiúsculas e minúsculas")
    console.log("- Números")
    console.log("- Caracteres especiais")
    console.log("Exemplo: 'P@ssw0rd123!'")
  } catch (error) {
    console.error("Erro durante a verificação:", error)
  } finally {
    if (client) {
      try {
        client.unbind()
      } catch (e) {}
    }

    await sequelize.close()
    process.exit()
  }
}

verifyLdapPasswordRequirements()

