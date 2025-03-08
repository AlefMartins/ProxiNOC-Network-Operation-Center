module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.createTable("Groups", {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
        },
        description: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        isLdapGroup: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        permissions: {
          type: Sequelize.JSON,
          allowNull: true,
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
      })
    },
    down: async (queryInterface, Sequelize) => {
      await queryInterface.dropTable("Groups")
    },
  }
  
  