const express = require('express');
const router = express.Router();

// Importar rotas
const authRoutes = require('./auth.routes');
const ldapRoutes = require('./ldap.routes');
// const userRoutes = require('./user.routes');
// const groupRoutes = require('./group.routes');
// const deviceRoutes = require('./device.routes');
// const auditRoutes = require('./audit.routes');
// const settingsRoutes = require('./settings.routes');
// const backupRoutes = require('./backup.routes');
// const terminalRoutes = require('./terminal.routes');

// Definir rotas
router.use('/auth', authRoutes);
router.use('/ldap', ldapRoutes);
// router.use('/users', userRoutes);
// router.use('/groups', groupRoutes);
// router.use('/devices', deviceRoutes);
// router.use('/audit', auditRoutes);
// router.use('/settings', settingsRoutes);
// router.use('/backups', backupRoutes);
// router.use('/terminal', terminalRoutes);

// Rota de teste/status
router.get('/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

module.exports = router;