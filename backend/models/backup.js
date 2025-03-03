module.exports = (sequelize, DataTypes) => {
  const Backup = sequelize.define('Backup', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    path: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    size: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    checksum: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('completed', 'failed', 'in_progress'),
      defaultValue: 'in_progress'
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'backups',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    underscored: true
  });

  Backup.associate = (models) => {
    if (models.User) {
      Backup.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
      });
    }
  };

  return Backup;
};