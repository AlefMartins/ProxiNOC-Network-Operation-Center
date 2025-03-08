module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.createTable("LdapConfigs", {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        enabled: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        server: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        port: {
          type: Sequelize.INTEGER,
          defaultValue: 389,
        },
        baseDn: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        bindUser: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        bindPassword: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        userFilter: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        userLoginAttribute: {
          type: Sequelize.STRING,
          defaultValue: "sAMAccountName",
        },
        userNameAttribute: {
          type: Sequelize.STRING,
          defaultValue: "displayName",
        },
        userEmailAttribute: {
          type: Sequelize.STRING,
          defaultValue: "mail",
        },
        groupFilter: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        groupNameAttribute: {
          type: Sequelize.STRING,
          defaultValue: "cn",
        },
        groupMemberAttribute: {
          type: Sequelize.STRING,
          defaultValue: "member",
        },
        groupDescriptionAttribute: {
          type: Sequelize.STRING,
          defaultValue: "description",
        },
        lastSync: {
          type: Sequelize.DATE,
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
      await queryInterface.dropTable("LdapConfigs")
    },
  }
  
  