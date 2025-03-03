'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tacacs_config', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      server_ip: {
        type: Sequelize.STRING(45),
        allowNull: false
      },
      server_port: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 49
      },
      secret_key: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      authentication_type: {
        type: Sequelize.ENUM('pap', 'chap', 'ms-chap'),
        defaultValue: 'pap'
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
    await queryInterface.dropTable('tacacs_config');
  }
};