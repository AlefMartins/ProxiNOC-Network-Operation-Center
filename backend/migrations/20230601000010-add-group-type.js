module.exports = {
    up: async (queryInterface, Sequelize) => {
      // Verificar se a coluna já existe
      const tableInfo = await queryInterface.describeTable("Groups")
  
      if (!tableInfo.groupType) {
        await queryInterface.addColumn("Groups", "groupType", {
          type: Sequelize.STRING,
          defaultValue: "system",
          allowNull: true,
        })
      }
    },
  
    down: async (queryInterface, Sequelize) => {
      await queryInterface.removeColumn("Groups", "groupType")
    },
  }
  
  