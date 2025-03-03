'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Verificar se o grupo já existe
    const [existingGroups] = await queryInterface.sequelize.query(
      `SELECT id, name FROM groups WHERE name = 'Administrator' LIMIT 1;`
    );

    let adminGroupId;

    // Se o grupo não existe, criar
    if (existingGroups.length === 0) {
      await queryInterface.bulkInsert('groups', [
        {
          name: 'Administrator',
          description: 'Grupo de administradores com acesso completo',
          is_ldap_group: false,
          ldap_group_dn: null,
          created_at: new Date(),
          updated_at: new Date()
        }
      ], {});

      // Obter o ID do grupo recém-criado
      const [groups] = await queryInterface.sequelize.query(
        `SELECT id FROM groups WHERE name = 'Administrator' LIMIT 1;`
      );
      adminGroupId = groups[0].id;
    } else {
      adminGroupId = existingGroups[0].id;
    }

    // Obter todas as permissões
    const [permissions] = await queryInterface.sequelize.query(
      `SELECT id FROM permissions;`
    );

    // Verificar associações existentes
    const [existingAssociations] = await queryInterface.sequelize.query(
      `SELECT permission_id FROM group_permissions WHERE group_id = ${adminGroupId};`
    );
    
    const existingPermissionIds = existingAssociations.map(a => a.permission_id);

    // Criar associações apenas para permissões que ainda não estão associadas
    const groupPermissionsToAdd = permissions
      .filter(permission => !existingPermissionIds.includes(permission.id))
      .map(permission => ({
        group_id: adminGroupId,
        permission_id: permission.id,
        created_at: new Date()
      }));

    if (groupPermissionsToAdd.length > 0) {
      await queryInterface.bulkInsert('group_permissions', groupPermissionsToAdd, {});
    }
  },

  async down (queryInterface, Sequelize) {
    // Obter o ID do grupo Administrator
    const [groups] = await queryInterface.sequelize.query(
      `SELECT id FROM groups WHERE name = 'Administrator' LIMIT 1;`
    );
    
    if (groups.length > 0) {
      const adminGroupId = groups[0].id;

      // Remover todas as associações de permissões
      await queryInterface.bulkDelete('group_permissions', {
        group_id: adminGroupId
      }, {});

      // Remover o grupo Administrator
      await queryInterface.bulkDelete('groups', {
        id: adminGroupId
      }, {});
    }
  }
};