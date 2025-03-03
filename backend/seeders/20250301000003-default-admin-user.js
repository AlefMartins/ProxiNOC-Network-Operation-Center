'use strict';
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Verificar se o usuário admin já existe
    const [existingUsers] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE username = 'admin' LIMIT 1;`
    );

    let adminUserId;

    // Se o usuário não existe, criar
    if (existingUsers.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await queryInterface.bulkInsert('users', [
        {
          username: 'admin',
          password: hashedPassword,
          email: 'admin@example.com',
          full_name: 'Administrator',
          auth_type: 'local',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ], {});

      // Obter o ID do usuário recém-criado
      const [users] = await queryInterface.sequelize.query(
        `SELECT id FROM users WHERE username = 'admin' LIMIT 1;`
      );
      adminUserId = users[0].id;
    } else {
      adminUserId = existingUsers[0].id;
    }

    // Obter o ID do grupo Administrator
    const [groups] = await queryInterface.sequelize.query(
      `SELECT id FROM groups WHERE name = 'Administrator' LIMIT 1;`
    );
    
    if (groups.length === 0) {
      console.log('Grupo Administrator não encontrado. Verifique se o seeder de grupos foi executado.');
      return;
    }
    
    const adminGroupId = groups[0].id;

    // Verificar se o usuário já está no grupo
    const [existingUserGroups] = await queryInterface.sequelize.query(
      `SELECT * FROM user_groups WHERE user_id = ${adminUserId} AND group_id = ${adminGroupId} LIMIT 1;`
    );

    // Adicionar o usuário admin ao grupo Administrator apenas se ainda não estiver associado
    if (existingUserGroups.length === 0) {
      await queryInterface.bulkInsert('user_groups', [
        {
          user_id: adminUserId,
          group_id: adminGroupId,
          created_at: new Date(),
          updated_at: new Date()
        }
      ], {});
    }
  },

  async down (queryInterface, Sequelize) {
    // Obter o ID do usuário admin
    const [users] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE username = 'admin' LIMIT 1;`
    );
    
    if (users.length > 0) {
      const adminUserId = users[0].id;

      // Remover as associações do usuário com grupos
      await queryInterface.bulkDelete('user_groups', {
        user_id: adminUserId
      }, {});

      // Remover o usuário admin
      await queryInterface.bulkDelete('users', {
        id: adminUserId
      }, {});
    }
  }
};