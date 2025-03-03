module.exports = (sequelize, DataTypes) => {
    const EmailTemplate = sequelize.define('EmailTemplate', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      subject: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: false
      }
    }, {
      tableName: 'email_templates',
      timestamps: true,
      underscored: true
    });
  
    return EmailTemplate;
  };