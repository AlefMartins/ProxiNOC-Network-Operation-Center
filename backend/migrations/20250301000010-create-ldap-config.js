'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ldap_config', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      server_url: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      bind_dn: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      bind_password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      search_base: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      user_search_filter: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: '(objectClass=person)'
      },
      group_search_filter: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: '(objectClass=group)'
      },
      user_username_attribute: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'sAMAccountName'
      },
      user_email_attribute: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'mail'
      },
      user_fullname_attribute: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'displayName'
      },
      group_name_attribute: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'cn'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      sync_interval: {
        type: Sequelize.INTEGER,
        defaultValue: 60
      },
      last_sync: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ldap_config');
  }
};