"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Container, Paper, Typography, Grid, Avatar, Divider, Box, Skeleton, Alert } from "@mui/material"
import { Person } from "@mui/icons-material"
import authService from "../services/authService"
import ChangePasswordForm from "../components/profile/ChangePasswordForm"

interface UserProfile {
  id: number
  username: string
  fullName: string
  email: string
  isLdapUser: boolean
  lastLogin?: string
}

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)

        // Obter usuário atual
        const user = authService.getCurrentUser()
        console.log("Usuário atual:", user)

        if (user) {
          setProfile({
            id: user.id,
            username: user.username,
            fullName: user.fullName || user.username,
            email: user.email || "",
            isLdapUser: user.isLdapUser || false,
          })
        } else {
          setError("Não foi possível obter os dados do perfil")
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error)
        setError("Erro ao carregar dados do perfil")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Meu Perfil
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Skeleton variant="circular" width={80} height={80} />
            </Grid>
            <Grid item xs>
              <Skeleton variant="text" width="60%" height={40} />
              <Skeleton variant="text" width="40%" height={30} />
              <Skeleton variant="text" width="30%" height={30} />
            </Grid>
          </Grid>
        </Paper>
      ) : (
        profile && (
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item>
                <Avatar sx={{ width: 80, height: 80, bgcolor: "primary.main" }}>
                  <Person sx={{ fontSize: 40 }} />
                </Avatar>
              </Grid>
              <Grid item xs>
                <Typography variant="h5" component="h2">
                  {profile.fullName}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {profile.email}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Usuário: {profile.username}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      display: "inline-block",
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      bgcolor: profile.isLdapUser ? "info.light" : "success.light",
                      color: profile.isLdapUser ? "info.dark" : "success.dark",
                    }}
                  >
                    {profile.isLdapUser ? "Usuário LDAP" : "Usuário Local"}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="body1" paragraph>
              Este é o seu perfil de usuário. Aqui você pode visualizar suas informações e alterar sua senha.
            </Typography>

            {profile.lastLogin && (
              <Typography variant="body2" color="text.secondary">
                Último acesso: {new Date(profile.lastLogin).toLocaleString()}
              </Typography>
            )}
          </Paper>
        )
      )}

      <ChangePasswordForm />
    </Container>
  )
}

export default ProfilePage

