const { DataTypes } = require("sequelize")
const sequelize = require("../config/sequelize")

const Group = sequelize.define("Group", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isLdapGroup: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  groupType: {
    type: DataTypes.STRING,
    defaultValue: "sistema",
    allowNull: true,
  },
  permissions: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue("permissions")
      if (!rawValue) return {}

      try {
        return JSON.parse(rawValue)
      } catch (e) {
        console.error("Erro ao analisar permissões:", e)
        return {}
      }
    },
    set(value) {
      if (value === null || value === undefined) {
        this.setDataValue("permissions", null)
      } else {
        this.setDataValue("permissions", JSON.stringify(value))
      }
    },
  },
})

module.exports = Group

