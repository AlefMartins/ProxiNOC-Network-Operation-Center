"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { ThemeProvider, CssBaseline, CircularProgress, Box } from "@mui/material"
import { LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { ptBR } from "date-fns/locale"
import theme from "./theme/theme"

// Layouts
import MainLayout from "./components/layout/MainLayout"

// Páginas
import Dashboard from "./pages/Dashboard"
import Devices from "./pages/Devices"
import Audit from "./pages/Audit"
import Terminal from "./pages/Terminal"
import UserManagement from "./pages/settings/UserManagement"
import GroupManagement from "./pages/settings/GroupManagement"
import LdapSettings from "./pages/settings/LdapSettings"
import EmailSettings from "./pages/settings/EmailSettings"
import Login from "./pages/Login"
import AccessDenied from "./pages/AccessDenied"

// Componentes de autenticação
import ProtectedRoute from "./components/auth/ProtectedRoute"
import authService from "./services/authService"
// Adicionar a importação da página de perfil
import ProfilePage from "./pages/ProfilePage"

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await authService.verifyToken()
        setIsAuthenticated(!!user)
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
        <CssBaseline />
        <Routes>
          {/* Rota pública de login */}
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
          <Route path="/access-denied" element={<AccessDenied />} />

          {/* Rotas protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="devices" element={<Devices />} />
              <Route path="audit" element={<Audit />} />
              <Route path="terminal" element={<Terminal />} />

              {/* Rotas de configurações */}
              <Route path="settings">
                <Route path="users" element={<UserManagement />} />
                <Route path="groups" element={<GroupManagement />} />
                <Route path="ldap" element={<LdapSettings />} />
                {/* Adicionar outras rotas de configuração aqui */}
              </Route>
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings/email" element={ <EmailSettings /> }/>
            </Route>
          </Route>

          {/* Rota para qualquer caminho não encontrado */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </LocalizationProvider>
    </ThemeProvider>
  )
}

export default App

