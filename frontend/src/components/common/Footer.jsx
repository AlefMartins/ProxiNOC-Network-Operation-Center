import React from 'react';
import { Box, Typography, Link, Container } from '@mui/material';

/**
 * Componente de rodapé
 */
const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.background.paper,
        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body2" color="text.secondary" align="center">
          {'© '}
          {new Date().getFullYear()}
          {' '}
          <Link color="inherit" href="#">
            Tacacs LDAP Manager
          </Link>
          {' - Todos os direitos reservados.'}
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;