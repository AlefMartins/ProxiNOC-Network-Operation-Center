module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.createTable("EmailConfigs", {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        host: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        port: {
          type: Sequelize.INTEGER,
          defaultValue: 587,
        },
        secure: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        username: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        password: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        fromEmail: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        fromName: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        enabled: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
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
      await queryInterface.dropTable("EmailConfigs")
    },
  }
  
  