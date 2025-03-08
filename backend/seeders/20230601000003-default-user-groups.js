module.exports = {
    up: async (queryInterface, Sequelize) => {
      // Primeiro, obtenha os IDs dos usuários e grupos
      const users = await queryInterface.sequelize.query("SELECT id, username FROM Users", {
        type: queryInterface.sequelize.QueryTypes.SELECT,
      })
  
      const groups = await queryInterface.sequelize.query("SELECT id, name FROM Groups", {
        type: queryInterface.sequelize.QueryTypes.SELECT,
      })
  
      const adminUser = users.find((user) => user.username === "admin")
      const operadorUser = users.find((user) => user.username === "operador")
  
      const adminGroup = groups.find((group) => group.name === "Administradores")
      const operadorGroup = groups.find((group) => group.name === "Operadores")
  
      if (!adminUser || !operadorUser || !adminGroup || !operadorGroup) {
        console.error("Usuários ou grupos não encontrados")
        return
      }
  
      return queryInterface.bulkInsert("UserGroups", [
        {
          userId: adminUser.id,
          groupId: adminGroup.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: operadorUser.id,
          groupId: operadorGroup.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ])
    },
  
    down: async (queryInterface, Sequelize) => {
      return queryInterface.bulkDelete("UserGroups", null, {})
    },
  }
  
  