const fs = require("fs")
const path = require("path")

function fixPasswordServiceComplete() {
  try {
    const passwordServicePath = path.join(__dirname, "..", "services", "passwordService.js")
    console.log(`Verificando arquivo: ${passwordServicePath}`)

    if (!fs.existsSync(passwordServicePath)) {
      console.error(`Arquivo não encontrado: ${passwordServicePath}`)
      return
    }

    // Ler o conteúdo atual do arquivo
    const content = fs.readFileSync(passwordServicePath, "utf8")

    // Fazer backup do arquivo original
    const backupPath = `${passwordServicePath}.backup-${Date.now()}`
    fs.writeFileSync(backupPath, content)
    console.log(`Backup criado em: ${backupPath}`)

    // Criar um novo conteúdo para o arquivo
    const newContent = `const bcrypt = require('bcrypt');
const { User } = require('../models');
const ldapService = require('./ldapService');
const sequelize = require('../config/sequelize');

/**
 * Serviço para gerenciamento de senhas
 */
const passwordService = {
  /**
   * Altera a senha do usuário logado
   * @param {number} userId - ID do usuário
   * @param {string} newPassword - Nova senha
   * @returns {Promise<Object>} Resultado da operação
   */
  async changePassword(userId, newPassword) {
    try {
      // Buscar usuário
      const user = await User.findByPk(userId);
      
      if (!user) {
        return {
          success: false,
          message: "Usuário não encontrado",
        };
      }
      
      console.log(\`Alterando senha para usuário \${user.username} (LDAP: \${user.isLdapUser})\`);
      
      // Verificar se é usuário LDAP
      if (user.isLdapUser) {
        console.log(\`Usuário \${user.username} é LDAP, alterando senha no LDAP...\`);
        
        // Alterar senha no LDAP
        const ldapResult = await ldapService.changePasswordLoggedUser(user.username, newPassword);
        
        if (!ldapResult.success) {
          console.error(\`Erro ao alterar senha no LDAP para \${user.username}: \${ldapResult.message}\`);
          return ldapResult;
        }
        
        console.log(\`Senha alterada com sucesso no LDAP para \${user.username}\`);
        return ldapResult;
      }
      
      // Se não for LDAP, alterar senha localmente
      console.log(\`Alterando senha local para \${user.username}\`);
      
      try {
        // Gerar hash da senha usando bcrypt
        console.log(\`Gerando hash da senha para \${user.username}\`);
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        console.log(\`Hash gerado: \${hashedPassword.substring(0, 20)}...\`);
        
        // Atualizar diretamente no banco de dados usando uma query SQL
        console.log(\`Atualizando senha no banco de dados para \${user.username}\`);
        await sequelize.query(
          \`UPDATE Users SET password = ? WHERE id = ?\`,
          {
            replacements: [hashedPassword, userId],
            type: sequelize.QueryTypes.UPDATE
          }
        );
        
        // Verificar se a senha foi atualizada corretamente
        const updatedUser = await User.findByPk(userId);
        console.log(\`Senha atualizada: \${updatedUser.password.substring(0, 20)}...\`);
        
        // Verificar se a nova senha funciona
        console.log(\`Verificando se a nova senha funciona para \${user.username}\`);
        const passwordMatch = await bcrypt.compare(newPassword, updatedUser.password);
        console.log(\`Resultado da verificação: \${passwordMatch}\`);
        
        if (!passwordMatch) {
          console.error(\`ERRO: A nova senha não funciona para \${user.username}!\`);
          
          // Tentar uma abordagem alternativa
          console.log(\`Tentando abordagem alternativa para \${user.username}...\`);
          const alternativeHash = await bcrypt.hash(newPassword, 10);
          
          // Verificar se o hash alternativo funciona
          const alternativeMatch = await bcrypt.compare(newPassword, alternativeHash);
          
          if (!alternativeMatch) {
            console.error(\`ERRO: Problema com a biblioteca bcrypt!\`);
            return {
              success: false,
              message: "Erro ao verificar a nova senha",
            };
          }
          
          // Usar o hash alternativo
          console.log(\`Usando hash alternativo para \${user.username}\`);
          await sequelize.query(
            \`UPDATE Users SET password = ? WHERE id = ?\`,
            {
              replacements: [alternativeHash, userId],
              type: sequelize.QueryTypes.UPDATE
            }
          );
          
          console.log(\`Senha atualizada com hash alternativo para \${user.username}\`);
        }
        
        console.log(\`Senha alterada com sucesso para \${user.username}\`);
        return {
          success: true,
          message: "Senha alterada com sucesso",
        };
      } catch (bcryptError) {
        console.error(\`Erro ao processar bcrypt: \${bcryptError.message}\`);
        return {
          success: false,
          message: \`Erro ao processar bcrypt: \${bcryptError.message}\`,
        };
      }
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      return {
        success: false,
        message: "Erro ao alterar senha",
      };
    }
  },
  
  /**
   * Valida a complexidade da senha
   * @param {string} password - Senha a ser validada
   * @returns {Object} Resultado da validação
   */
  validatePasswordComplexity(password) {
    // Verificar tamanho mínimo
    if (password.length < 8) {
      return {
        valid: false,
        message: "A senha deve ter pelo menos 8 caracteres",
      };
    }
    
    // Verificar se contém pelo menos um número
    if (!/\\d/.test(password)) {
      return {
        valid: false,
        message: "A senha deve conter pelo menos um número",
      };
    }
    
    // Verificar se contém pelo menos uma letra maiúscula
    if (!/[A-Z]/.test(password)) {
      return {
        valid: false,
        message: "A senha deve conter pelo menos uma letra maiúscula",
      };
    }
    
    // Verificar se contém pelo menos uma letra minúscula
    if (!/[a-z]/.test(password)) {
      return {
        valid: false,
        message: "A senha deve conter pelo menos uma letra minúscula",
      };
    }
    
    // Verificar se contém pelo menos um caractere especial
    if (!/[!@#$%^&*()_+\\-=\\[\\]{};':"\\\\|,.<>\\/?]/.test(password)) {
      return {
        valid: false,
        message: "A senha deve conter pelo menos um caractere especial",
      };
    }
    
    return {
      valid: true,
      message: "Senha válida",
    };
  },
};

module.exports = passwordService;
`

    // Salvar o novo conteúdo
    fs.writeFileSync(passwordServicePath, newContent)
    console.log("Arquivo passwordService.js substituído com sucesso!")
  } catch (error) {
    console.error("Erro ao modificar o arquivo:", error)
  }
}

fixPasswordServiceComplete()

