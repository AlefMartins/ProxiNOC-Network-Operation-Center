module.exports = (sequelize, DataTypes) => {
  const Permission = sequelize.define('Permission', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [2, 50]
      }
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'permissions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    underscored: true
  });

  Permission.associate = (models) => {
    if (models.Group) {
      Permission.belongsToMany(models.Group, {
        through: 'group_permissions',
        foreignKey: 'permission_id',
        otherKey: 'group_id',
        as: 'groups'
      });
    }
  };

  return Permission;
};