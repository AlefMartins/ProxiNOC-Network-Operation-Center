module.exports = {
    up: async (queryInterface, Sequelize) => {
      return queryInterface.bulkInsert("Groups", [
        {
          name: "Administradores",
          description: "Acesso completo ao sistema",
          isLdapGroup: false,
          permissions: JSON.stringify({
            dashboard: ["view"],
            devices: ["view", "create", "edit", "delete", "connect"],
            audit: ["view", "export"],
            settings: ["view", "edit"],
            users: ["view", "create", "edit", "delete"],
            groups: ["view", "create", "edit", "delete"],
          }),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Operadores",
          description: "Acesso operacional ao sistema",
          isLdapGroup: false,
          permissions: JSON.stringify({
            dashboard: ["view"],
            devices: ["view", "connect"],
            audit: ["view"],
            settings: ["view"],
            users: ["view"],
            groups: ["view"],
          }),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ])
    },
  
    down: async (queryInterface, Sequelize) => {
      return queryInterface.bulkDelete("Groups", null, {})
    },
  }
  
  