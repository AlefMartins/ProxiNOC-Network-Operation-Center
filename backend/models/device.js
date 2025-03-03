module.exports = (sequelize, DataTypes) => {
  const Device = sequelize.define('Device', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: false,
      validate: {
        isIP: true
      }
    },
    port: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 22,
      validate: {
        isInt: true,
        min: 1,
        max: 65535
      }
    },
    manufacturer: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    model: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    image_path: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('online', 'offline', 'warning', 'maintenance'),
      defaultValue: 'offline'
    },
    last_ping_timestamp: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_ping_latency: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    ssh_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    telnet_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    winbox_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'devices',
    timestamps: true,
    underscored: true
  });

  Device.associate = (models) => {
    // Verificar se os modelos necessários existem
    if (models.Group) {
      Device.belongsToMany(models.Group, {
        through: 'group_devices',
        foreignKey: 'device_id',
        otherKey: 'group_id',
        as: 'groups'
      });
    }
    
    if (models.AccessLog) {
      Device.hasMany(models.AccessLog, {
        foreignKey: 'device_id',
        as: 'accessLogs'
      });
    }
    
    if (models.CommandLog) {
      Device.hasMany(models.CommandLog, {
        foreignKey: 'device_id',
        as: 'commandLogs'
      });
    }
  };

  return Device;
};