const { DataTypes } = require("sequelize")
const sequelize = require("../config/sequelize")

const CommandLog = sequelize.define(
  "CommandLog",
  {
    command: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    output: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("success", "failure", "pending"),
      defaultValue: "pending",
    },
    executionTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Tempo de execução em milissegundos",
    },
  },
  {
    timestamps: true,
  },
)

module.exports = CommandLog

