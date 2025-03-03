module.exports = (sequelize, DataTypes) => {
    const SystemSetting = sequelize.define('SystemSetting', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      setting_key: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      setting_value: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true
      }
    }, {
      tableName: 'system_settings',
      timestamps: true,
      underscored: true
    });
  
    return SystemSetting;
  };