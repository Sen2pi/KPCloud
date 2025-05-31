import { useState, useEffect } from 'react';
import { systemAPI } from '../services/api';

// MOVER FORMATBYTES PARA FORA DO HOOK
const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

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
        console.log('=== FRONTEND: Getting storage info ===');
        
        const response = await systemAPI.getDiskSpace();
        const diskSpace = response.data.diskSpace;
        
        console.log('=== FRONTEND: Disk space response ===', diskSpace);
        
        if (!diskSpace || typeof diskSpace.total !== 'number') {
          throw new Error('Invalid disk space data received');
        }
        
        const newStorageInfo = {
          quota: diskSpace.total,
          usage: diskSpace.used,
          available: diskSpace.free,
          supported: true
        };
        
        setStorageInfo(newStorageInfo);
        
        console.log('=== FRONTEND: Storage info formatted ===', {
          total: formatBytes(diskSpace.total),
          usado: formatBytes(diskSpace.used),
          livre: formatBytes(diskSpace.free),
          percentagem: diskSpace.percentage + '%'
        });
      } catch (error) {
        console.error('=== FRONTEND: Storage error ===', error);
        
        // Fallback para 1TB
        const oneTB = 1024 * 1024 * 1024 * 1024;
        const usedSpace = oneTB * 0.3;
        
        const fallbackInfo = {
          quota: oneTB,
          usage: usedSpace,
          available: oneTB - usedSpace,
          supported: false
        };
        
        setStorageInfo(fallbackInfo);
        
        console.log('=== FRONTEND: Using fallback storage ===', {
          total: formatBytes(oneTB),
          usado: formatBytes(usedSpace),
          livre: formatBytes(oneTB - usedSpace)
        });
      }
    };

    getStorageInfo();
    
    // Atualizar a cada 60 segundos
    const interval = setInterval(getStorageInfo, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const getUsagePercentage = () => {
    if (storageInfo.quota === 0) return 0;
    return Math.round((storageInfo.usage / storageInfo.quota) * 100);
  };

  return {
    ...storageInfo,
    formatBytes, // AGORA ESTÁ DEFINIDO
    getUsagePercentage,
    formattedQuota: formatBytes(storageInfo.quota),
    formattedUsage: formatBytes(storageInfo.usage),
    formattedAvailable: formatBytes(storageInfo.available)
  };
};
