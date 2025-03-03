module.exports = (sequelize, DataTypes) => {
  const LdapConfig = sequelize.define('LdapConfig', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    server_url: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    bind_dn: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    bind_password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    search_base: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    user_search_filter: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: '(objectClass=person)'
    },
    group_search_filter: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: '(objectClass=group)'
    },
    user_username_attribute: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'sAMAccountName'
    },
    user_email_attribute: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'mail'
    },
    user_fullname_attribute: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'displayName'
    },
    group_name_attribute: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'cn'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    sync_interval: {
      type: DataTypes.INTEGER,
      defaultValue: 60
    },
    last_sync: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'ldap_config',
    timestamps: true,
    underscored: true
  });

  return LdapConfig;
};