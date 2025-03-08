const ldap = require("ldapjs")
const fs = require("fs")
const path = require("path")

async function testLdapConfig() {
  try {
    console.log("Testando configuração LDAP...")

    // Configurações LDAP
    const config = {
      url: process.env.LDAP_URL || "ldap://100.66.128.78:389",
      baseDN: process.env.LDAP_BASE_DN || "DC=proxinoc,DC=local",
      adminDN: process.env.LDAP_ADMIN_DN || "CN=Administrator,CN=Users,DC=proxinoc,DC=local",
      adminPassword: process.env.LDAP_ADMIN_PASSWORD || "Proxinoc@2023",
      tlsOptions: {
        rejectUnauthorized: false,
      },
    }

    console.log("Configurações LDAP atuais:")
    console.log(JSON.stringify(config, null, 2))

    // Tentar conexão LDAP
    console.log("\nTentando conexão LDAP...")
    const client = ldap.createClient({
      url: config.url,
      tlsOptions: config.tlsOptions,
    })

    // Testar bind
    await new Promise((resolve, reject) => {
      client.bind(config.adminDN, config.adminPassword, (err) => {
        if (err) {
          console.error("Erro no bind LDAP:", err)
          reject(err)
        } else {
          console.log("Bind LDAP bem-sucedido!")
          resolve()
        }
      })
    })

    // Testar busca
    await new Promise((resolve, reject) => {
      client.search(
        config.baseDN,
        {
          scope: "sub",
          filter: "(objectClass=*)",
        },
        (err, res) => {
          if (err) {
            console.error("Erro na busca LDAP:", err)
            reject(err)
            return
          }

          res.on("searchEntry", (entry) => {
            console.log("Entrada encontrada:", entry.objectName)
          })

          res.on("error", (err) => {
            console.error("Erro na busca:", err)
            reject(err)
          })

          res.on("end", (result) => {
            console.log("Busca concluída!")
            resolve()
          })
        },
      )
    })

    // Se chegou até aqui, a conexão está funcionando
    console.log("\nConexão LDAP testada com sucesso!")

    // Verificar arquivo de configuração LDAP
    const ldapServicePath = path.join(__dirname, "..", "services", "ldapService.js")
    console.log("\nVerificando arquivo de configuração LDAP:", ldapServicePath)

    if (fs.existsSync(ldapServicePath)) {
      let content = fs.readFileSync(ldapServicePath, "utf8")

      // Fazer backup do arquivo original
      const backupPath = `${ldapServicePath}.backup-${Date.now()}`
      fs.writeFileSync(backupPath, content)
      console.log("Backup criado em:", backupPath)

      // Atualizar configurações no arquivo
      content = content.replace(/url:.*?,/, `url: process.env.LDAP_URL || "${config.url}",`)
      content = content.replace(/baseDN:.*?,/, `baseDN: process.env.LDAP_BASE_DN || "${config.baseDN}",`)
      content = content.replace(/adminDN:.*?,/, `adminDN: process.env.LDAP_ADMIN_DN || "${config.adminDN}",`)
      content = content.replace(
        /adminPassword:.*?,/,
        `adminPassword: process.env.LDAP_ADMIN_PASSWORD || "${config.adminPassword}",`,
      )

      // Adicionar opções TLS
      if (!content.includes("tlsOptions")) {
        content = content.replace(
          /config: {/,
          `config: {
    tlsOptions: {
      rejectUnauthorized: false,
    },`,
        )
      }

      // Salvar alterações
      fs.writeFileSync(ldapServicePath, content)
      console.log("Arquivo de configuração LDAP atualizado!")
    }

    console.log("\nTeste de configuração LDAP concluído!")
  } catch (error) {
    console.error("\nErro no teste de configuração LDAP:", error)
  } finally {
    process.exit()
  }
}

testLdapConfig()

