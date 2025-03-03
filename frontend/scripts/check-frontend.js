const fs = require('fs');
const path = require('path');

// Lista de arquivos essenciais para o frontend
const essentialFiles = [
  'src/index.jsx',
  'src/App.jsx',
  'src/theme/index.js',
  'src/contexts/AuthContext.jsx',
  'src/contexts/NotificationContext.jsx',
  'src/hooks/useAuth.js',
  'src/hooks/useNotification.js',
  'src/layouts/AuthLayout.jsx',
  'src/layouts/MainLayout.jsx',
  'src/pages/LoginPage.jsx',
  'src/components/common/Loader.jsx',
  'public/index.html',
  'vite.config.js',
  'package.json'
];

// Verificar se os arquivos essenciais existem
console.log('Verificando arquivos essenciais...');
const missingFiles = [];

essentialFiles.forEach(file => {
  const filePath = path.resolve(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.log('\nArquivos faltando:');
  missingFiles.forEach(file => {
    console.log(`- ${file}`);
  });
} else {
  console.log('\nTodos os arquivos essenciais estão presentes!');
}

// Verificar se o package.json tem todas as dependências necessárias
console.log('\nVerificando dependências...');
const packageJsonPath = path.resolve(__dirname, '..', 'package.json');
const packageJson = require(packageJsonPath);

const requiredDependencies = [
  'react',
  'react-dom',
  'react-router-dom',
  '@mui/material',
  '@mui/icons-material',
  '@emotion/react',
  '@emotion/styled',
  'axios',
  'formik',
  'yup',
  'react-query',
  'notistack'
];

const missingDependencies = [];

requiredDependencies.forEach(dependency => {
  if (!packageJson.dependencies[dependency]) {
    missingDependencies.push(dependency);
  }
});

if (missingDependencies.length > 0) {
  console.log('\nDependências faltando:');
  missingDependencies.forEach(dependency => {
    console.log(`- ${dependency}`);
  });
} else {
  console.log('\nTodas as dependências necessárias estão presentes!');
}

console.log('\nVerificação concluída!');