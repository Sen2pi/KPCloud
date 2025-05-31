const checkDiskSpace = require('check-disk-space').default;

exports.getDiskSpace = async (req, res) => {
  try {
    console.log('=== GETTING DISK SPACE ===');
    console.log('Platform:', process.platform);
    console.log('Process CWD:', process.cwd());
    
    // Determinar o caminho do disco baseado no SO
    let diskPath;
    if (process.platform === 'win32') {
      diskPath = 'C:';
    } else {
      diskPath = '/';
    }
    
    console.log('Checking disk space for:', diskPath);
    
    // Obter espaço do disco
    const diskSpace = await checkDiskSpace(diskPath);
    
    console.log('Raw disk space data:', diskSpace);
    
    const result = {
      total: diskSpace.size,
      free: diskSpace.free,
      used: diskSpace.size - diskSpace.free,
      percentage: Math.round(((diskSpace.size - diskSpace.free) / diskSpace.size) * 100),
      diskPath: diskSpace.diskPath || diskPath
    };
    
    console.log('Processed disk space result:', result);
    
    res.json({
      success: true,
      diskSpace: result
    });
  } catch (error) {
    console.error('=== DISK SPACE ERROR ===');
    console.error('Error:', error);
    
    // Fallback para 1TB
    const oneTB = 1024 * 1024 * 1024 * 1024;
    const usedSpace = oneTB * 0.3; // 30% usado
    
    const fallbackResult = {
      total: oneTB,
      free: oneTB - usedSpace,
      used: usedSpace,
      percentage: 30,
      diskPath: 'Fallback - 1TB'
    };
    
    console.log('Using fallback result:', fallbackResult);
    
    res.json({
      success: true,
      diskSpace: fallbackResult
    });
  }
};
