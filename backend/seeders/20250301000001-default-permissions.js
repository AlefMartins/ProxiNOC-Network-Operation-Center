'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Verificar permissões existentes
    const [existingPermissions] = await queryInterface.sequelize.query(
      `SELECT name FROM permissions;`
    );
    const existingPermissionNames = existingPermissions.map(p => p.name);

    // Permissões padrão
    const defaultPermissions = [
      {
        name: 'admin_access',
        description: 'Acesso à área administrativa',
        created_at: new Date()
      },
      {
        name: 'manage_users',
        description: 'Gerenciar usuários',
        created_at: new Date()
      },
      {
        name: 'manage_groups',
        description: 'Gerenciar grupos',
        created_at: new Date()
      },
      {
        name: 'manage_devices',
        description: 'Gerenciar dispositivos',
        created_at: new Date()
      },
      {
        name: 'access_devices',
        description: 'Acessar dispositivos via SSH/Telnet/Winbox',
        created_at: new Date()
      },
      {
        name: 'view_audit',
        description: 'Visualizar logs de auditoria',
        created_at: new Date()
      },
      {
        name: 'manage_settings',
        description: 'Gerenciar configurações do sistema',
        created_at: new Date()
      },
      {
        name: 'manage_backups',
        description: 'Gerenciar backups do sistema',
        created_at: new Date()
      }
    ];

    // Filtrar para incluir apenas permissões que não existem ainda
    const permissionsToAdd = defaultPermissions.filter(
      permission => !existingPermissionNames.includes(permission.name)
    );

    if (permissionsToAdd.length > 0) {
      await queryInterface.bulkInsert('permissions', permissionsToAdd, {});
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('permissions', null, {});
  }
};