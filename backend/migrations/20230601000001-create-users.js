module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.createTable("Users", {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        username: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
        },
        password: {
          type: Sequelize.STRING,
          allowNull: true, // Pode ser nulo para usuários LDAP
        },
        email: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
        },
        fullName: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        isLdapUser: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        isActive: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
        lastLogin: {
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
      await queryInterface.dropTable("Users")
    },
  }
  
  