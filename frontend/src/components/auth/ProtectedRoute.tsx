"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Navigate, useLocation, Outlet } from "react-router-dom"
import authService from "../../services/authService"
import { CircularProgress, Box, Typography } from "@mui/material"

interface RequiredPermission {
  resource: string
  action: string
}

interface ProtectedRouteProps {
  requiredPermission?: RequiredPermission
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredPermission }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true)
      try {
        // Verificar se o token é válido
        const user = await authService.verifyToken()

        if (user) {
          setIsAuthenticated(true)

          // Se há permissão requerida, verificar se o usuário tem acesso
          if (requiredPermission) {
            const hasAccess = await authService.hasPermission(requiredPermission.resource, requiredPermission.action)

            setHasPermission(hasAccess)
          }
        } else {
          setIsAuthenticated(false)
          setHasPermission(false)
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error)
        setIsAuthenticated(false)
        setHasPermission(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [requiredPermission])

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Verificando autenticação...
        </Typography>
      </Box>
    )
  }

  if (!isAuthenticated) {
    // Redirecionar para login se não estiver autenticado
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredPermission && !hasPermission) {
    // Redirecionar para dashboard se não tiver permissão
    return <Navigate to="/dashboard" replace />
  }

  // Se estiver autenticado e tiver permissão (ou não precisar de permissão)
  return <Outlet />
}

export default ProtectedRoute

