const { DataTypes } = require("sequelize")
const sequelize = require("../config/sequelize")

const Device = sequelize.define("Device", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ip: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIP: true,
    },
  },
  port: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 22,
    validate: {
      min: 1,
      max: 65535,
    },
  },
  manufacturer: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  model: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  sshEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  telnetEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  winboxEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  status: {
    type: DataTypes.ENUM("online", "offline", "maintenance"),
    defaultValue: "offline",
  },
  lastSeen: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  latency: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
})

module.exports = Device

