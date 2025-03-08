const bcrypt = require("bcrypt")

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash("admin123", 10)

    return queryInterface.bulkInsert("Users", [
      {
        username: "admin",
        password: hashedPassword,
        email: "admin@proxinoc.com",
        fullName: "Administrador",
        isLdapUser: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: "operador",
        password: await bcrypt.hash("operador123", 10),
        email: "operador@proxinoc.com",
        fullName: "Operador",
        isLdapUser: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("Users", null, {})
  },
}

