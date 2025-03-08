const { DataTypes } = require("sequelize")
const sequelize = require("../config/sequelize")

const EmailConfig = sequelize.define(
  "EmailConfig",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    host: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    port: {
      type: DataTypes.INTEGER,
      defaultValue: 587,
    },
    secure: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fromEmail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fromName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "EmailConfigs",
    timestamps: true,
  },
)

module.exports = EmailConfig

