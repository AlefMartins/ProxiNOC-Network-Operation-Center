import type React from "react"
import { Card, CardContent, Typography, Alert, Box, Divider } from "@mui/material"

interface LdapHelpCardProps {
  showAdvanced: boolean
}

const LdapHelpCard: React.FC<LdapHelpCardProps> = ({ showAdvanced }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Ajuda para Configuração LDAP/AD
        </Typography>

        <Typography variant="body2" paragraph>
          Configure a integração com seu servidor Active Directory para permitir que os usuários façam login com suas
          credenciais corporativas.
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Configuração Básica:
        </Typography>

        <Box sx={{ pl: 2, mb: 2 }}>
          <Typography variant="body2">
            <strong>Domínio:</strong> Nome do domínio da sua empresa (ex: empresa.com.br)
          </Typography>
          <Typography variant="body2">
            <strong>Servidor:</strong> Endereço IP ou hostname do servidor LDAP/AD
          </Typography>
          <Typography variant="body2">
            <strong>Usuário Administrador:</strong> Usuário com permissões para buscar no AD
          </Typography>
          <Typography variant="body2">
            <strong>Senha:</strong> Senha do usuário administrador
          </Typography>
          <Typography variant="body2">
            <strong>Intervalo de Sincronização:</strong> Frequência de atualização dos dados do AD
          </Typography>
        </Box>

        {showAdvanced && (
          <>
            <Typography variant="subtitle2" gutterBottom>
              Configuração Avançada:
            </Typography>

            <Box sx={{ pl: 2, mb: 2 }}>
              <Typography variant="body2">
                <strong>Base de Busca:</strong> DC=empresa,DC=com,DC=br
              </Typography>
              <Typography variant="body2">
                <strong>Filtro de Usuários:</strong> (&(objectClass=person)(sAMAccountName=*))
              </Typography>
              <Typography variant="body2">
                <strong>Filtro de Grupos:</strong> (&(objectClass=group)(cn=*))
              </Typography>
              <Typography variant="body2">
                <strong>Atributo de Login:</strong> sAMAccountName
              </Typography>
              <Typography variant="body2">
                <strong>Atributo de Nome:</strong> displayName
              </Typography>
              <Typography variant="body2">
                <strong>Atributo de Email:</strong> mail
              </Typography>
              <Typography variant="body2">
                <strong>Atributo de Nome do Grupo:</strong> cn
              </Typography>
            </Box>
          </>
        )}

        <Alert severity="info" sx={{ mb: 2 }}>
          O usuário administrador precisa ter permissões para buscar usuários e grupos no Active Directory.
        </Alert>

        <Alert severity="warning">
          Mantenha as credenciais do AD em segurança e use um usuário com as permissões mínimas necessárias.
        </Alert>
      </CardContent>
    </Card>
  )
}

export default LdapHelpCard

