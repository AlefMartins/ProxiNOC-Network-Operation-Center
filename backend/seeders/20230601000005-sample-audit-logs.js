module.exports = {
    up: async (queryInterface, Sequelize) => {
      // Obter IDs dos usuários
      const users = await queryInterface.sequelize.query("SELECT id, username FROM Users", {
        type: queryInterface.sequelize.QueryTypes.SELECT,
      })
  
      const adminUser = users.find((user) => user.username === "admin")
      const operadorUser = users.find((user) => user.username === "operador")
  
      if (!adminUser || !operadorUser) {
        console.error("Usuários não encontrados")
        return
      }
  
      // Criar logs de auditoria
      const now = new Date()
      const logs = [
        {
          userId: adminUser.id,
          username: adminUser.username,
          action: "login",
          target: "Sistema",
          details: "Login bem-sucedido",
          ip: "192.168.1.100",
          timestamp: new Date(now.getTime() - 3600000), // 1 hora atrás
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: adminUser.id,
          username: adminUser.username,
          action: "access",
          target: "Router-Core-01",
          details: "Acesso SSH",
          ip: "192.168.1.100",
          timestamp: new Date(now.getTime() - 3500000), // 58 minutos atrás
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: adminUser.id,
          username: adminUser.username,
          action: "command",
          target: "Router-Core-01",
          details: "show interfaces",
          ip: "192.168.1.100",
          timestamp: new Date(now.getTime() - 3400000), // 56 minutos atrás
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: operadorUser.id,
          username: operadorUser.username,
          action: "login",
          target: "Sistema",
          details: "Login bem-sucedido",
          ip: "192.168.1.101",
          timestamp: new Date(now.getTime() - 1800000), // 30 minutos atrás
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: operadorUser.id,
          username: operadorUser.username,
          action: "access",
          target: "Switch-Access-01",
          details: "Acesso Winbox",
          ip: "192.168.1.101",
          timestamp: new Date(now.getTime() - 1700000), // 28 minutos atrás
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]
  
      return queryInterface.bulkInsert("AuditLogs", logs)
    },
  
    down: async (queryInterface, Sequelize) => {
      return queryInterface.bulkDelete("AuditLogs", null, {})
    },
  }
  
  