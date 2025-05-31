import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import toast from 'react-hot-toast';

const SettingsContext = createContext();

const initialSettings = {
  theme: 'light', // 'light' | 'dark'
  language: 'pt',
  notifications: {
    email: true,
    desktop: true,
    fileShared: true,
    uploadComplete: true,
    storageWarning: true
  },
  privacy: {
    twoFactorEnabled: false,
    publicProfile: false,
    shareAnalytics: true
  },
  display: {
    viewMode: 'grid', // 'grid' | 'list'
    itemsPerPage: 20,
    showHiddenFiles: false,
    compactMode: false
  },
  upload: {
    autoUpload: true,
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['image/*', 'video/*', 'audio/*', 'application/*', 'text/*'],
    compressionEnabled: true
  },
  storage: {
    autoCleanup: true,
    trashRetentionDays: 30,
    duplicateDetection: true
  }
};

const settingsReducer = (state, action) => {
  switch (action.type) {
    case 'LOAD_SETTINGS':
      return { ...state, ...action.payload };
    case 'UPDATE_SETTING':
      return {
        ...state,
        [action.category]: {
          ...state[action.category],
          [action.key]: action.value
        }
      };
    case 'UPDATE_NESTED_SETTING':
      return {
        ...state,
        [action.category]: {
          ...state[action.category],
          [action.subcategory]: {
            ...state[action.category][action.subcategory],
            [action.key]: action.value
          }
        }
      };
    case 'RESET_SETTINGS':
      return initialSettings;
    default:
      return state;
  }
};

export const SettingsProvider = ({ children }) => {
  const [settings, dispatch] = useReducer(settingsReducer, initialSettings);
  const [storedSettings, setStoredSettings] = useLocalStorage('kpcloud_settings', {});

  useEffect(() => {
    // Carregar configurações salvas
    if (Object.keys(storedSettings).length > 0) {
      dispatch({ type: 'LOAD_SETTINGS', payload: storedSettings });
    }
  }, [storedSettings]);

  const updateSetting = (category, key, value) => {
    dispatch({ type: 'UPDATE_SETTING', category, key, value });
    
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value
      }
    };
    
    setStoredSettings(newSettings);
    toast.success('Configuração atualizada');
  };

  const updateNestedSetting = (category, subcategory, key, value) => {
    dispatch({ type: 'UPDATE_NESTED_SETTING', category, subcategory, key, value });
    
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [subcategory]: {
          ...settings[category][subcategory],
          [key]: value
        }
      }
    };
    
    setStoredSettings(newSettings);
    toast.success('Configuração atualizada');
  };

  const resetSettings = () => {
    dispatch({ type: 'RESET_SETTINGS' });
    setStoredSettings({});
    toast.success('Configurações restauradas para o padrão');
  };

  const value = {
    settings,
    updateSetting,
    updateNestedSetting,
    resetSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings deve ser usado dentro de SettingsProvider');
  }
  return context;
};
