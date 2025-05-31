import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Link,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import RegisterForm from '../components/auth/RegisterForm';

const Register = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/dashboard');
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          {/* Logo do KPCloud */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
            <img 
              src="/logo.png" 
              alt="KPCloud Logo" 
              style={{ 
                height: 300, 
                width: 'auto', 
              }} 
            />
          </Box>

          <Typography component="h2" variant="h5" align="center" gutterBottom>
            Criar Conta
          </Typography>

          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Junta-te ao KPCloud e começa a armazenar os teus ficheiros na nuvem
          </Typography>

          <RegisterForm onSuccess={handleSuccess} />

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Link component={RouterLink} to="/login" variant="body2">
              Já tens conta? Faz login aqui
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
