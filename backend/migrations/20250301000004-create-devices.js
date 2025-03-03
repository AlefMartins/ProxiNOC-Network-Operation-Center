'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('devices', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: false
      },
      port: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 22
      },
      manufacturer: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      model: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      image_path: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('online', 'offline', 'warning', 'maintenance'),
        defaultValue: 'offline'
      },
      last_ping_timestamp: {
        type: Sequelize.DATE,
        allowNull: true
      },
      last_ping_latency: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      ssh_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      telnet_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      winbox_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      description: {
        type: Sequelize.TEXT,
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
    await queryInterface.dropTable('devices');
  }
};