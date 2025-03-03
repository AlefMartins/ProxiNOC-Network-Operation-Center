module.exports = (sequelize, DataTypes) => {
  const CommandLog = sequelize.define('CommandLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    device_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'devices',
        key: 'id'
      }
    },
    session_id: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    command: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    output: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'command_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    underscored: true
  });

  CommandLog.associate = (models) => {
    if (models.User) {
      CommandLog.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
    
    if (models.Device) {
      CommandLog.belongsTo(models.Device, {
        foreignKey: 'device_id',
        as: 'device'
      });
    }
  };

  return CommandLog;
};