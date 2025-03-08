const ldap = require("ldapjs")
const { LdapConfig } = require("../models")
const sequelize = require("../config/sequelize")
const fs = require("fs")
const path = require("path")
const dotenv = require("dotenv")

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") })

async function diagnoseLdapIssue() {
  let client = null

  try {
    console.log("=== Diagnóstico de Problemas LDAP ===\n")

    // Passo 1: Verificar variáveis de ambiente
    console.log("PASSO 1: Verificando variáveis de ambiente...")
    console.log(`LDAP_URL: ${process.env.LDAP_URL || "Não definida"}`)
    console.log(`LDAP_BASE_DN: ${process.env.LDAP_BASE_DN || "Não definida"}`)
    console.log(`LDAP_ADMIN_DN: ${process.env.LDAP_ADMIN_DN || "Não definida"}`)
    console.log(`LDAP_ADMIN_PASSWORD: ${process.env.LDAP_ADMIN_PASSWORD ? "Definida" : "Não definida"}`)

    // Passo 2: Verificar configuração no banco de dados
    console.log("\nPASSO 2: Verificando configuração no banco de dados...")
    await sequelize.authenticate()
    console.log("Conexão com o banco de dados estabelecida com sucesso!")

    const config = await LdapConfig.findOne()

    if (!config) {
      console.log("Nenhuma configuração LDAP encontrada no banco de dados!")
      return
    }

    console.log(`Servidor: ${config.server}`)
    console.log(`Porta: ${config.port}`)
    console.log(`Base DN: ${config.baseDn}`)
    console.log(`Bind User: ${config.bindUser}`)
    console.log(`Enabled: ${config.enabled ? "Sim" : "Não"}`)

    // Passo 3: Verificar formato do DN
    console.log("\nPASSO 3: Verificando formato do DN...")
    const bindDN = config.bindUser

    // Verificar se o DN está no formato correto
    const dnParts = bindDN.split(",")
    const dnValid = dnParts.every((part) => part.includes("="))

    if (!dnValid) {
      console.log("ALERTA: O formato do DN parece estar incorreto!")
      console.log("O DN deve estar no formato: CN=Usuario,CN=Users,DC=dominio,DC=com")
    } else {
      console.log("O formato do DN parece estar correto.")

      // Verificar se o DN começa com CN=
      if (!bindDN.startsWith("CN=")) {
        console.log("ALERTA: O DN deve geralmente começar com 'CN=' para usuários.")
      }

      // Verificar se o DN contém o contêiner de usuários
      if (!bindDN.includes("CN=Users") && !bindDN.includes("OU=Users")) {
        console.log("ALERTA: O DN não contém 'CN=Users' ou 'OU=Users'. Verifique se o caminho está correto.")
      }
    }

    // Passo 4: Tentar conexão com diferentes opções
    console.log("\nPASSO 4: Tentando conexão LDAP com diferentes opções...")

    // Opção 1: Usar configuração do banco de dados
    console.log("\nOpção 1: Usando configuração do banco de dados...")
    const url = `ldap://${config.server}:${config.port}`
    console.log(`URL: ${url}`)
    console.log(`Bind DN: ${config.bindUser}`)

    try {
      client = ldap.createClient({
        url: url,
        timeout: 10000,
        connectTimeout: 10000,
        tlsOptions: {
          rejectUnauthorized: false,
        },
      })

      await new Promise((resolve, reject) => {
        client.bind(config.bindUser, config.bindPassword, (err) => {
          if (err) {
            console.log("Falha na autenticação com configuração do banco de dados.")
            console.log(`Erro: ${err.message}`)

            if (err.message.includes("data 52e")) {
              console.log("Erro 52e: Credenciais inválidas.")
              console.log("Possíveis causas:")
              console.log("1. Senha incorreta")
              console.log("2. DN incorreto")
              console.log("3. Conta bloqueada ou expirada")
              console.log("4. Restrições de segurança no servidor LDAP")
            }

            reject(err)
          } else {
            console.log("Autenticação bem-sucedida com configuração do banco de dados!")
            resolve()
          }
        })
      })

      if (client) {
        client.unbind()
        client = null
      }
    } catch (error) {
      // Continuar com as próximas opções
      if (client) {
        try {
          client.unbind()
        } catch (e) {}
        client = null
      }
    }

    // Opção 2: Usar variáveis de ambiente
    if (process.env.LDAP_URL && process.env.LDAP_ADMIN_DN && process.env.LDAP_ADMIN_PASSWORD) {
      console.log("\nOpção 2: Usando variáveis de ambiente...")
      console.log(`URL: ${process.env.LDAP_URL}`)
      console.log(`Bind DN: ${process.env.LDAP_ADMIN_DN}`)

      try {
        client = ldap.createClient({
          url: process.env.LDAP_URL,
          timeout: 10000,
          connectTimeout: 10000,
          tlsOptions: {
            rejectUnauthorized: false,
          },
        })

        await new Promise((resolve, reject) => {
          client.bind(process.env.LDAP_ADMIN_DN, process.env.LDAP_ADMIN_PASSWORD, (err) => {
            if (err) {
              console.log("Falha na autenticação com variáveis de ambiente.")
              console.log(`Erro: ${err.message}`)
              reject(err)
            } else {
              console.log("Autenticação bem-sucedida com variáveis de ambiente!")
              resolve()
            }
          })
        })

        if (client) {
          client.unbind()
          client = null
        }
      } catch (error) {
        // Continuar com as próximas opções
        if (client) {
          try {
            client.unbind()
          } catch (e) {}
          client = null
        }
      }
    } else {
      console.log("\nOpção 2: Variáveis de ambiente incompletas, pulando...")
    }

    // Opção 3: Tentar com DN simplificado
    console.log("\nOpção 3: Tentando com DN simplificado...")

    // Extrair o nome de usuário do DN
    const cnMatch = config.bindUser.match(/CN=([^,]+)/i)
    if (cnMatch) {
      const username = cnMatch[1]
      console.log(`Nome de usuário extraído: ${username}`)

      // Tentar com sAMAccountName
      try {
        client = ldap.createClient({
          url: url,
          timeout: 10000,
          connectTimeout: 10000,
          tlsOptions: {
            rejectUnauthorized: false,
          },
        })

        await new Promise((resolve, reject) => {
          client.bind(
            `${username}@${config.baseDn.replace(/DC=/gi, "").replace(/,/g, ".")}`,
            config.bindPassword,
            (err) => {
              if (err) {
                console.log("Falha na autenticação com formato UPN (user@domain).")
                console.log(`Erro: ${err.message}`)
                reject(err)
              } else {
                console.log("Autenticação bem-sucedida com formato UPN!")
                console.log(`Formato usado: ${username}@${config.baseDn.replace(/DC=/gi, "").replace(/,/g, ".")}`)
                resolve()
              }
            },
          )
        })

        if (client) {
          client.unbind()
          client = null
        }
      } catch (error) {
        // Continuar com as próximas opções
        if (client) {
          try {
            client.unbind()
          } catch (e) {}
          client = null
        }
      }
    }

    // Passo 5: Verificar se o servidor LDAP está acessível
    console.log("\nPASSO 5: Verificando se o servidor LDAP está acessível...")
    const { exec } = require("child_process")

    await new Promise((resolve) => {
      exec(`ping -c 1 ${config.server}`, (error, stdout, stderr) => {
        if (error) {
          console.log(`Não foi possível pingar o servidor LDAP: ${config.server}`)
          console.log("Isso pode indicar problemas de rede ou firewall.")
        } else {
          console.log(`Servidor LDAP ${config.server} está acessível via ping.`)
          console.log(stdout.split("\n")[0])
        }
        resolve()
      })
    })

    // Passo 6: Verificar porta LDAP
    console.log("\nPASSO 6: Verificando porta LDAP...")
    const net = require("net")

    await new Promise((resolve) => {
      const socket = new net.Socket()
      const timeout = 5000

      socket.setTimeout(timeout)

      socket.on("connect", () => {
        console.log(`Porta ${config.port} está aberta no servidor ${config.server}.`)
        socket.destroy()
        resolve()
      })

      socket.on("timeout", () => {
        console.log(`Timeout ao conectar na porta ${config.port} do servidor ${config.server}.`)
        socket.destroy()
        resolve()
      })

      socket.on("error", (err) => {
        console.log(`Não foi possível conectar na porta ${config.port} do servidor ${config.server}.`)
        console.log(`Erro: ${err.message}`)
        resolve()
      })

      socket.connect(config.port, config.server)
    })

    // Passo 7: Verificar se há discrepância entre banco de dados e variáveis de ambiente
    console.log("\nPASSO 7: Verificando discrepâncias entre banco de dados e variáveis de ambiente...")

    if (process.env.LDAP_URL) {
      const envUrl = process.env.LDAP_URL
      const dbUrl = `ldap://${config.server}:${config.port}`

      if (envUrl !== dbUrl) {
        console.log("ALERTA: URL LDAP diferente entre variáveis de ambiente e banco de dados!")
        console.log(`Ambiente: ${envUrl}`)
        console.log(`Banco de dados: ${dbUrl}`)
      } else {
        console.log("URL LDAP consistente entre variáveis de ambiente e banco de dados.")
      }
    }

    if (process.env.LDAP_ADMIN_DN && process.env.LDAP_ADMIN_DN !== config.bindUser) {
      console.log("ALERTA: Bind DN diferente entre variáveis de ambiente e banco de dados!")
      console.log(`Ambiente: ${process.env.LDAP_ADMIN_DN}`)
      console.log(`Banco de dados: ${config.bindUser}`)
    } else if (process.env.LDAP_ADMIN_DN) {
      console.log("Bind DN consistente entre variáveis de ambiente e banco de dados.")
    }

    if (process.env.LDAP_BASE_DN && process.env.LDAP_BASE_DN !== config.baseDn) {
      console.log("ALERTA: Base DN diferente entre variáveis de ambiente e banco de dados!")
      console.log(`Ambiente: ${process.env.LDAP_BASE_DN}`)
      console.log(`Banco de dados: ${config.baseDn}`)
    } else if (process.env.LDAP_BASE_DN) {
      console.log("Base DN consistente entre variáveis de ambiente e banco de dados.")
    }

    // Passo 8: Verificar se a senha contém caracteres especiais
    console.log("\nPASSO 8: Verificando se a senha contém caracteres especiais...")

    if (config.bindPassword) {
      const hasSpecialChars = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(config.bindPassword)
      if (hasSpecialChars) {
        console.log("ALERTA: A senha contém caracteres especiais.")
        console.log("Isso pode causar problemas se não estiver corretamente codificada.")
        console.log("Considere atualizar a senha para uma sem caracteres especiais para teste.")
      } else {
        console.log("A senha não contém caracteres especiais.")
      }
    }

    // Conclusão
    console.log("\n=== Conclusão do Diagnóstico ===")
    console.log("Verifique as mensagens acima para identificar possíveis problemas.")
    console.log("\nSugestões de solução:")
    console.log("1. Verifique se o formato do DN está correto")
    console.log("2. Confirme se a conta LDAP não está bloqueada ou expirada")
    console.log("3. Verifique se há restrições de segurança no servidor LDAP")
    console.log("4. Sincronize as configurações do banco de dados com as variáveis de ambiente")
    console.log("5. Tente usar um formato de DN alternativo (UPN: usuario@dominio)")
    console.log("6. Verifique se o servidor LDAP está acessível e se a porta está correta")
  } catch (error) {
    console.error("\nErro durante o diagnóstico:", error)
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

diagnoseLdapIssue()

