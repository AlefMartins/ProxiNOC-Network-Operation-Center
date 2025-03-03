'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('email_config', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      smtp_host: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      smtp_port: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 587
      },
      smtp_secure: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      smtp_user: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      smtp_password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      from_email: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      from_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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
    await queryInterface.dropTable('email_config');
  }
};