const ldap = require("ldapjs")
const { LdapConfig, User, Group, UserGroup } = require("../models")
const bcrypt = require("bcrypt")
const { Op } = require("sequelize")

// Ajustar a função createClient para usar timeouts maiores
const createLdapClient = (config, options = {}) => {
  return ldap.createClient({
    url: `${config.sslEnabled ? "ldaps" : "ldap"}://${config.server}:${config.port}`,
    timeout: options.timeout || 60000, // 60 segundos
    connectTimeout: options.connectTimeout || 30000, // 30 segundos
    idleTimeout: options.idleTimeout || 120000, // 2 minutos
  })
}

/**
 * Testa a conexão com o servidor LDAP
 * @returns {Promise<{success: boolean, message: string}>} - Resultado do teste
 */
exports.testConnection = async () => {
  let client = null

  try {
    const config = await LdapConfig.findOne()

    if (!config || !config.enabled) {
      console.warn("LDAP não está configurado ou habilitado")
      return { success: false, message: "LDAP não está configurado ou habilitado" }
    }

    // Criar cliente com timeouts maiores
    client = createLdapClient(config)

    // Adicionar event handlers para melhor diagnóstico de erros
    client.on("error", (err) => {
      console.error("Erro no cliente LDAP:", err)
    })

    // Tentar autenticar com o servidor LDAP - apenas isso já é suficiente para testar a conexão
    await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Timeout ao conectar ao servidor LDAP"))
      }, 30000) // 30 segundos de timeout

      client.bind(config.bindUser, config.bindPassword, (err) => {
        clearTimeout(timeoutId)

        if (err) {
          console.error("Erro na autenticação LDAP:", err)
          reject(new Error(`Erro na autenticação: ${err.message}`))
        } else {
          console.log("Autenticação LDAP bem-sucedida")
          resolve()
        }
      })
    })

    // Se chegou até aqui, a conexão foi bem-sucedida
    if (client) {
      client.unbind()
    }

    return { success: true, message: "Conexão LDAP testada com sucesso" }
  } catch (error) {
    console.error("Erro ao testar conexão LDAP:", error)

    // Garantir que o cliente seja desconectado em caso de erro
    if (client) {
      try {
        client.unbind()
      } catch (unbindError) {
        console.error("Erro ao desconectar cliente LDAP:", unbindError)
      }
    }

    return { success: false, message: `Erro ao testar conexão: ${error.message}` }
  }
}

/**
 * Busca usuários disponíveis no LDAP para importação
 * @returns {Promise<Array>} - Lista de usuários LDAP
 */
exports.getAvailableUsers = async () => {
  try {
    const config = await LdapConfig.findOne()

    if (!config || !config.enabled) {
      console.warn("LDAP não está configurado ou habilitado")
      return []
    }

    const client = createLdapClient(config)

    // Adicionar event handlers para melhor diagnóstico de erros
    client.on("error", (err) => {
      console.error("Erro no cliente LDAP:", err)
    })

    // Autenticar com o servidor LDAP
    await new Promise((resolve, reject) => {
      client.bind(config.bindUser, config.bindPassword, (err) => {
        if (err) {
          console.error("Erro na autenticação LDAP:", err)
          client.destroy()
          reject(new Error(`Erro na autenticação: ${err.message}`))
        } else {
          console.log("Autenticação LDAP bem-sucedida")
          resolve()
        }
      })
    })

    // Buscar usuários existentes no sistema
    const existingUsers = await User.findAll({
      where: { isLdapUser: true },
      attributes: ["username"],
    })
    const existingUsernames = existingUsers.map((user) => user.username)

    // Buscar grupos existentes no sistema
    const existingGroups = await Group.findAll({
      where: { isLdapGroup: true },
      attributes: ["id", "name", "description"],
    })

    // Mapear nomes de grupos para IDs
    const groupNameToId = {}
    existingGroups.forEach((group) => {
      groupNameToId[group.name] = group.id
    })

    // Usar o filtro original sem modificações
    // Vamos adicionar um filtro adicional para excluir computadores na consulta
    const userFilter = config.userFilter

    console.log("Usando filtro LDAP original:", userFilter)

    // Buscar usuários no LDAP com o filtro original
    const users = await new Promise((resolve, reject) => {
      client.search(
        config.baseDn,
        {
          filter: userFilter,
          scope: "sub",
          attributes: [
            config.userLoginAttribute,
            config.userNameAttribute,
            config.userEmailAttribute,
            "memberOf",
            "objectClass",
          ],
        },
        (err, res) => {
          if (err) {
            console.error("Erro na busca LDAP:", err)
            reject(err)
            return
          }

          const entries = []
          const userPromises = []

          res.on("searchEntry", (entry) => {
            const attrs = entry.attributes
            const username = attrs.find((a) => a.type === config.userLoginAttribute)?.vals[0]

            // Verificar se é um computador (ignorar se for)
            const objectClasses = attrs.find((a) => a.type === "objectClass")?.vals || []
            if (objectClasses.includes("computer")) {
              return // Ignorar computadores
            }

            // Verificar se o usuário já existe no sistema
            if (username && !existingUsernames.includes(username)) {
              const userData = {
                username,
                fullName: attrs.find((a) => a.type === config.userNameAttribute)?.vals[0] || "",
                email: attrs.find((a) => a.type === config.userEmailAttribute)?.vals[0] || "",
                dn: entry.objectName,
                groups: [], // Inicializar array de grupos
                ldapGroups: [], // Grupos do LDAP (nomes)
              }

              entries.push(userData)

              // Adicionar promessa para buscar grupos do usuário
              const userPromise = new Promise((resolveUser, rejectUser) => {
                // Buscar grupos do usuário usando memberOf ou outra estratégia
                // Estratégia 1: Usar memberOf se disponível
                if (attrs.find((a) => a.type === "memberOf")) {
                  const memberOf = attrs.find((a) => a.type === "memberOf").vals || []

                  // Extrair nomes de grupos dos DNs
                  const groupNames = memberOf
                    .map((dn) => {
                      // Extrair CN do DN (ex: CN=GrupoA,OU=Grupos,DC=exemplo,DC=com -> GrupoA)
                      const match = dn.match(/CN=([^,]+)/)
                      return match ? match[1] : null
                    })
                    .filter(Boolean)

                  userData.ldapGroups = groupNames

                  // Mapear para IDs de grupos no sistema
                  userData.groups = groupNames.filter((name) => groupNameToId[name]).map((name) => groupNameToId[name])

                  resolveUser()
                } else {
                  // Estratégia 2: Buscar grupos que têm o usuário como membro
                  client.search(
                    config.baseDn,
                    {
                      filter: `(&${config.groupFilter}(${config.groupMemberAttribute}=*${userData.dn}*))`,
                      scope: "sub",
                      attributes: [config.groupNameAttribute],
                    },
                    (groupErr, groupRes) => {
                      if (groupErr) {
                        console.error(`Erro ao buscar grupos para ${username}:`, groupErr)
                        resolveUser() // Continuar mesmo com erro
                        return
                      }

                      const groupNames = []

                      groupRes.on("searchEntry", (groupEntry) => {
                        const groupName = groupEntry.attributes.find((a) => a.type === config.groupNameAttribute)
                          ?.vals[0]

                        if (groupName) {
                          groupNames.push(groupName)
                        }
                      })

                      groupRes.on("error", (err) => {
                        console.error(`Erro na busca de grupos para ${username}:`, err)
                        resolveUser() // Continuar mesmo com erro
                      })

                      groupRes.on("end", () => {
                        userData.ldapGroups = groupNames

                        // Mapear para IDs de grupos no sistema
                        userData.groups = groupNames
                          .filter((name) => groupNameToId[name])
                          .map((name) => groupNameToId[name])

                        resolveUser()
                      })
                    },
                  )
                }
              })

              userPromises.push(userPromise)
            }
          })

          res.on("error", (err) => {
            console.error("Erro na resposta LDAP:", err)
            reject(err)
          })

          res.on("end", () => {
            // Aguardar todas as promessas de busca de grupos
            Promise.all(userPromises)
              .then(() => resolve(entries))
              .catch((err) => {
                console.error("Erro ao buscar grupos dos usuários:", err)
                resolve(entries) // Retornar usuários mesmo com erro nos grupos
              })
          })
        },
      )
    })

    client.unbind()
    console.log(`Encontrados ${users.length} usuários LDAP disponíveis para importação`)
    return users
  } catch (error) {
    console.error("Erro ao buscar usuários LDAP:", error)
    return []
  }
}

/**
 * Busca grupos disponíveis no LDAP para importação
 * @returns {Promise<Array>} - Lista de grupos LDAP
 */
exports.getAvailableGroups = async () => {
  try {
    const config = await LdapConfig.findOne()

    if (!config || !config.enabled) {
      console.warn("LDAP não está configurado ou habilitado")
      return []
    }

    const client = createLdapClient(config)

    // Adicionar event handlers para melhor diagnóstico de erros
    client.on("error", (err) => {
      console.error("Erro no cliente LDAP:", err)
    })

    // Autenticar com o servidor LDAP
    await new Promise((resolve, reject) => {
      client.bind(config.bindUser, config.bindPassword, (err) => {
        if (err) {
          console.error("Erro na autenticação LDAP:", err)
          client.destroy()
          reject(new Error(`Erro na autenticação: ${err.message}`))
        } else {
          console.log("Autenticação LDAP bem-sucedida")
          resolve()
        }
      })
    })

    // Buscar grupos existentes no sistema
    const existingGroups = await Group.findAll({
      where: { isLdapGroup: true },
      attributes: ["name"],
    })
    const existingGroupNames = existingGroups.map((group) => group.name)

    // Buscar grupos no LDAP
    const groups = await new Promise((resolve, reject) => {
      client.search(
        config.baseDn,
        {
          filter: config.groupFilter,
          scope: "sub",
          attributes: [config.groupNameAttribute, "description", config.groupMemberAttribute],
        },
        (err, res) => {
          if (err) {
            console.error("Erro na busca LDAP:", err)
            reject(err)
            return
          }

          const entries = []

          res.on("searchEntry", (entry) => {
            const attrs = entry.attributes
            const name = attrs.find((a) => a.type === config.groupNameAttribute)?.vals[0]

            // Verificar se o grupo já existe no sistema
            if (name && !existingGroupNames.includes(name)) {
              const members = attrs.find((a) => a.type === config.groupMemberAttribute)?.vals || []
              entries.push({
                name,
                description: attrs.find((a) => a.type === "description")?.vals[0] || "",
                dn: entry.objectName,
                members: members.length || 0, // Garantir que sempre retorne um número
              })
            }
          })

          res.on("error", (err) => {
            console.error("Erro na resposta LDAP:", err)
            reject(err)
          })

          res.on("end", () => {
            resolve(entries)
          })
        },
      )
    })

    client.unbind()
    console.log(`Encontrados ${groups.length} grupos LDAP disponíveis para importação`)
    return groups
  } catch (error) {
    console.error("Erro ao buscar grupos LDAP:", error)
    return []
  }
}

/**
 * Importa usuários selecionados do LDAP
 * @param {Array<string>} usernames - Lista de nomes de usuário para importar
 * @param {Object} userGroups - Mapeamento de nome de usuário para IDs de grupos
 * @returns {Promise<{success: boolean, imported: number, message?: string}>} - Resultado da importação
 */
exports.importUsers = async (usernames, userGroups = {}) => {
  try {
    if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
      return { success: false, imported: 0, message: "Lista de usuários vazia" }
    }

    const config = await LdapConfig.findOne()

    if (!config || !config.enabled) {
      return { success: false, imported: 0, message: "LDAP não está configurado ou habilitado" }
    }

    const client = createLdapClient(config)

    // Adicionar event handlers para melhor diagnóstico de erros
    client.on("error", (err) => {
      console.error("Erro no cliente LDAP:", err)
    })

    // Autenticar com o servidor LDAP
    await new Promise((resolve, reject) => {
      client.bind(config.bindUser, config.bindPassword, (err) => {
        if (err) {
          console.error("Erro na autenticação LDAP:", err)
          client.destroy()
          reject(new Error(`Erro na autenticação: ${err.message}`))
        } else {
          console.log("Autenticação LDAP bem-sucedida")
          resolve()
        }
      })
    })

    // Buscar todos os grupos LDAP existentes no sistema para associação
    const allGroups = await Group.findAll({
      where: { isLdapGroup: true },
      attributes: ["id", "name"],
    })

    // Mapear nomes de grupos LDAP para seus IDs no sistema
    const ldapGroupMap = {}
    allGroups.forEach((group) => {
      ldapGroupMap[group.name] = group.id
    })

    let importedCount = 0
    const errors = []

    // Importar cada usuário
    for (const username of usernames) {
      try {
        // Verificar se o usuário já existe
        const existingUser = await User.findOne({ where: { username } })
        if (existingUser) {
          console.warn(`Usuário ${username} já existe, ignorando`)
          continue
        }

        // Buscar usuário no LDAP
        const userFilter = `(&${config.userFilter}(${config.userLoginAttribute}=${username}))`
        const user = await new Promise((resolve, reject) => {
          client.search(
            config.baseDn,
            {
              filter: userFilter,
              scope: "sub",
              attributes: [config.userLoginAttribute, config.userNameAttribute, config.userEmailAttribute, "memberOf"],
            },
            (err, res) => {
              if (err) {
                console.error(`Erro na busca do usuário ${username}:`, err)
                reject(err)
                return
              }

              let userData = null

              res.on("searchEntry", (entry) => {
                const attrs = entry.attributes
                userData = {
                  username: attrs.find((a) => a.type === config.userLoginAttribute)?.vals[0],
                  fullName: attrs.find((a) => a.type === config.userNameAttribute)?.vals[0] || "",
                  email: attrs.find((a) => a.type === config.userEmailAttribute)?.vals[0] || "",
                  dn: entry.objectName,
                  memberOf: attrs.find((a) => a.type === "memberOf")?.vals || [],
                }
              })

              res.on("error", (err) => {
                console.error(`Erro na resposta LDAP para ${username}:`, err)
                reject(err)
              })

              res.on("end", () => {
                resolve(userData)
              })
            },
          )
        })

        if (!user) {
          console.warn(`Usuário ${username} não encontrado no LDAP`)
          continue
        }

        // Gerar senha aleatória
        const randomPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)

        // Preparar dados do usuário
        const userData = {
          username: user.username,
          fullName: user.fullName || "",
          password: await bcrypt.hash(randomPassword, 10),
          isLdapUser: true,
          isActive: true,
        }

        // Adicionar email APENAS se for uma string válida e não vazia
        if (user.email && typeof user.email === "string" && user.email.trim() !== "") {
          // Verificar se o email parece válido
          if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email.trim())) {
            userData.email = user.email.trim()
          } else {
            console.warn(`Email inválido para usuário ${username}, ignorando campo email`)
          }
        }

        console.log(`Criando usuário LDAP: ${JSON.stringify(userData, null, 2)}`)

        // Criar usuário
        const createdUser = await User.create(userData)

        // Determinar os grupos do usuário
        let userGroupIds = []

        // Verificar se o usuário tem grupos especificados explicitamente na UI
        if (userGroups[username] && Array.isArray(userGroups[username]) && userGroups[username].length > 0) {
          // Usar os grupos especificados na UI
          userGroupIds = userGroups[username]
        } else {
          // Extrair grupos a partir dos atributos memberOf
          if (user.memberOf && user.memberOf.length > 0) {
            // Extrair nomes de grupos dos DNs
            const memberOfGroups = user.memberOf
              .map((dn) => {
                // Extrair CN do DN (ex: CN=GrupoA,OU=Grupos,DC=exemplo,DC=com -> GrupoA)
                const match = dn.match(/CN=([^,]+)/)
                return match ? match[1] : null
              })
              .filter(Boolean)

            // Mapear para IDs de grupos no sistema
            for (const groupName of memberOfGroups) {
              if (ldapGroupMap[groupName]) {
                userGroupIds.push(ldapGroupMap[groupName])
              }
            }
          }
        }

        // Associar usuário aos grupos usando o método setGroups em vez de criar registros diretamente
        if (userGroupIds.length > 0) {
          await createdUser.setGroups(userGroupIds)
          console.log(`Usuário ${username} associado a ${userGroupIds.length} grupos`)
        } else {
          console.log(`Usuário ${username} não foi associado a nenhum grupo`)
        }

        importedCount++
        console.log(`Usuário ${username} importado com sucesso`)
      } catch (error) {
        console.error(`Erro ao importar usuário ${username}:`, error)
        errors.push({ username, error: error.message })
      }
    }

    client.unbind()

    return {
      success: importedCount > 0,
      imported: importedCount,
      errors: errors.length > 0 ? errors : undefined,
      message: importedCount > 0 ? `${importedCount} usuários importados com sucesso` : "Nenhum usuário importado",
    }
  } catch (error) {
    console.error("Erro ao importar usuários LDAP:", error)
    return { success: false, imported: 0, message: `Erro: ${error.message}` }
  }
}

/**
 * Importa grupos selecionados do LDAP
 * @param {Array<string>} groupNames - Lista de nomes de grupos para importar
 * @param {Object} groupTypes - Mapeamento de nome de grupo para tipo de grupo
 * @returns {Promise<{success: boolean, imported: number, message?: string}>} - Resultado da importação
 */
exports.importGroups = async (groupNames, groupTypes = {}) => {
  try {
    if (!groupNames || !Array.isArray(groupNames) || groupNames.length === 0) {
      return { success: false, imported: 0, message: "Lista de grupos vazia" }
    }

    const config = await LdapConfig.findOne()

    if (!config || !config.enabled) {
      return { success: false, imported: 0, message: "LDAP não está configurado ou habilitado" }
    }

    const client = createLdapClient(config)

    // Adicionar event handlers para melhor diagnóstico de erros
    client.on("error", (err) => {
      console.error("Erro no cliente LDAP:", err)
    })

    // Autenticar com o servidor LDAP
    await new Promise((resolve, reject) => {
      client.bind(config.bindUser, config.bindPassword, (err) => {
        if (err) {
          console.error("Erro na autenticação LDAP:", err)
          client.destroy()
          reject(new Error(`Erro na autenticação: ${err.message}`))
        } else {
          console.log("Autenticação LDAP bem-sucedida")
          resolve()
        }
      })
    })

    let importedCount = 0
    const errors = []

    // Importar cada grupo
    for (const groupName of groupNames) {
      try {
        // Verificar se o grupo já existe
        const existingGroup = await Group.findOne({ where: { name: groupName } })
        if (existingGroup) {
          console.warn(`Grupo ${groupName} já existe, ignorando`)
          continue
        }

        // Buscar grupo no LDAP
        const groupFilter = `(&${config.groupFilter}(${config.groupNameAttribute}=${groupName}))`
        const group = await new Promise((resolve, reject) => {
          client.search(
            config.baseDn,
            {
              filter: groupFilter,
              scope: "sub",
              attributes: [config.groupNameAttribute, "description"],
            },
            (err, res) => {
              if (err) {
                console.error(`Erro na busca do grupo ${groupName}:`, err)
                reject(err)
                return
              }

              let groupData = null

              res.on("searchEntry", (entry) => {
                const attrs = entry.attributes
                groupData = {
                  name: attrs.find((a) => a.type === config.groupNameAttribute)?.vals[0],
                  description: attrs.find((a) => a.type === "description")?.vals[0] || "",
                  dn: entry.objectName,
                }
              })

              res.on("error", (err) => {
                console.error(`Erro na resposta LDAP para ${groupName}:`, err)
                reject(err)
              })

              res.on("end", () => {
                resolve(groupData)
              })
            },
          )
        })

        if (!group) {
          console.warn(`Grupo ${groupName} não encontrado no LDAP`)
          continue
        }

        // Determinar o tipo de grupo (usando "dispositivos" como padrão para grupos LDAP)
        const groupType = groupTypes[groupName] || "dispositivos"

        // Criar grupo
        await Group.create({
          name: group.name,
          description: group.description || `Grupo LDAP: ${group.name}`,
          isLdapGroup: true,
          groupType,
          permissions: { dashboard: ["view"] },
        })

        importedCount++
        console.log(`Grupo ${groupName} importado com sucesso`)
      } catch (error) {
        console.error(`Erro ao importar grupo ${groupName}:`, error)
        errors.push({ groupName, error: error.message })
      }
    }

    client.unbind()

    return {
      success: importedCount > 0,
      imported: importedCount,
      errors: errors.length > 0 ? errors : undefined,
      message: importedCount > 0 ? `${importedCount} grupos importados com sucesso` : "Nenhum grupo importado",
    }
  } catch (error) {
    console.error("Erro ao importar grupos LDAP:", error)
    return { success: false, imported: 0, message: `Erro: ${error.message}` }
  }
}

/**
 * Sincroniza usuários e grupos do LDAP
 * @returns {Promise<{success: boolean, added: number, updated: number, groups: number, message?: string}>} - Resultado da sincronização
 */
exports.syncUsers = async () => {
  try {
    const config = await LdapConfig.findOne()

    if (!config || !config.enabled) {
      return { success: false, message: "LDAP não está configurado ou habilitado" }
    }

    // Implementação simplificada da sincronização
    // Em um cenário real, você sincronizaria usuários e grupos

    return {
      success: true,
      added: 0,
      updated: 0,
      groups: 0,
      message: "Sincronização simulada com sucesso",
    }
  } catch (error) {
    console.error("Erro ao sincronizar usuários LDAP:", error)
    return { success: false, message: `Erro: ${error.message}` }
  }
}

/**
 * Sincroniza grupos de um usuário com o AD
 * @param {string} username - Nome de usuário
 * @param {Array<number>} groupIds - IDs dos grupos no sistema
 * @returns {Promise<{success: boolean, message: string}>} - Resultado da sincronização
 */
exports.syncUserGroups = async (username, groupIds) => {
  let client = null
  try {
    // Verificar se o usuário existe
    const user = await User.findOne({
      where: { username, isLdapUser: true },
    })

    if (!user) {
      return { success: false, message: "Usuário LDAP não encontrado" }
    }

    // Buscar grupos LDAP do sistema
    const groups = await Group.findAll({
      where: {
        id: { [Op.in]: groupIds },
        isLdapGroup: true,
      },
    })

    // Se não há grupos LDAP para sincronizar, retornar sucesso
    if (groups.length === 0) {
      console.log(`Nenhum grupo LDAP para sincronizar para o usuário ${username}`)
      return { success: true, message: "Nenhum grupo LDAP para sincronizar" }
    }

    const config = await LdapConfig.findOne()
    if (!config || !config.enabled) {
      return { success: false, message: "LDAP não está configurado ou habilitado" }
    }

    client = createLdapClient(config)

    // Adicionar event handlers para melhor diagnóstico de erros
    client.on("error", (err) => {
      console.error("Erro no cliente LDAP:", err)
    })

    // Autenticar com o servidor LDAP
    await new Promise((resolve, reject) => {
      client.bind(config.bindUser, config.bindPassword, (err) => {
        if (err) {
          console.error("Erro na autenticação LDAP:", err)
          reject(new Error(`Erro na autenticação: ${err.message}`))
        } else {
          console.log("Autenticação LDAP bem-sucedida")
          resolve()
        }
      })
    })

    // Buscar o DN do usuário
    const userDN = await new Promise((resolve, reject) => {
      client.search(
        config.baseDn,
        {
          filter: `(&${config.userFilter}(${config.userLoginAttribute}=${username}))`,
          scope: "sub",
          attributes: ["dn"],
        },
        (err, res) => {
          if (err) {
            console.error(`Erro na busca do usuário ${username}:`, err)
            reject(err)
            return
          }

          let userDN = null

          res.on("searchEntry", (entry) => {
            userDN = entry.objectName
          })

          res.on("error", (err) => {
            console.error(`Erro na resposta LDAP para ${username}:`, err)
            reject(err)
          })

          res.on("end", () => {
            if (!userDN) {
              reject(new Error("Usuário não encontrado no AD"))
            } else {
              resolve(userDN)
            }
          })
        },
      )
    })

    // Buscar grupos atuais do usuário no AD
    const currentGroups = await new Promise((resolve, reject) => {
      client.search(
        config.baseDn,
        {
          filter: `(&${config.groupFilter}(${config.groupMemberAttribute}=*${userDN}*))`,
          scope: "sub",
          attributes: [config.groupNameAttribute, "dn"],
        },
        (err, res) => {
          if (err) {
            console.error(`Erro na busca de grupos para ${username}:`, err)
            reject(err)
            return
          }

          const groups = []

          res.on("searchEntry", (entry) => {
            groups.push({
              name: entry.attributes.find((a) => a.type === config.groupNameAttribute)?.vals[0],
              dn: entry.objectName,
            })
          })

          res.on("error", (err) => {
            console.error(`Erro na resposta LDAP para grupos de ${username}:`, err)
            reject(err)
          })

          res.on("end", () => {
            resolve(groups)
          })
        },
      )
    })

    // Processar alterações de grupos
    const groupsAdded = []
    const groupsRemoved = []

    // Mapear nomes de grupos do sistema para comparação
    const systemGroupNames = groups.map((g) => g.name)

    // Grupos para adicionar (estão no sistema mas não no AD)
    const groupsToAdd = groups.filter((g) => !currentGroups.some((cg) => cg.name === g.name))

    // Grupos para remover (estão no AD mas não foram selecionados no sistema)
    const groupsToRemove = currentGroups.filter((cg) => !systemGroupNames.includes(cg.name))

    console.log(
      `Sincronizando grupos para ${username}: ${groupsToAdd.length} para adicionar, ${groupsToRemove.length} para remover`,
    )

    // Adicionar usuário aos grupos
    for (const group of groupsToAdd) {
      try {
        // Buscar o DN do grupo
        const groupDN = await new Promise((resolve, reject) => {
          client.search(
            config.baseDn,
            {
              filter: `(&${config.groupFilter}(${config.groupNameAttribute}=${group.name}))`,
              scope: "sub",
              attributes: ["dn"],
            },
            (err, res) => {
              if (err) {
                console.error(`Erro na busca do grupo ${group.name}:`, err)
                reject(err)
                return
              }

              let groupDN = null

              res.on("searchEntry", (entry) => {
                groupDN = entry.objectName
              })

              res.on("error", (err) => {
                console.error(`Erro na resposta LDAP para ${group.name}:`, err)
                reject(err)
              })

              res.on("end", () => {
                resolve(groupDN)
              })
            },
          )
        })

        if (groupDN) {
          // Adicionar usuário ao grupo
          const change = new ldap.Change({
            operation: "add",
            modification: {
              [config.groupMemberAttribute]: userDN,
            },
          })

          await new Promise((resolve) => {
            client.modify(groupDN, change, (err) => {
              if (err) {
                // Se o erro for que o membro já existe, não é um erro real
                if (err.code === 68) {
                  // LDAP_ALREADY_EXISTS
                  console.log(`Usuário ${username} já é membro do grupo ${group.name}`)
                } else {
                  console.error(`Erro ao adicionar ${username} ao grupo ${group.name}:`, err)
                }
                resolve()
              } else {
                console.log(`Usuário ${username} adicionado ao grupo ${group.name}`)
                groupsAdded.push(group.name)
                resolve()
              }
            })
          })
        }
      } catch (error) {
        console.error(`Erro ao modificar grupo ${group.name}:`, error)
        // Continuar com o próximo grupo mesmo se houver erro
      }
    }

    // Remover usuário dos grupos
    for (const group of groupsToRemove) {
      try {
        // Remover usuário do grupo
        const change = new ldap.Change({
          operation: "delete",
          modification: {
            [config.groupMemberAttribute]: userDN,
          },
        })

        await new Promise((resolve) => {
          client.modify(group.dn, change, (err) => {
            if (err) {
              // Se o erro for que o membro não existe, não é um erro real
              if (err.code === 32) {
                // LDAP_NO_SUCH_OBJECT
                console.log(`Usuário ${username} não é membro do grupo ${group.name}`)
              } else {
                console.error(`Erro ao remover ${username} do grupo ${group.name}:`, err)
              }
              resolve()
            } else {
              console.log(`Usuário ${username} removido do grupo ${group.name}`)
              groupsRemoved.push(group.name)
              resolve()
            }
          })
        })
      } catch (error) {
        console.error(`Erro ao modificar grupo ${group.name}:`, error)
        // Continuar com o próximo grupo mesmo se houver erro
      }
    }

    // Atualizar grupos do usuário no banco de dados local
    try {
      // Remover associações existentes
      await UserGroup.destroy({ where: { userId: user.id } })

      // Criar novas associações
      if (groupIds.length > 0) {
        const userGroupEntries = groupIds.map((groupId) => ({
          userId: user.id,
          groupId,
        }))

        await UserGroup.bulkCreate(userGroupEntries)
        console.log(`${userGroupEntries.length} grupos associados ao usuário ${user.id} no banco local`)
      }
    } catch (dbError) {
      console.error("Erro ao atualizar grupos no banco de dados local:", dbError)
      // Não interromper o fluxo por causa de erro no banco local
    }

    if (client) {
      client.unbind()
    }

    return {
      success: true,
      message: `Grupos sincronizados: ${groupsAdded.length} adicionados, ${groupsRemoved.length} removidos`,
      groupsAdded,
      groupsRemoved,
    }
  } catch (error) {
    console.error("Erro ao sincronizar grupos do usuário:", error)

    if (client) {
      try {
        client.unbind()
      } catch (unbindError) {
        console.error("Erro ao desconectar cliente LDAP:", unbindError)
      }
    }

    return {
      success: false,
      message: `Erro ao sincronizar grupos: ${error.message}`,
    }
  }
}

/**
 * Altera a senha de um usuário LDAP
 * @param {string} username - Nome de usuário
 * @param {string} oldPassword - Senha atual
 * @param {string} newPassword - Nova senha
 * @returns {Promise<{success: boolean, message: string}>} - Resultado da alteração
 */
exports.changePassword = async (username, oldPassword, newPassword) => {
  try {
    // Verificar se o usuário existe
    const user = await User.findOne({
      where: { username, isLdapUser: true },
    })

    if (!user) {
      return { success: false, message: "Usuário LDAP não encontrado" }
    }

    const config = await LdapConfig.findOne()
    if (!config || !config.enabled) {
      return { success: false, message: "LDAP não está configurado ou habilitado" }
    }

    const client = createLdapClient(config)

    // Buscar o DN do usuário
    let userDN = null
    await new Promise((resolve, reject) => {
      client.search(
        config.baseDn,
        {
          filter: `(&${config.userFilter}(${config.userLoginAttribute}=${username}))`,
          scope: "sub",
          attributes: ["dn"],
        },
        (err, res) => {
          if (err) {
            console.error(`Erro na busca do usuário ${username}:`, err)
            reject(err)
            return
          }

          res.on("searchEntry", (entry) => {
            userDN = entry.objectName
          })

          res.on("error", (err) => {
            console.error(`Erro na resposta LDAP para ${username}:`, err)
            reject(err)
          })

          res.on("end", () => {
            resolve()
          })
        },
      )
    })

    if (!userDN) {
      return { success: false, message: "Usuário não encontrado no AD" }
    }

    // Verificar senha atual
    const isAuthenticated = await new Promise((resolve) => {
      const authClient = createLdapClient(config)

      authClient.bind(userDN, oldPassword, (err) => {
        if (err) {
          console.error(`Erro na autenticação do usuário ${username}:`, err)
          authClient.destroy()
          resolve(false)
        } else {
          authClient.unbind()
          resolve(true)
        }
      })
    })

    if (!isAuthenticated) {
      return { success: false, message: "Senha atual incorreta" }
    }

    // Autenticar com o servidor LDAP usando conta administrativa
    await new Promise((resolve, reject) => {
      client.bind(config.bindUser, config.bindPassword, (err) => {
        if (err) {
          console.error("Erro na autenticação LDAP:", err)
          client.destroy()
          reject(new Error(`Erro na autenticação: ${err.message}`))
        } else {
          console.log("Autenticação LDAP bem-sucedida")
          resolve()
        }
      })
    })

    // Alterar senha do usuário
    const unicodePwd = Buffer.from(`"${newPassword}"`, "utf16le")

    const change = new ldap.Change({
      operation: "replace",
      modification: {
        unicodePwd: unicodePwd,
      },
    })

    const result = await new Promise((resolve) => {
      client.modify(userDN, change, (err) => {
        if (err) {
          console.error(`Erro ao alterar senha do usuário ${username}:`, err)
          resolve({ success: false, message: `Erro ao alterar senha: ${err.message}` })
        } else {
          console.log(`Senha do usuário ${username} alterada com sucesso`)
          resolve({ success: true, message: "Senha alterada com sucesso" })
        }
      })
    })

    client.unbind()
    return result
  } catch (error) {
    console.error("Erro ao alterar senha do usuário:", error)
    return { success: false, message: `Erro: ${error.message}` }
  }
}

/**
 * Altera a senha de um usuário LDAP (por administrador)
 * @param {string} username - Nome de usuário
 * @param {string} newPassword - Nova senha
 * @returns {Promise<{success: boolean, message: string}>} - Resultado da alteração
 */
exports.resetPassword = async (username, newPassword) => {
  try {
    // Verificar se o usuário existe
    const user = await User.findOne({
      where: { username, isLdapUser: true },
    })

    if (!user) {
      return { success: false, message: "Usuário LDAP não encontrado" }
    }

    const config = await LdapConfig.findOne()
    if (!config || !config.enabled) {
      return { success: false, message: "LDAP não está configurado ou habilitado" }
    }

    const client = createLdapClient(config)

    // Autenticar com o servidor LDAP usando conta administrativa
    await new Promise((resolve, reject) => {
      client.bind(config.bindUser, config.bindPassword, (err) => {
        if (err) {
          console.error("Erro na autenticação LDAP:", err)
          client.destroy()
          reject(new Error(`Erro na autenticação: ${err.message}`))
        } else {
          console.log("Autenticação LDAP bem-sucedida")
          resolve()
        }
      })
    })

    // Buscar o DN do usuário
    let userDN = null
    await new Promise((resolve, reject) => {
      client.search(
        config.baseDn,
        {
          filter: `(&${config.userFilter}(${config.userLoginAttribute}=${username}))`,
          scope: "sub",
          attributes: ["dn"],
        },
        (err, res) => {
          if (err) {
            console.error(`Erro na busca do usuário ${username}:`, err)
            reject(err)
            return
          }

          res.on("searchEntry", (entry) => {
            userDN = entry.objectName
          })

          res.on("error", (err) => {
            console.error(`Erro na resposta LDAP para ${username}:`, err)
            reject(err)
          })

          res.on("end", () => {
            resolve()
          })
        },
      )
    })

    if (!userDN) {
      return { success: false, message: "Usuário não encontrado no AD" }
    }

    // Alterar senha do usuário
    const unicodePwd = Buffer.from(`"${newPassword}"`, "utf16le")

    const change = new ldap.Change({
      operation: "replace",
      modification: {
        unicodePwd: unicodePwd,
      },
    })

    const result = await new Promise((resolve) => {
      client.modify(userDN, change, (err) => {
        if (err) {
          console.error(`Erro ao alterar senha do usuário ${username}:`, err)
          resolve({ success: false, message: `Erro ao alterar senha: ${err.message}` })
        } else {
          console.log(`Senha do usuário ${username} alterada com sucesso`)
          resolve({ success: true, message: "Senha alterada com sucesso" })
        }
      })
    })

    client.unbind()
    return result
  } catch (error) {
    console.error("Erro ao alterar senha do usuário:", error)
    return { success: false, message: `Erro: ${error.message}` }
  }
}

/**
 * Autentica um usuário no LDAP
 * @param {string} username - Nome de usuário
 * @param {string} password - Senha
 * @returns {Promise<{success: boolean, user?: {username: string, email?: string, fullName?: string, groups?: string[]}, message?: string}>}
 */
exports.authenticate = async (username, password) => {
  let client = null

  try {
    const config = await LdapConfig.findOne()

    if (!config || !config.enabled) {
      return { success: false, message: "LDAP não está configurado ou habilitado" }
    }

    // Criar um cliente LDAP para a busca inicial
    client = createLdapClient(config)

    // Primeiro, autenticar com a conta administrativa para buscar o DN do usuário
    await new Promise((resolve, reject) => {
      client.bind(config.bindUser, config.bindPassword, (err) => {
        if (err) {
          console.error("Erro na autenticação administrativa LDAP:", err)
          reject(err)
        } else {
          console.log("Autenticação administrativa LDAP bem-sucedida")
          resolve()
        }
      })
    })

    // Buscar o DN do usuário
    let userDN = null
    let userData = null

    try {
      await new Promise((resolve, reject) => {
        client.search(
          config.baseDn,
          {
            filter: `(&${config.userFilter}(${config.userLoginAttribute}=${username}))`,
            scope: "sub",
            attributes: [config.userLoginAttribute, config.userNameAttribute, config.userEmailAttribute, "memberOf"],
          },
          (err, res) => {
            if (err) {
              console.error("Erro na busca LDAP:", err)
              reject(err)
              return
            }

            res.on("searchEntry", (entry) => {
              userDN = entry.objectName
              const attrs = entry.attributes

              userData = {
                username: attrs.find((a) => a.type === config.userLoginAttribute)?.vals[0],
                fullName: attrs.find((a) => a.type === config.userNameAttribute)?.vals[0] || "",
                email: attrs.find((a) => a.type === config.userEmailAttribute)?.vals[0] || "",
                memberOf: attrs.find((a) => a.type === "memberOf")?.vals || [],
              }
            })

            res.on("error", (err) => {
              console.error("Erro na resposta LDAP:", err)
              reject(err)
            })

            res.on("end", () => {
              if (!userDN) {
                reject(new Error("Usuário não encontrado"))
              } else {
                resolve()
              }
            })
          },
        )
      })
    } catch (error) {
      console.error("Erro ao buscar usuário no LDAP:", error)
      if (client) client.unbind()
      return { success: false, message: "Usuário não encontrado" }
    }

    // Fechar o cliente atual
    client.unbind()

    // Criar um novo cliente para a autenticação do usuário
    const authClient = createLdapClient(config)

    // Tentar autenticar com as credenciais fornecidas
    try {
      await new Promise((resolve, reject) => {
        authClient.bind(userDN, password, (err) => {
          if (err) {
            console.error("Erro na autenticação do usuário LDAP:", err)
            authClient.destroy()
            reject(err)
          } else {
            console.log("Autenticação do usuário LDAP bem-sucedida")
            resolve()
          }
        })
      })
    } catch (error) {
      console.error("Falha na autenticação LDAP:", error)
      authClient.unbind()
      return { success: false, message: "Credenciais inválidas" }
    }

    // Se chegou até aqui, a autenticação foi bem sucedida
    // Buscar grupos do usuário
    const groups = []
    if (userData.memberOf && userData.memberOf.length > 0) {
      // Extrair nomes dos grupos dos DNs
      userData.memberOf.forEach((dn) => {
        const match = dn.match(/CN=([^,]+)/)
        if (match) {
          groups.push(match[1])
        }
      })
    }

    authClient.unbind()

    return {
      success: true,
      user: {
        username: userData.username,
        fullName: userData.fullName,
        email: userData.email,
        groups: groups,
      },
    }
  } catch (error) {
    console.error("Erro na autenticação LDAP:", error)
    if (client) {
      try {
        client.unbind()
      } catch (unbindError) {
        console.error("Erro ao desconectar cliente LDAP:", unbindError)
      }
    }
    return { success: false, message: error.message }
  }
}

/**
 * Sincroniza grupos de um usuário no sistema local
 * @param {number} userId - ID do usuário no sistema
 * @param {Array<number>} groupIds - IDs dos grupos no sistema
 * @returns {Promise<{success: boolean, message: string}>} - Resultado da sincronização
 */
exports.syncUserGroupsLocal = async (userId, groupIds) => {
  try {
    // Verificar se o usuário existe
    const user = await User.findByPk(userId)

    if (!user) {
      return { success: false, message: "Usuário não encontrado" }
    }

    // Remover associações existentes
    await UserGroup.destroy({ where: { userId: user.id } })

    // Criar novas associações
    if (groupIds && groupIds.length > 0) {
      const userGroupEntries = groupIds.map((groupId) => ({
        userId: user.id,
        groupId,
      }))

      await UserGroup.bulkCreate(userGroupEntries)
    }

    return {
      success: true,
      message: `Grupos do usuário atualizados com sucesso: ${groupIds.length} grupos associados`,
    }
  } catch (error) {
    console.error("Erro ao sincronizar grupos do usuário:", error)
    return { success: false, message: `Erro: ${error.message}` }
  }
}

