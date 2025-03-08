const express = require("express")
const router = express.Router()
const groupController = require("../controllers/groupController")
const { authenticate, authorize } = require("../middlewares/authMiddleware")
const { auditLog } = require("../middlewares/auditMiddleware")

// Middleware de autenticação para todas as rotas
router.use(authenticate)

// Listar grupos
router.get("/", authorize("groups", "view"), groupController.getAllGroups)

// Buscar grupo por ID
router.get("/:id", authorize("groups", "view"), groupController.getGroupById)

// Criar grupo
router.post(
  "/",
  authorize("groups", "create"),
  auditLog("create", "Group", (req, res) => `Grupo criado: ${req.body.name}`),
  groupController.createGroup,
)

// Atualizar grupo
router.put(
  "/:id",
  authorize("groups", "edit"),
  auditLog("update", "Group", (req, res) => `Grupo atualizado: ${req.body.name || "ID " + req.params.id}`),
  groupController.updateGroup,
)

// Excluir grupo
router.delete("/:id", authorize("groups", "delete"), auditLog("delete", "Group"), groupController.deleteGroup)



module.exports = router

