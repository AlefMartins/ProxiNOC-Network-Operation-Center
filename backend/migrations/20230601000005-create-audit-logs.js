module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.createTable("AuditLogs", {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: "Users",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        },
        username: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        action: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        target: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        details: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        ip: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        timestamp: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
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
      await queryInterface.dropTable("AuditLogs")
    },
  }
  
  