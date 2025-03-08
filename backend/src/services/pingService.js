const ping = require("ping")

/**
 * Realiza ping em um host e retorna o resultado
 * @param {string} host - Endereço IP ou hostname
 * @returns {Promise<{alive: boolean, time: number}>} - Resultado do ping
 */
exports.pingHost = async (host) => {
  try {
    const result = await ping.promise.probe(host, {
      timeout: 2,
      extra: ["-c", "3"],
    })

    return {
      alive: result.alive,
      time: result.time,
      output: result.output,
    }
  } catch (error) {
    console.error(`Erro ao realizar ping para ${host}:`, error)
    return {
      alive: false,
      time: 0,
      error: error.message,
    }
  }
}

/**
 * Realiza ping em múltiplos hosts e retorna os resultados
 * @param {string[]} hosts - Lista de endereços IP ou hostnames
 * @returns {Promise<Array<{host: string, alive: boolean, time: number}>>} - Resultados dos pings
 */
exports.pingMultipleHosts = async (hosts) => {
  const results = []

  for (const host of hosts) {
    try {
      const result = await this.pingHost(host)
      results.push({
        host,
        ...result,
      })
    } catch (error) {
      results.push({
        host,
        alive: false,
        time: 0,
        error: error.message,
      })
    }
  }

  return results
}

