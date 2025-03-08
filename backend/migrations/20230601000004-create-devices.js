module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.createTable("Devices", {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        ip: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        port: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 22,
        },
        manufacturer: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        model: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        sshEnabled: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
        telnetEnabled: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        winboxEnabled: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        status: {
          type: Sequelize.ENUM("online", "offline", "maintenance"),
          defaultValue: "offline",
        },
        lastSeen: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        latency: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
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
      await queryInterface.dropTable("Devices")
    },
  }
  
  