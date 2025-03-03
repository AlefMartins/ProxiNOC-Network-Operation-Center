module.exports = (sequelize, DataTypes) => {
    const TacacsConfig = sequelize.define('TacacsConfig', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      server_ip: {
        type: DataTypes.STRING(45),
        allowNull: false
      },
      server_port: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 49
      },
      secret_key: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      authentication_type: {
        type: DataTypes.ENUM('pap', 'chap', 'ms-chap'),
        defaultValue: 'pap'
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    }, {
      tableName: 'tacacs_config',
      timestamps: true,
      underscored: true
    });
  
    return TacacsConfig;
  };