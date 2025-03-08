const { DataTypes } = require("sequelize")
const sequelize = require("../config/sequelize")

const SystemSetting = sequelize.define("SystemSetting", {
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
})

module.exports = SystemSetting

