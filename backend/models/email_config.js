module.exports = (sequelize, DataTypes) => {
    const EmailConfig = sequelize.define('EmailConfig', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      smtp_host: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      smtp_port: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 587
      },
      smtp_secure: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      smtp_user: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      smtp_password: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      from_email: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      from_name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    }, {
      tableName: 'email_config',
      timestamps: true,
      underscored: true
    });
  
    return EmailConfig;
  };