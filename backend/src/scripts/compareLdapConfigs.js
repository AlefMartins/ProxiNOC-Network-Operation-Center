const { LdapConfig } = require("../models")
const sequelize = require("../config/sequelize")
const fs = require("fs")
const path = require("path")
const dotenv = require("dotenv")

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") })

async function compareLdapConfigs() {
  try {
    console.log("=== Comparação de Configurações LDAP ===\n")

    // Conectar ao banco de dados
    await sequelize.authenticate()
    console.log("Conexão com o banco de dados estabelecida com sucesso!")

    // Obter configuração do banco de dados
    const config = await LdapConfig.findOne()

    if (!config) {
      console.log("Nenhuma configuração LDAP encontrada no banco de dados!")
      return
    }

    // Extrair configurações do banco de dados
    const dbConfig = {
      url: `ldap://${config.server}:${config.port}`,
      baseDn: config.baseDn,
      bindUser: config.bindUser,
      bindPassword: config.bindPassword ? "********" : null,
      userFilter: config.userFilter,
      userLoginAttribute: config.userLoginAttribute,
      userNameAttribute: config.userNameAttribute,
      userEmailAttribute: config.userEmailAttribute,
      groupFilter: config.groupFilter,
      groupNameAttribute: config.groupNameAttribute,
      groupMemberAttribute: config.groupMemberAttribute,
      enabled: config.enabled,
    }

    // Extrair configurações das variáveis de ambiente
    const envConfig = {
      url: process.env.LDAP_URL,
      baseDn: process.env.LDAP_BASE_DN,
      bindUser: process.env.LDAP_ADMIN_DN,
      bindPassword: process.env.LDAP_ADMIN_PASSWORD ? "********" : null,
      userDn: process.env.LDAP_USER_DN,
      groupDn: process.env.LDAP_GROUP_DN,
      searchFilter: process.env.LDAP_SEARCH_FILTER,
      groupSearchFilter: process.env.LDAP_GROUP_SEARCH_FILTER,
      groupMemberAttribute: process.env.LDAP_GROUP_MEMBER_ATTRIBUTE,
      connectionTimeout: process.env.LDAP_CONNECTION_TIMEOUT,
      operationTimeout: process.env.LDAP_OPERATION_TIMEOUT,
    }

    // Verificar configuração no arquivo ldapService.js
    const ldapServicePath = path.join(__dirname, "..", "services", "ldapService.js")
    let serviceConfig = {}

    if (fs.existsSync(ldapServicePath)) {
      const serviceContent = fs.readFileSync(ldapServicePath, "utf8")

      // Extrair configurações do arquivo de serviço usando regex
      const urlMatch = serviceContent.match(/url:\s*['"]([^'"]+)['"]/)
      const baseDNMatch = serviceContent.match(/baseDN:\s*['"]([^'"]+)['"]/)
      const adminDNMatch = serviceContent.match(/adminDN:\s*['"]([^'"]+)['"]/)
      const userDNMatch = serviceContent.match(/userDN:\s*['"]([^'"]+)['"]/)
      const groupDNMatch = serviceContent.match(/groupDN:\s*['"]([^'"]+)['"]/)

      serviceConfig = {
        url: urlMatch ? urlMatch[1] : null,
        baseDN: baseDNMatch ? baseDNMatch[1] : null,
        adminDN: adminDNMatch ? adminDNMatch[1] : null,
        userDN: userDNMatch ? userDNMatch[1] : null,
        groupDN: groupDNMatch ? groupDNMatch[1] : null,
      }
    }

    // Exibir comparação
    console.log("\n=== Configuração no Banco de Dados ===")
    console.log(JSON.stringify(dbConfig, null, 2))

    console.log("\n=== Configuração nas Variáveis de Ambiente ===")
    console.log(JSON.stringify(envConfig, null, 2))

    console.log("\n=== Configuração no Arquivo ldapService.js ===")
    console.log(JSON.stringify(serviceConfig, null, 2))

    // Verificar discrepâncias
    console.log("\n=== Discrepâncias Encontradas ===")
    let discrepanciesFound = false

    // Comparar URL
    if (envConfig.url && envConfig.url !== dbConfig.url) {
      console.log(`URL LDAP diferente: Banco=${dbConfig.url}, Env=${envConfig.url}`)
      discrepanciesFound = true
    }

    // Comparar Base DN
    if (envConfig.baseDn && envConfig.baseDn !== dbConfig.baseDn) {
      console.log(`Base DN diferente: Banco=${dbConfig.baseDn}, Env=${envConfig.baseDn}`)
      discrepanciesFound = true
    }

    // Comparar Bind User
    if (envConfig.bindUser && envConfig.bindUser !== dbConfig.bindUser) {
      console.log(`Bind User diferente: Banco=${dbConfig.bindUser}, Env=${envConfig.bindUser}`)
      discrepanciesFound = true
    }

    // Comparar com o arquivo de serviço
    if (serviceConfig.url && serviceConfig.url !== dbConfig.url && serviceConfig.url !== envConfig.url) {
      console.log(`URL LDAP diferente no arquivo de serviço: ${serviceConfig.url}`)
      discrepanciesFound = true
    }

    if (serviceConfig.baseDN && serviceConfig.baseDN !== dbConfig.baseDn && serviceConfig.baseDN !== envConfig.baseDn) {
      console.log(`Base DN diferente no arquivo de serviço: ${serviceConfig.baseDN}`)
      discrepanciesFound = true
    }

    if (
      serviceConfig.adminDN &&
      serviceConfig.adminDN !== dbConfig.bindUser &&
      serviceConfig.adminDN !== envConfig.bindUser
    ) {
      console.log(`Bind User diferente no arquivo de serviço: ${serviceConfig.adminDN}`)
      discrepanciesFound = true
    }

    if (!discrepanciesFound) {
      console.log("Nenhuma discrepância significativa encontrada entre as configurações.")
    }

    // Sugestões
    console.log("\n=== Sugestões ===")
    console.log("1. Execute o script syncLdapConfigWithEnv.js para sincronizar as configurações")
    console.log("2. Verifique se o formato do DN está correto")
    console.log("3. Confirme se as credenciais estão corretas no Active Directory")
    console.log("4. Reinicie o servidor após fazer alterações nas configurações")
  } catch (error) {
    console.error("Erro durante a comparação:", error)
  } finally {
    await sequelize.close()
    process.exit()
  }
}

compareLdapConfigs()

