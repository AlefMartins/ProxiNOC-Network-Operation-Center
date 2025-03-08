// frontend/src/pages/settings/Settings.tsx
import React, { useState } from "react"
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
} from "@mui/material"

import EmailConfig from "../../components/settings/EmailConfig"

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    "aria-controls": `settings-tabpanel-${index}`,
  }
}

const Settings: React.FC = () => {
  const [tabValue, setTabValue] = useState(0)

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Configurações do Sistema
      </Typography>

      <Paper sx={{ width: "100%", mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="configurações do sistema">
            <Tab label="Geral" {...a11yProps(0)} />
            <Tab label="Email (SMTP)" {...a11yProps(1)} />
            <Tab label="Integração LDAP" {...a11yProps(2)} />
            <Tab label="Segurança" {...a11yProps(3)} />
            <Tab label="Backup" {...a11yProps(4)} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6">Configurações Gerais</Typography>
          <Typography paragraph>
            Configure as opções gerais do sistema.
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <EmailConfig />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6">Configurações de Segurança</Typography>
          <Typography paragraph>
            Configure as opções de segurança do sistema.
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6">Configurações de Backup</Typography>
          <Typography paragraph>
            Configure as opções de backup do sistema.
          </Typography>
        </TabPanel>
      </Paper>
    </Container>
  )
}

export default Settings