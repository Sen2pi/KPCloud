import { useState, useEffect } from 'react';

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
        if ('storage' in navigator && 'estimate' in navigator.storage) {
          const estimate = await navigator.storage.estimate();
          
          setStorageInfo({
            quota: estimate.quota || 0,
            usage: estimate.usage || 0,
            available: (estimate.quota || 0) - (estimate.usage || 0),
            supported: true
          });
        } else {
          // Fallback para browsers que não suportam Storage API
          setStorageInfo({
            quota: 50 * 1024 * 1024 * 1024, // 50GB padrão
            usage: 0,
            available: 50 * 1024 * 1024 * 1024,
            supported: false
          });
        }
      } catch (error) {
        console.error('Erro ao obter informações de armazenamento:', error);
        setStorageInfo({
          quota: 50 * 1024 * 1024 * 1024,
          usage: 0,
          available: 50 * 1024 * 1024 * 1024,
          supported: false
        });
      }
    };

    getStorageInfo();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(getStorageInfo, 30000);
    
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
