const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Diretórios necessários
const dirs = [
  process.env.UPLOAD_DIR || 'uploads',
  process.env.BACKUP_DIR || 'backups',
  path.resolve(process.env.LOG_FILE_PATH || 'logs')
];

// Criando cada diretório se não existir
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Diretório criado: ${dir}`);
  } else {
    console.log(`Diretório já existe: ${dir}`);
  }
});

console.log('Todos os diretórios foram verificados/criados com sucesso.');