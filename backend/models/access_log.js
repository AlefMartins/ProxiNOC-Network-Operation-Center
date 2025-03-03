module.exports = (sequelize, DataTypes) => {
  const AccessLog = sequelize.define('AccessLog', {
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
      allowNull: true,
      references: {
        model: 'devices',
        key: 'id'
      }
    },
    action: {
      type: DataTypes.ENUM('login', 'logout', 'login_failed', 'device_connect', 'device_disconnect'),
      allowNull: false
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: false
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'access_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    underscored: true
  });

  AccessLog.associate = (models) => {
    if (models.User) {
      AccessLog.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
    
    if (models.Device) {
      AccessLog.belongsTo(models.Device, {
        foreignKey: 'device_id',
        as: 'device'
      });
    }
  };

  return AccessLog;
};