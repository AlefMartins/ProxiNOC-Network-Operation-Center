const express = require("express")
const router = express.Router()
const userController = require("../controllers/userController")
const { authenticate, authorize } = require("../middlewares/authMiddleware")
const { auditLog } = require("../middlewares/auditMiddleware")

// Middleware de autenticação para todas as rotas
router.use(authenticate)

// Listar usuários
router.get("/", authorize("users", "view"), userController.getAllUsers)

// Buscar usuário por ID
router.get("/:id", authorize("users", "view"), userController.getUserById)

// Criar usuário
router.post(
  "/",
  authorize("users", "create"),
  auditLog("create", "User", (req, res) => `Usuário criado: ${req.body.username}`),
  userController.createUser,
)

// Atualizar usuário
router.put(
  "/:id",
  authorize("users", "edit"),
  auditLog("update", "User", (req, res) => `Usuário atualizado: ${req.body.username || "ID " + req.params.id}`),
  userController.updateUser,
)

// Excluir usuário
router.delete("/:id", authorize("users", "delete"), auditLog("delete", "User"), userController.deleteUser)

// Alterar senha
router.post("/:id/change-password", auditLog("password_change", "User"), userController.changePassword)

// Obter grupos disponíveis para um usuário
router.get("/:id/available-groups", authenticate, authorize("users", "view"), userController.getAvailableGroups)

module.exports = router

