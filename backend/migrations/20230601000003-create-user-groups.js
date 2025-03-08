module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.createTable("UserGroups", {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "Users",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        groupId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "Groups",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
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
  
      // Adiciona índice único para evitar duplicatas
      await queryInterface.addIndex("UserGroups", ["userId", "groupId"], {
        unique: true,
        name: "user_group_unique",
      })
    },
    down: async (queryInterface, Sequelize) => {
      await queryInterface.dropTable("UserGroups")
    },
  }
  
  