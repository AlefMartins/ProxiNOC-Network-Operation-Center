const { DataTypes } = require("sequelize")
const sequelize = require("../config/sequelize")
const bcrypt = require("bcrypt") // Alterado de bcryptjs para bcrypt

const User = sequelize.define(
  "User",
  {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true, // Pode ser nulo para usuários LDAP
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false, // Não permitir null no banco de dados
      defaultValue: "", // Valor padrão vazio
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isLdapUser: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    hooks: {
      beforeCreate: async (user) => {
        if (user.password && !user.isLdapUser) {
          user.password = await bcrypt.hash(user.password, 10)
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password") && !user.isLdapUser) {
          user.password = await bcrypt.hash(user.password, 10)
        }
      },
    },
  },
)

module.exports = User

