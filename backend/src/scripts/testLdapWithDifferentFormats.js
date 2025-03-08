const ldap = require("ldapjs")
const { LdapConfig } = require("../models")
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

async function testLdapWithDifferentFormats() {
  let client = null

  try {
    console.log("=== Teste LDAP com Diferentes Formatos de DN ===\n")

    // Conectar ao banco de dados
    await sequelize.authenticate()
    console.log("Conexão com o banco de dados estabelecida com sucesso!")

    // Obter configuração LDAP
    const config = await LdapConfig.findOne()

    if (!config) {
      console.log("Nenhuma configuração LDAP encontrada no banco de dados!")
      return
    }

    console.log("\n=== Configuração LDAP Atual ===")
    console.log(`Servidor: ${config.server}`)
    console.log(`Porta: ${config.port}`)
    console.log(`Base DN: ${config.baseDn}`)
    console.log(`Bind User: ${config.bindUser}`)

    // Perguntar senha para teste
    const password = await question("\nDigite a senha para teste (ou pressione Enter para usar a senha do banco): ")

    // Usar a senha fornecida ou a do banco
    const testPassword = password || config.bindPassword

    if (!testPassword) {
      console.log("Senha não fornecida e não encontrada no banco de dados!")
      return
    }

    // Extrair informações do DN atual
    const cnMatch = config.bindUser.match(/CN=([^,]+)/i)
    const username = cnMatch ? cnMatch[1] : null

    if (!username) {
      console.log("Não foi possível extrair o nome de usuário do DN!")
      return
    }

    console.log(`Nome de usuário extraído: ${username}`)

    // Extrair domínio do Base DN
    const domainParts = config.baseDn
      .split(",")
      .filter((part) => part.startsWith("DC="))
      .map((part) => part.substring(3))
    const domain = domainParts.join(".")

    console.log(`Domínio extraído: ${domain}`)

    // Criar URL LDAP
    const url = `ldap://${config.server}:${config.port}`

    // Testar diferentes formatos de DN
    const formats = [
      {
        name: "DN Original",
        bindDN: config.bindUser,
        description: "O DN conforme armazenado no banco de dados",
      },
      {
        name: "UPN (User Principal Name)",
        bindDN: `${username}@${domain}`,
        description: "Formato de email: usuario@dominio.com",
      },
      {
        name: "sAMAccountName",
        bindDN: username,
        description: "Apenas o nome de usuário sem domínio",
      },
      {
        name: "DN com caminho completo",
        bindDN: `CN=${username},CN=Users,${config.baseDn}`,
        description: "DN com caminho completo incluindo CN=Users",
      },
      {
        name: "DN com caminho alternativo",
        bindDN: `CN=${username},OU=Users,${config.baseDn}`,
        description: "DN com caminho alternativo usando OU=Users",
      },
      {
        name: "DN com domínio\\usuário",
        bindDN: `${domainParts[0]}\\${username}`,
        description: "Formato domínio\\usuário (estilo Windows)",
      },
    ]

    console.log("\n=== Testando Diferentes Formatos de DN ===")

    for (const format of formats) {
      console.log(`\nTestando formato: ${format.name}`)
      console.log(`DN: ${format.bindDN}`)
      console.log(`Descrição: ${format.description}`)

      try {
        // Criar cliente LDAP
        client = ldap.createClient({
          url: url,
          timeout: 5000,
          connectTimeout: 5000,
          tlsOptions: {
            rejectUnauthorized: false,
          },
        })

        // Tentar autenticar
        const result = await new Promise((resolve) => {
          client.bind(format.bindDN, testPassword, (err) => {
            if (err) {
              console.log(`Falha: ${err.message}`)
              resolve(false)
            } else {
              console.log("SUCESSO! Autenticação bem-sucedida com este formato.")
              resolve(true)
            }
          })
        })

        // Se autenticou com sucesso, fazer uma busca simples
        if (result) {
          await new Promise((resolve) => {
            client.search(
              config.baseDn,
              {
                scope: "sub",
                filter: "(objectClass=*)",
                sizeLimit: 1,
              },
              (err, res) => {
                if (err) {
                  console.log(`Busca falhou: ${err.message}`)
                } else {
                  res.on("searchEntry", (entry) => {
                    console.log(`Busca bem-sucedida! Encontrou: ${entry.objectName}`)
                  })

                  res.on("end", () => {
                    console.log("Busca concluída.")
                    resolve()
                  })
                }
              },
            )
          })

          console.log("\n*** FORMATO CORRETO ENCONTRADO! ***")
          console.log(`Use este formato para atualizar a configuração: ${format.bindDN}`)
        }

        // Fechar cliente
        if (client) {
          client.unbind()
          client = null
        }
      } catch (error) {
        console.log(`Erro: ${error.message}`)

        if (client) {
          try {
            client.unbind()
          } catch (e) {}
          client = null
        }
      }
    }

    console.log("\n=== Conclusão ===")
    console.log("Se algum formato funcionou, atualize a configuração LDAP no banco de dados.")
    console.log("Execute o script updateLdapCredentials.js para atualizar o bindUser.")
    console.log("Em seguida, execute syncLdapConfigWithEnv.js para sincronizar as variáveis de ambiente.")
  } catch (error) {
    console.error("Erro durante o teste:", error)
  } finally {
    if (client) {
      try {
        client.unbind()
      } catch (e) {}
    }

    rl.close()
    await sequelize.close()
    process.exit()
  }
}

testLdapWithDifferentFormats()

