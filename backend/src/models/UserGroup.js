const { DataTypes } = require("sequelize")
const sequelize = require("../config/sequelize")

const UserGroup = sequelize.define(
  "UserGroup",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Groups",
        key: "id",
      },
    },
  },
  {
    tableName: "UserGroups",
    timestamps: true,
  },
)

module.exports = UserGroup

