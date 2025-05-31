# Instalar Node.js Windows Service
npm install -g node-windows

# Criar serviço para Backend
$service = @"
var Service = require('node-windows').Service;

var svc = new Service({
  name:'KPCloud Backend',
  description: 'KPCloud Backend Service',
  script: 'C:\\caminho\\para\\seu\\projeto\\backend\\server.js',
  env: [
    {
      name: "NODE_ENV",
      value: "production"
    },
    {
      name: "HOST", 
      value: "0.0.0.0"
    }
  ]
});

svc.on('install',function(){
  svc.start();
});

svc.install();
"@

$service | Out-File -FilePath "install-backend-service.js" -Encoding ASCII
node install-backend-service.js
