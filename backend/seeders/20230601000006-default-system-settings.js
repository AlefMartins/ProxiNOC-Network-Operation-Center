module.exports = {
    up: async (queryInterface, Sequelize) => {
      return queryInterface.bulkInsert("SystemSettings", [
        {
          key: "system_name",
          value: "ProxiNOC-GDR",
          description: "Nome do sistema",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          key: "logo_url",
          value: "/images/logo.png",
          description: "URL do logo do sistema",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          key: "favicon_url",
          value: "/images/favicon.ico",
          description: "URL do favicon do sistema",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          key: "session_timeout",
          value: "30",
          description: "Tempo de expiração da sessão em minutos",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          key: "device_check_interval",
          value: "5",
          description: "Intervalo de verificação de dispositivos em minutos",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          key: "backup_retention_days",
          value: "30",
          description: "Dias de retenção de backups",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ])
    },
  
    down: async (queryInterface, Sequelize) => {
      return queryInterface.bulkDelete("SystemSettings", null, {})
    },
  }
  
  