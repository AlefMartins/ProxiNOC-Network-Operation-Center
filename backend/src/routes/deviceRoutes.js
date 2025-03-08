const express = require("express")
const router = express.Router()
const deviceController = require("../controllers/deviceController")
const { authenticate, authorize } = require("../middlewares/authMiddleware")
const { auditLog } = require("../middlewares/auditMiddleware")

// Middleware de autenticação para todas as rotas
router.use(authenticate)

// Listar dispositivos
router.get("/", authorize("devices", "view"), deviceController.getAllDevices)

// Buscar dispositivo por ID
router.get("/:id", authorize("devices", "view"), deviceController.getDeviceById)

// Criar dispositivo
router.post(
  "/",
  authorize("devices", "create"),
  auditLog("create", "Device", (req, res) => `Dispositivo criado: ${req.body.name}`),
  deviceController.createDevice,
)

// Atualizar dispositivo
router.put(
  "/:id",
  authorize("devices", "edit"),
  auditLog("update", "Device", (req, res) => `Dispositivo atualizado: ${req.body.name || "ID " + req.params.id}`),
  deviceController.updateDevice,
)

// Excluir dispositivo
router.delete("/:id", authorize("devices", "delete"), auditLog("delete", "Device"), deviceController.deleteDevice)

// Verificar status do dispositivo
router.get("/:id/status", authorize("devices", "view"), deviceController.checkDeviceStatus)

// Verificar status de todos os dispositivos
router.get("/status/all", authorize("devices", "view"), deviceController.checkAllDevicesStatus)

// Executar comando SSH
router.post(
  "/:id/command",
  authorize("devices", "connect"),
  auditLog("command", "Device", (req) => `Comando executado em ${req.params.id}: ${req.body.command}`),
  deviceController.executeCommand,
)

// Histórico de comandos
router.get("/:id/commands", authorize("devices", "view"), deviceController.getCommandHistory)

// Estatísticas dos dispositivos
router.get("/stats/summary", authorize("devices", "view"), deviceController.getDeviceStats)

module.exports = router

