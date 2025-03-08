const readline = require("readline")
const { LdapConfig } = require("../models")
const sequelize = require("../config/sequelize")

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

async function updateLdapConfigInDatabase() {
  try {
    console.log("Conectando ao banco de dados...")
    await sequelize.authenticate()
    console.log("Conexão estabelecida com sucesso!")

    // Obter configurações LDAP do banco de dados
    let ldapConfig = await LdapConfig.findOne()

    if (!ldapConfig) {
      console.log("Nenhuma configuração LDAP encontrada. Criando nova configuração...")
      ldapConfig = await LdapConfig.create({
        enabled: false,
        server: "",
        port: 389,
        baseDn: "",
        bindUser: "",
        bindPassword: "",
        userFilter: "(&(objectClass=user)(objectCategory=person)(!userAccountControl:1.2.840.113556.1.4.803:=2))",
        userLoginAttribute: "sAMAccountName",
        userNameAttribute: "displayName",
        userEmailAttribute: "mail",
        groupFilter: "(&(objectClass=group))",
        groupNameAttribute: "cn",
        groupMemberAttribute: "member",
        groupDescriptionAttribute: "description",
      })
    }

    console.log("\nConfigurações LDAP atuais no banco de dados:")
    const currentConfig = ldapConfig.toJSON()
    delete currentConfig.bindPassword // Não exibir a senha por segurança
    console.log(JSON.stringify(currentConfig, null, 2))

    console.log("\nAtualizando configurações LDAP no banco de dados...")
    console.log("(Deixe em branco para manter o valor atual)")

    // Perguntar novas configurações
    const server = await question(`Servidor LDAP [${ldapConfig.server}]: `)
    const port = await question(`Porta LDAP [${ldapConfig.port}]: `)
    const baseDn = await question(`Base DN [${ldapConfig.baseDn}]: `)
    const bindUser = await question(`Bind User (DN completo) [${ldapConfig.bindUser}]: `)
    const bindPassword = await question(`Bind Password [********]: `)
    const userDn = await question(`User DN [${ldapConfig.userDn || `CN=Users,${ldapConfig.baseDn}`}]: `)
    const groupDn = await question(`Group DN [${ldapConfig.groupDn || `CN=Groups,${ldapConfig.baseDn}`}]: `)

    // Atualizar configurações
    const updates = {}
    if (server) updates.server = server
    if (port) updates.port = Number.parseInt(port, 10)
    if (baseDn) updates.baseDn = baseDn
    if (bindUser) updates.bindUser = bindUser
    if (bindPassword) updates.bindPassword = bindPassword
    if (userDn) updates.userDn = userDn
    if (groupDn) updates.groupDn = groupDn

    // Perguntar se deseja habilitar LDAP
    const enableLdap = await question(`Habilitar LDAP? (s/n) [${ldapConfig.enabled ? "s" : "n"}]: `)
    if (enableLdap.toLowerCase() === "s") updates.enabled = true
    if (enableLdap.toLowerCase() === "n") updates.enabled = false

    // Atualizar no banco de dados
    await ldapConfig.update(updates)
    console.log("\nConfigurações LDAP atualizadas com sucesso no banco de dados!")

    console.log("\nPróximos passos:")
    console.log(
      "1. Execute o script syncLdapWithDatabase.js para sincronizar as configurações com as variáveis de ambiente",
    )
    console.log("2. Reinicie o servidor para aplicar as alterações")
    console.log("3. Teste a conexão LDAP com o comando: node src/scripts/testLdapConfigDetailed.js")
  } catch (error) {
    console.error("Erro:", error)
  } finally {
    rl.close()
    await sequelize.close()
    process.exit()
  }
}

updateLdapConfigInDatabase()

