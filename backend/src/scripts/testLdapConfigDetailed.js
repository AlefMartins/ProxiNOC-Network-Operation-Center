const ldap = require("ldapjs")
const { LdapConfig } = require("../models")
const sequelize = require("../config/sequelize")

async function testLdapConfigDetailed() {
  let client = null

  try {
    console.log("Conectando ao banco de dados...")
    await sequelize.authenticate()
    console.log("Conexão estabelecida com sucesso!")

    // Obter configurações LDAP do banco de dados
    const ldapConfig = await LdapConfig.findOne()

    if (!ldapConfig) {
      console.log("Nenhuma configuração LDAP encontrada no banco de dados!")
      return
    }

    console.log("Configurações LDAP encontradas no banco de dados:")
    const configData = ldapConfig.toJSON()
    delete configData.bindPassword // Não exibir a senha por segurança
    console.log(JSON.stringify(configData, null, 2))

    // Construir URL LDAP
    const ldapUrl = `ldap://${ldapConfig.server}:${ldapConfig.port}`
    console.log(`\nURL LDAP: ${ldapUrl}`)
    console.log(`Bind DN: ${ldapConfig.bindUser}`)
    console.log(`Base DN: ${ldapConfig.baseDn}`)

    // Verificar variáveis de ambiente
    console.log("\nVariáveis de ambiente LDAP:")
    console.log(`LDAP_URL: ${process.env.LDAP_URL || "Não definida"}`)
    console.log(`LDAP_BASE_DN: ${process.env.LDAP_BASE_DN || "Não definida"}`)
    console.log(`LDAP_ADMIN_DN: ${process.env.LDAP_ADMIN_DN || "Não definida"}`)
    console.log(`LDAP_ADMIN_PASSWORD: ${process.env.LDAP_ADMIN_PASSWORD ? "******" : "Não definida"}`)

    // Testar conexão LDAP usando dados do banco
    console.log("\nTestando conexão LDAP usando dados do banco de dados...")

    // Criar cliente LDAP
    client = ldap.createClient({
      url: ldapUrl,
      timeout: 5000,
      connectTimeout: 5000,
      tlsOptions: {
        rejectUnauthorized: false,
      },
    })

    // Registrar eventos
    client.on("error", (err) => {
      console.error("Erro na conexão LDAP:", err)
    })

    client.on("connect", () => {
      console.log("Conexão LDAP estabelecida!")
    })

    // Tentar bind
    console.log(`Tentando bind com DN: ${ldapConfig.bindUser}`)

    await new Promise((resolve, reject) => {
      client.bind(ldapConfig.bindUser, ldapConfig.bindPassword, (err) => {
        if (err) {
          console.error("Erro no bind LDAP:", err)
          console.log("\nCódigo de erro:", err.code)
          console.log("Mensagem:", err.message)

          // Analisar erro específico
          if (err.message.includes("AcceptSecurityContext error, data 52e")) {
            console.log("\nERRO 52e: Credenciais inválidas. Verifique o nome de usuário e senha.")
          } else if (err.message.includes("ECONNREFUSED")) {
            console.log(
              "\nERRO ECONNREFUSED: Não foi possível conectar ao servidor LDAP. Verifique se o servidor está acessível e se a porta está correta.",
            )
          } else if (err.message.includes("ETIMEDOUT")) {
            console.log(
              "\nERRO ETIMEDOUT: Tempo limite excedido. Verifique se o servidor está acessível e se a rede está funcionando corretamente.",
            )
          }

          reject(err)
        } else {
          console.log("Bind LDAP bem-sucedido!")
          resolve()
        }
      })
    })

    // Se o bind for bem-sucedido, tentar uma busca simples
    console.log("\nTentando busca LDAP simples...")

    await new Promise((resolve, reject) => {
      client.search(
        ldapConfig.baseDn,
        {
          scope: "sub",
          filter: "(objectClass=*)",
          attributes: ["dn"],
          sizeLimit: 5,
        },
        (err, res) => {
          if (err) {
            console.error("Erro na busca LDAP:", err)
            reject(err)
            return
          }

          let entryCount = 0

          res.on("searchEntry", (entry) => {
            console.log(`Entrada encontrada: ${entry.objectName}`)
            entryCount++
            if (entryCount >= 5) {
              console.log("Limitando a 5 entradas...")
            }
          })

          res.on("error", (err) => {
            console.error("Erro na busca:", err)
            reject(err)
          })

          res.on("end", (result) => {
            console.log(`Busca concluída! Encontradas ${entryCount} entradas.`)
            resolve()
          })
        },
      )
    })

    console.log("\nTeste de configuração LDAP concluído com sucesso!")
  } catch (error) {
    console.error("\nErro no teste de configuração LDAP:", error)

    // Sugestões de solução
    console.log("\nSugestões para resolver o problema:")
    console.log("1. Verifique se o servidor LDAP está acessível (ping no servidor)")
    console.log("2. Verifique se as credenciais (DN e senha) estão corretas")
    console.log("3. Verifique se a conta não está bloqueada ou expirada")
    console.log("4. Verifique se a porta LDAP está correta (geralmente 389 para LDAP e 636 para LDAPS)")
    console.log("5. Execute o script syncLdapWithDatabase.js para sincronizar as configurações")
  } finally {
    if (client) {
      client.unbind()
      console.log("Conexão LDAP fechada.")
    }

    await sequelize.close()
    process.exit()
  }
}

testLdapConfigDetailed()

