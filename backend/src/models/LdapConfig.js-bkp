const { DataTypes } = require("sequelize")
const sequelize = require("../config/sequelize")

const LdapConfig = sequelize.define("LdapConfig", {
  enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  server: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  port: {
    type: DataTypes.INTEGER,
    defaultValue: 389,
  },
  baseDn: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  bindUser: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  bindPassword: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  userFilter: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  userLoginAttribute: {
    type: DataTypes.STRING,
    defaultValue: "sAMAccountName",
  },
  userNameAttribute: {
    type: DataTypes.STRING,
    defaultValue: "displayName",
  },
  userEmailAttribute: {
    type: DataTypes.STRING,
    defaultValue: "mail",
  },
  groupFilter: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  groupNameAttribute: {
    type: DataTypes.STRING,
    defaultValue: "cn",
  },
  groupMemberAttribute: {
    type: DataTypes.STRING,
    defaultValue: "member",
  },
  groupDescriptionAttribute: {
    type: DataTypes.STRING,
    defaultValue: "description",
  },
  lastSync: {
    type: DataTypes.DATE,
    allowNull: true,
  },
})

module.exports = LdapConfig

