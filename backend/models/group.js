module.exports = (sequelize, DataTypes) => {
  const Group = sequelize.define('Group', {
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
    },
    is_ldap_group: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    ldap_group_dn: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'groups',
    timestamps: true,
    underscored: true
  });

  Group.associate = (models) => {
    if (models.User) {
      Group.belongsToMany(models.User, {
        through: 'user_groups',
        foreignKey: 'group_id',
        otherKey: 'user_id',
        as: 'users'
      });
    }
    
    if (models.Permission) {
      Group.belongsToMany(models.Permission, {
        through: 'group_permissions',
        foreignKey: 'group_id',
        otherKey: 'permission_id',
        as: 'permissions'
      });
    }
    
    if (models.Device) {
      Group.belongsToMany(models.Device, {
        through: 'group_devices',
        foreignKey: 'group_id',
        otherKey: 'device_id',
        as: 'devices'
      });
    }
  };

  return Group;
};