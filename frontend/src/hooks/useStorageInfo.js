import { useState, useEffect } from 'react';
import { systemAPI } from '../services/api';

export const useStorageInfo = () => {
  const [storageInfo, setStorageInfo] = useState({
    quota: 0,
    usage: 0,
    available: 0,
    supported: false
  });

  useEffect(() => {
    const getStorageInfo = async () => {
      try {
        // Obter espaço real do disco do servidor
        const response = await systemAPI.getDiskSpace();
        const diskSpace = response.data.diskSpace;
        
        setStorageInfo({
          quota: diskSpace.total,
          usage: diskSpace.used,
          available: diskSpace.free,
          supported: true
        });
        
        console.log('Espaço em disco do servidor:', {
          total: formatBytes(diskSpace.total),
          usado: formatBytes(diskSpace.used),
          livre: formatBytes(diskSpace.free)
        });
      } catch (error) {
        console.error('Erro ao obter espaço do servidor:', error);
        
        // Fallback para 1TB como mencionaste
        const oneTB = 1024 * 1024 * 1024 * 1024;
        setStorageInfo({
          quota: oneTB,
          usage: oneTB * 0.3, // 30% usado
          available: oneTB * 0.7, // 70% livre
          supported: false
        });
      }
    };

    getStorageInfo();
    
    // Atualizar a cada 60 segundos
    const interval = setInterval(getStorageInfo, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUsagePercentage = () => {
    if (storageInfo.quota === 0) return 0;
    return Math.round((storageInfo.usage / storageInfo.quota) * 100);
  };

  return {
    ...storageInfo,
    formatBytes,
    getUsagePercentage,
    formattedQuota: formatBytes(storageInfo.quota),
    formattedUsage: formatBytes(storageInfo.usage),
    formattedAvailable: formatBytes(storageInfo.available)
  };
};
