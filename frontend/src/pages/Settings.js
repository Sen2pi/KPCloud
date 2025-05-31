import React, { useState } from 'react';
import {
  Box,
  Toolbar,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  Tabs,
  Tab,
  Divider,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Grid
} from '@mui/material';
import {
  Palette,
  Language,
  Notifications,
  Security,
  Storage,
  CloudUpload,
  Visibility,
  RestoreFromTrash,
  Warning
} from '@mui/icons-material';
import { useSettings } from '../contexts/SettingsContext';
import { useStorageInfo } from '../hooks/useStorageInfo';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext'; // ADICIONAR ESTA LINHA
import ThemeToggle from '../components/common/ThemeToggle'; // ADICIONAR ESTA LINHA

const Settings = () => {
  const { settings, updateSetting, updateNestedSetting, resetSettings } = useSettings();
  const { user } = useAuth();
  const storageInfo = useStorageInfo();
  const { isDarkMode } = useTheme(); // ADICIONAR ESTA LINHA
  const [activeTab, setActiveTab] = useState(0);
  const [resetDialog, setResetDialog] = useState(false);

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Toolbar />
      
      <Typography variant="h4" gutterBottom>
        Definições
      </Typography>

      <Paper sx={{ mt: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable">
          <Tab label="Geral" />
          <Tab label="Aparência" />
          <Tab label="Notificações" />
          <Tab label="Privacidade" />
          <Tab label="Armazenamento" />
          <Tab label="Upload" />
        </Tabs>

        {/* Tab Geral */}
        <TabPanel value={activeTab} index={0}>
          <Typography variant="h6" gutterBottom>
            Configurações Gerais
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <Language />
              </ListItemIcon>
              <ListItemText primary="Idioma" secondary="Seleciona o idioma da interface" />
              <FormControl sx={{ minWidth: 120 }}>
                <Select
                  value={settings.language || 'pt'}
                  onChange={(e) => updateSetting('general', 'language', e.target.value)}
                  size="small"
                >
                  <MenuItem value="pt">Português</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Español</MenuItem>
                  <MenuItem value="fr">Français</MenuItem>
                </Select>
              </FormControl>
            </ListItem>

            <Divider />

            <ListItem>
              <ListItemIcon>
                <Visibility />
              </ListItemIcon>
              <ListItemText 
                primary="Modo de visualização padrão" 
                secondary="Como os ficheiros são apresentados por defeito"
              />
              <FormControl sx={{ minWidth: 120 }}>
                <Select
                  value={settings.display?.viewMode || 'grid'}
                  onChange={(e) => updateNestedSetting('display', 'viewMode', 'defaultView', e.target.value)}
                  size="small"
                >
                  <MenuItem value="grid">Grelha</MenuItem>
                  <MenuItem value="list">Lista</MenuItem>
                </Select>
              </FormControl>
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <Storage />
              </ListItemIcon>
              <ListItemText 
                primary="Itens por página" 
                secondary="Número de ficheiros mostrados por página"
              />
              <TextField
                type="number"
                value={settings.display?.itemsPerPage || 20}
                onChange={(e) => updateNestedSetting('display', 'itemsPerPage', 'count', parseInt(e.target.value))}
                size="small"
                sx={{ width: 80 }}
                inputProps={{ min: 10, max: 100 }}
              />
            </ListItem>
          </List>
        </TabPanel>

        {/* Tab Aparência */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Aparência
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <Palette />
              </ListItemIcon>
              <ListItemText
                primary="Tema"
                secondary="Escolhe entre tema claro ou escuro"
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {isDarkMode ? 'Escuro' : 'Claro'}
                </Typography>
                <ThemeToggle variant="switch" />
              </Box>
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <Visibility />
              </ListItemIcon>
              <ListItemText
                primary="Modo compacto"
                secondary="Interface mais compacta com menos espaçamento"
              />
              <Switch
                checked={settings.display?.compactMode || false}
                onChange={(e) => updateNestedSetting('display', 'compactMode', 'enabled', e.target.checked)}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <Visibility />
              </ListItemIcon>
              <ListItemText
                primary="Mostrar ficheiros ocultos"
                secondary="Exibir ficheiros que começam com ponto"
              />
              <Switch
                checked={settings.display?.showHiddenFiles || false}
                onChange={(e) => updateNestedSetting('display', 'showHiddenFiles', 'enabled', e.target.checked)}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <Palette />
              </ListItemIcon>
              <ListItemText
                primary="Animações"
                secondary="Ativar animações suaves na interface"
              />
              <Switch
                checked={settings.display?.animations !== false}
                onChange={(e) => updateNestedSetting('display', 'animations', 'enabled', e.target.checked)}
              />
            </ListItem>
          </List>
        </TabPanel>

        {/* Tab Notificações */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Notificações
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <Notifications />
              </ListItemIcon>
              <ListItemText
                primary="Notificações por email"
                secondary="Receber notificações no teu email"
              />
              <Switch
                checked={settings.notifications?.email !== false}
                onChange={(e) => updateNestedSetting('notifications', 'email', 'enabled', e.target.checked)}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <Notifications />
              </ListItemIcon>
              <ListItemText
                primary="Notificações no browser"
                secondary="Mostrar notificações no desktop"
              />
              <Switch
                checked={settings.notifications?.desktop !== false}
                onChange={(e) => updateNestedSetting('notifications', 'desktop', 'enabled', e.target.checked)}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <CloudUpload />
              </ListItemIcon>
              <ListItemText
                primary="Upload concluído"
                secondary="Notificar quando o upload terminar"
              />
              <Switch
                checked={settings.notifications?.uploadComplete !== false}
                onChange={(e) => updateNestedSetting('notifications', 'uploadComplete', 'enabled', e.target.checked)}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <Warning />
              </ListItemIcon>
              <ListItemText
                primary="Aviso de armazenamento"
                secondary="Notificar quando o espaço estiver quase cheio"
              />
              <Switch
                checked={settings.notifications?.storageWarning !== false}
                onChange={(e) => updateNestedSetting('notifications', 'storageWarning', 'enabled', e.target.checked)}
              />
            </ListItem>
          </List>
        </TabPanel>

        {/* Tab Privacidade */}
        <TabPanel value={activeTab} index={3}>
          <Typography variant="h6" gutterBottom>
            Privacidade e Segurança
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <Security />
              </ListItemIcon>
              <ListItemText
                primary="Autenticação de dois fatores"
                secondary="Adicionar uma camada extra de segurança"
              />
              <Switch
                checked={settings.privacy?.twoFactorEnabled || false}
                onChange={(e) => updateNestedSetting('privacy', 'twoFactorEnabled', 'enabled', e.target.checked)}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <Visibility />
              </ListItemIcon>
              <ListItemText
                primary="Perfil público"
                secondary="Permitir que outros vejam o teu perfil"
              />
              <Switch
                checked={settings.privacy?.publicProfile || false}
                onChange={(e) => updateNestedSetting('privacy', 'publicProfile', 'enabled', e.target.checked)}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <Storage />
              </ListItemIcon>
              <ListItemText
                primary="Partilhar dados de utilização"
                secondary="Ajudar a melhorar o KPCloud"
              />
              <Switch
                checked={settings.privacy?.shareAnalytics !== false}
                onChange={(e) => updateNestedSetting('privacy', 'shareAnalytics', 'enabled', e.target.checked)}
              />
            </ListItem>
          </List>
        </TabPanel>

        {/* Tab Armazenamento */}
        <TabPanel value={activeTab} index={4}>
          <Typography variant="h6" gutterBottom>
            Gestão de Armazenamento
          </Typography>

          {/* Informações de Armazenamento */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Espaço em Disco Disponível
            </Typography>
            <Typography variant="body2">
              Usado: {storageInfo.formattedUsage} de {storageInfo.formattedQuota} 
              ({storageInfo.getUsagePercentage()}%)
            </Typography>
            <Typography variant="body2">
              Disponível: {storageInfo.formattedAvailable}
            </Typography>
            {!storageInfo.supported && (
              <Typography variant="caption" color="text.secondary">
                * Valores estimados (Storage API não suportada)
              </Typography>
            )}
          </Alert>

          <List>
            <ListItem>
              <ListItemIcon>
                <RestoreFromTrash />
              </ListItemIcon>
              <ListItemText
                primary="Limpeza automática do lixo"
                secondary="Eliminar automaticamente ficheiros antigos do lixo"
              />
              <Switch
                checked={settings.storage?.autoCleanup !== false}
                onChange={(e) => updateNestedSetting('storage', 'autoCleanup', 'enabled', e.target.checked)}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <RestoreFromTrash />
              </ListItemIcon>
              <ListItemText 
                primary="Retenção no lixo (dias)" 
                secondary="Quantos dias manter ficheiros no lixo"
              />
              <TextField
                type="number"
                value={settings.storage?.trashRetentionDays || 30}
                onChange={(e) => updateNestedSetting('storage', 'trashRetentionDays', 'days', parseInt(e.target.value))}
                size="small"
                sx={{ width: 80 }}
                inputProps={{ min: 1, max: 365 }}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <Storage />
              </ListItemIcon>
              <ListItemText
                primary="Deteção de duplicados"
                secondary="Avisar sobre ficheiros duplicados"
              />
              <Switch
                checked={settings.storage?.duplicateDetection !== false}
                onChange={(e) => updateNestedSetting('storage', 'duplicateDetection', 'enabled', e.target.checked)}
              />
            </ListItem>
          </List>
        </TabPanel>

        {/* Tab Upload */}
        <TabPanel value={activeTab} index={5}>
          <Typography variant="h6" gutterBottom>
            Configurações de Upload
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <CloudUpload />
              </ListItemIcon>
              <ListItemText
                primary="Upload automático"
                secondary="Iniciar upload automaticamente ao selecionar ficheiros"
              />
              <Switch
                checked={settings.upload?.autoUpload !== false}
                onChange={(e) => updateNestedSetting('upload', 'autoUpload', 'enabled', e.target.checked)}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <Storage />
              </ListItemIcon>
              <ListItemText
                primary="Compressão de imagens"
                secondary="Comprimir imagens automaticamente para poupar espaço"
              />
              <Switch
                checked={settings.upload?.compressionEnabled !== false}
                onChange={(e) => updateNestedSetting('upload', 'compressionEnabled', 'enabled', e.target.checked)}
              />
            </ListItem>

            <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 2 }}>
                <Storage sx={{ mr: 2 }} />
                <ListItemText
                  primary="Tamanho máximo de ficheiro"
                  secondary={`Atual: ${((settings.upload?.maxFileSize || 100 * 1024 * 1024) / (1024 * 1024)).toFixed(0)} MB`}
                />
              </Box>
              <Slider
                value={(settings.upload?.maxFileSize || 100 * 1024 * 1024) / (1024 * 1024)}
                onChange={(e, value) => updateNestedSetting('upload', 'maxFileSize', 'size', value * 1024 * 1024)}
                min={1}
                max={500}
                step={1}
                marks={[
                  { value: 10, label: '10MB' },
                  { value: 100, label: '100MB' },
                  { value: 500, label: '500MB' }
                ]}
                sx={{ width: '100%' }}
              />
            </ListItem>

            <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 2 }}>
                <CloudUpload sx={{ mr: 2 }} />
                <ListItemText
                  primary="Tipos de ficheiro permitidos"
                  secondary="Seleciona os tipos de ficheiro que podes enviar"
                />
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {['image/*', 'video/*', 'audio/*', 'application/*', 'text/*'].map((type) => (
                  <Chip
                    key={type}
                    label={type.replace('/*', 's')}
                    color={(settings.upload?.allowedTypes || []).includes(type) ? 'primary' : 'default'}
                    onClick={() => {
                      const currentTypes = settings.upload?.allowedTypes || ['image/*', 'video/*', 'audio/*', 'application/*', 'text/*'];
                      const newTypes = currentTypes.includes(type)
                        ? currentTypes.filter(t => t !== type)
                        : [...currentTypes, type];
                      updateNestedSetting('upload', 'allowedTypes', 'types', newTypes);
                    }}
                  />
                ))}
              </Box>
            </ListItem>
          </List>
        </TabPanel>

        {/* Botões de Ação */}
        <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          <Grid container spacing={2} justifyContent="flex-end">
            <Grid item>
              <Button
                variant="outlined"
                color="error"
                onClick={() => setResetDialog(true)}
              >
                Restaurar Padrões
              </Button>
            </Grid>
            <Grid item>
              <Button variant="contained">
                Guardar Alterações
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Dialog de Confirmação de Reset */}
      <Dialog open={resetDialog} onClose={() => setResetDialog(false)} closeAfterTransition={false}>
        <DialogTitle>Restaurar Configurações Padrão</DialogTitle>
        <DialogContent>
          <Typography>
            Tens a certeza que queres restaurar todas as configurações para os valores padrão?
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              resetSettings();
              setResetDialog(false);
            }}
            color="error"
            variant="contained"
          >
            Restaurar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
