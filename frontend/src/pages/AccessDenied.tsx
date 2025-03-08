import type React from "react"
import { Box, Typography, Button, Paper } from "@mui/material"
import { Lock as LockIcon } from "@mui/icons-material"
import { useNavigate } from "react-router-dom"

const AccessDenied: React.FC = () => {
  const navigate = useNavigate()

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        p: 2,
        bgcolor: "background.default",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 500,
          width: "100%",
          textAlign: "center",
          borderRadius: 2,
        }}
      >
        <LockIcon color="error" sx={{ fontSize: 80, mb: 2 }} />

        <Typography variant="h4" color="error" gutterBottom fontWeight="bold">
          Acesso Negado
        </Typography>

        <Typography variant="body1" color="textSecondary" paragraph>
          Você não tem permissão para acessar esta página. Entre em contato com o administrador do sistema para
          solicitar acesso.
        </Typography>

        <Box sx={{ mt: 3, display: "flex", justifyContent: "center", gap: 2 }}>
          <Button variant="outlined" color="primary" onClick={() => navigate(-1)}>
            Voltar
          </Button>

          <Button variant="contained" color="primary" onClick={() => navigate("/")}>
            Ir para Dashboard
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}

export default AccessDenied

