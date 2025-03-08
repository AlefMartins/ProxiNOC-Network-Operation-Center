const fs = require("fs")
const path = require("path")
const { LdapConfig } = require("../models")
const sequelize = require("../config/sequelize")

async function syncLdapWithDatabase() {
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

    // Preparar variáveis de ambiente
    const envVars = {
      LDAP_URL: ldapUrl,
      LDAP_BASE_DN: ldapConfig.baseDn,
      LDAP_USER_DN: ldapConfig.userDn || `CN=Users,${ldapConfig.baseDn}`,
      LDAP_GROUP_DN: ldapConfig.groupDn || `CN=Groups,${ldapConfig.baseDn}`,
      LDAP_ADMIN_DN: ldapConfig.bindUser,
      LDAP_ADMIN_PASSWORD: ldapConfig.bindPassword,
      LDAP_SEARCH_FILTER: ldapConfig.userFilter || "(&(objectClass=user)(sAMAccountName={{username}}))",
      LDAP_GROUP_SEARCH_FILTER: ldapConfig.groupFilter || "(&(objectClass=group)(cn={{groupname}}))",
      LDAP_GROUP_MEMBER_ATTRIBUTE: ldapConfig.groupMemberAttribute || "member",
      LDAP_CONNECTION_TIMEOUT: "5000",
      LDAP_OPERATION_TIMEOUT: "5000",
    }

    console.log("\nVariáveis de ambiente a serem atualizadas:")
    const envVarsDisplay = { ...envVars }
    delete envVarsDisplay.LDAP_ADMIN_PASSWORD // Não exibir a senha
    console.log(JSON.stringify(envVarsDisplay, null, 2))

    // Atualizar arquivo .env
    const envPath = path.join(__dirname, "..", "..", ".env")
    let envContent = ""

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf8")
      console.log("\nArquivo .env encontrado. Atualizando variáveis...")
    } else {
      console.log("\nArquivo .env não encontrado. Criando novo arquivo...")
    }

    // Atualizar ou adicionar cada variável
    Object.entries(envVars).forEach(([key, value]) => {
      if (!value) return

      const regex = new RegExp(`^${key}=.*$`, "m")
      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, `${key}=${value}`)
      } else {
        envContent += `\n${key}=${value}`
      }
    })

    // Salvar arquivo .env
    fs.writeFileSync(envPath, envContent)
    console.log("Arquivo .env atualizado com sucesso!")

    // Atualizar arquivo ldapService.js
    console.log("\nAtualizando arquivo ldapService.js...")
    const ldapServicePath = path.join(__dirname, "..", "services", "ldapService.js")

    if (fs.existsSync(ldapServicePath)) {
      let serviceContent = fs.readFileSync(ldapServicePath, "utf8")

      // Fazer backup
      fs.writeFileSync(`${ldapServicePath}.backup-${Date.now()}`, serviceContent)

      // Atualizar configurações
      serviceContent = serviceContent.replace(/url:.*?,/, `url: process.env.LDAP_URL || "${ldapUrl}",`)

      serviceContent = serviceContent.replace(
        /baseDN:.*?,/,
        `baseDN: process.env.LDAP_BASE_DN || "${ldapConfig.baseDn}",`,
      )

      serviceContent = serviceContent.replace(
        /userDN:.*?,/,
        `userDN: process.env.LDAP_USER_DN || "${ldapConfig.userDn || `CN=Users,${ldapConfig.baseDn}`}",`,
      )

      serviceContent = serviceContent.replace(
        /groupDN:.*?,/,
        `groupDN: process.env.LDAP_GROUP_DN || "${ldapConfig.groupDn || `CN=Groups,${ldapConfig.baseDn}`}",`,
      )

      serviceContent = serviceContent.replace(
        /adminDN:.*?,/,
        `adminDN: process.env.LDAP_ADMIN_DN || "${ldapConfig.bindUser}",`,
      )

      serviceContent = serviceContent.replace(
        /adminPassword:.*?,/,
        `adminPassword: process.env.LDAP_ADMIN_PASSWORD || "${ldapConfig.bindPassword}",`,
      )

      serviceContent = serviceContent.replace(
        /searchFilter:.*?,/,
        `searchFilter: process.env.LDAP_SEARCH_FILTER || "${ldapConfig.userFilter || "(&(objectClass=user)(sAMAccountName={{username}}))"}", `,
      )

      serviceContent = serviceContent.replace(
        /groupSearchFilter:.*?,/,
        `groupSearchFilter: process.env.LDAP_GROUP_SEARCH_FILTER || "${ldapConfig.groupFilter || "(&(objectClass=group)(cn={{groupname}}))"}", `,
      )

      serviceContent = serviceContent.replace(
        /groupMemberAttribute:.*?,/,
        `groupMemberAttribute: process.env.LDAP_GROUP_MEMBER_ATTRIBUTE || "${ldapConfig.groupMemberAttribute || "member"}", `,
      )

      // Adicionar opções TLS se não existirem
      if (!serviceContent.includes("tlsOptions")) {
        serviceContent = serviceContent.replace(
          /config: {/,
          `config: {
    tlsOptions: {
      rejectUnauthorized: false,
    },`,
        )
      }

      // Salvar alterações
      fs.writeFileSync(ldapServicePath, serviceContent)
      console.log("Arquivo ldapService.js atualizado com sucesso!")
    } else {
      console.log("Arquivo ldapService.js não encontrado!")
    }

    console.log("\nSincronização concluída com sucesso!")
    console.log("\nPróximos passos:")
    console.log("1. Reinicie o servidor para aplicar as alterações")
    console.log("2. Teste a conexão LDAP com o comando: node src/scripts/testLdapConfig.js")
  } catch (error) {
    console.error("Erro:", error)
  } finally {
    await sequelize.close()
    process.exit()
  }
}

syncLdapWithDatabase()

