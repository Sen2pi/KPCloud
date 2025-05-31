import { useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { updateApiBaseURL } from '../services/api';

export const useApiConfig = () => {
  const { settings } = useSettings();

  useEffect(() => {
    // Atualizar URL da API sempre que as configurações mudam
    if (settings.api?.baseURL) {
      updateApiBaseURL(settings.api.baseURL);
    }
  }, [settings.api?.baseURL]);

  const changeApiURL = (newURL) => {
    updateApiBaseURL(newURL);
  };

  return {
    currentURL: settings.api?.baseURL,
    timeout: settings.api?.timeout,
    changeApiURL,
  };
};
