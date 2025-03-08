require("dotenv").config()
const express = require("express")
const cors = require("cors")
const morgan = require("morgan")
const path = require("path")
const routes = require("./routes")
const sequelize = require("./config/sequelize")
// Adicione esta linha junto com as outras importações de rotas
const passwordRoutes = require("./routes/passwordRoutes")

// Inicializar app
const app = express()
const PORT = process.env.PORT || 3001
// Importar as rotas de email
const emailRoutes = require("./routes/emailRoutes")
// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan("dev"))
// Adicione esta linha junto com as outras definições de rotas
app.use("/api/email", emailRoutes)

// Adicione esta linha junto com as outras definições de rotas
app.use("/api/password", passwordRoutes)
// Rotas da API
app.use("/api", routes)

// Servir arquivos estáticos em produção
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../../frontend/build")))

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/build", "index.html"))
  })
}

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: "Erro interno do servidor" })
})

// Iniciar servidor
const startServer = async () => {
  try {
    // Testar conexão com o banco de dados
    await sequelize.authenticate()
    console.log("Conexão com o banco de dados estabelecida com sucesso.")

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`)
    })
  } catch (error) {
    console.error("Erro ao conectar ao banco de dados:", error)
    process.exit(1)
  }
}

startServer()

module.exports = app

