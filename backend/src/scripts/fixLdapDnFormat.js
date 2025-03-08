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

async function fixLdapDnFormat() {
  try {
    console.log("=== Correção de Formato DN LDAP ===\n")

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

    // Extrair informações do DN atual
    const cnMatch = config.bindUser.match(/CN=([^,]+)/i)
    const username = cnMatch ? cnMatch[1] : null

    if (!username) {
      console.log("Não foi possível extrair o nome de usuário do DN!")
      return
    }

    console.log(`\nNome de usuário extraído: ${username}`)

    // Extrair domínio do Base DN
    const domainParts = config.baseDn
      .split(",")
      .filter((part) => part.startsWith("DC="))
      .map((part) => part.substring(3))
    const domain = domainParts.join(".")

    console.log(`Domínio extraído: ${domain}`)

    // Gerar formatos alternativos de DN
    const alternativeFormats = [
      {
        name: "DN Original",
        bindDN: config.bindUser,
      },
      {
        name: "UPN (User Principal Name)",
        bindDN: `${username}@${domain}`,
      },
      {
        name: "DN com caminho completo",
        bindDN: `CN=${username},CN=Users,${config.baseDn}`,
      },
      {
        name: "DN com caminho alternativo",
        bindDN: `CN=${username},OU=Users,${config.baseDn}`,
      },
      {
        name: "DN com domínio\\usuário",
        bindDN: `${domainParts[0]}\\${username}`,
      },
    ]

    console.log("\n=== Formatos Alternativos de DN ===")
    alternativeFormats.forEach((format, index) => {
      console.log(`${index + 1}. ${format.name}: ${format.bindDN}`)
    })

    // Perguntar qual formato usar
    const formatChoice = await question("\nEscolha o número do formato a ser usado (ou 0 para inserir manualmente): ")
    const formatIndex = Number.parseInt(formatChoice, 10)

    let newBindDN = ""

    if (formatIndex === 0) {
      newBindDN = await question("Digite o novo Bind DN manualmente: ")
    } else if (formatIndex > 0 && formatIndex <= alternativeFormats.length) {
      newBindDN = alternativeFormats[formatIndex - 1].bindDN
    } else {
      console.log("Escolha inválida!")
      return
    }

    if (!newBindDN) {
      console.log("Bind DN não pode ser vazio!")
      return
    }

    // Confirmar alteração
    console.log(`\nNovo Bind DN: ${newBindDN}`)
    const confirm = await question("Confirmar alteração? (s/n): ")

    if (confirm.toLowerCase() !== "s") {
      console.log("Operação cancelada pelo usuário.")
      return
    }

    // Atualizar configuração
    await config.update({ bindUser: newBindDN })

    console.log("\nBind DN atualizado com sucesso!")
    console.log("\nPróximos passos:")
    console.log("1. Execute o script syncLdapConfigWithEnv.js para sincronizar as variáveis de ambiente")
    console.log("2. Reinicie o servidor")
    console.log("3. Teste a conexão LDAP novamente")
  } catch (error) {
    console.error("Erro durante a correção:", error)
  } finally {
    rl.close()
    await sequelize.close()
    process.exit()
  }
}

fixLdapDnFormat()

