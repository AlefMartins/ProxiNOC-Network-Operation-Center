const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [3, 50]
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        len: [0, 255]
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    auth_type: {
      type: DataTypes.ENUM('local', 'ldap'),
      defaultValue: 'local'
    },
    ldap_dn: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    failed_login_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password && user.auth_type === 'local') {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password') && user.password && user.auth_type === 'local') {
          user.password = await bcrypt.hash(user.password, 10);
        }
      }
    }
  });

  User.associate = (models) => {
    if (models.Group) {
      User.belongsToMany(models.Group, {
        through: 'user_groups',
        foreignKey: 'user_id',
        otherKey: 'group_id',
        as: 'groups'
      });
    }
    
    if (models.AccessLog) {
      User.hasMany(models.AccessLog, {
        foreignKey: 'user_id',
        as: 'accessLogs'
      });
    }
    
    if (models.CommandLog) {
      User.hasMany(models.CommandLog, {
        foreignKey: 'user_id',
        as: 'commandLogs'
      });
    }
    
    if (models.Backup) {
      User.hasMany(models.Backup, {
        foreignKey: 'created_by',
        as: 'backups'
      });
    }
  };

  // Método para verificar a senha
  User.prototype.validatePassword = async function(password) {
    if (this.auth_type === 'ldap') {
      return false; // Usuários LDAP não podem validar senha localmente
    }
    return await bcrypt.compare(password, this.password);
  };

  // Método para obter as permissões do usuário
  User.prototype.getPermissions = async function() {
    try {
      const groups = await this.getGroups({
        include: [{
          model: sequelize.models.Permission,
          as: 'permissions',
          through: { attributes: [] }
        }]
      });

      // Extrair permissões únicas de todos os grupos
      const permissionSet = new Set();
      groups.forEach(group => {
        if (group.permissions) {
          group.permissions.forEach(permission => {
            permissionSet.add(permission.name);
          });
        }
      });

      return Array.from(permissionSet);
    } catch (error) {
      console.error('Erro ao obter permissões:', error);
      return [];
    }
  };

  return User;
};