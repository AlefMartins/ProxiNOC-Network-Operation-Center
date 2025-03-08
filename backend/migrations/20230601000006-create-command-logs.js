module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.createTable("CommandLogs", {
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
        deviceId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: "Devices",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        },
        command: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        output: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        protocol: {
          type: Sequelize.ENUM("ssh", "telnet", "winbox"),
          defaultValue: "ssh",
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
      await queryInterface.dropTable("CommandLogs")
    },
  }
  
  