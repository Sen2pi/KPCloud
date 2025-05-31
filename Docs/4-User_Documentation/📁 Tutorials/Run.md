## 🖥️ Configuração do Servidor Windows para Acesso Público

### 1. **Configurar o Backend para Escutar em Todas as Interfaces**

**backend/server.js** - Atualizar configuração:

```javascript
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0'; // IMPORTANTE: escutar em todas as interfaces

// ... resto da configuração

server.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor KPCloud a correr em http://${HOST}:${PORT}`);
  console.log(`🌐 Acesso público: http://SEU_IP_PUBLICO:${PORT}`);
  console.log('📍 Rotas disponíveis:');
  console.log('  - GET  /');
  console.log('  - POST /api/auth/register');
  console.log('  - POST /api/auth/login');
  console.log('  - GET  /api/auth/profile');
  console.log('  - GET  /api/health');
});
```


### 2. **Configurar Variáveis de Ambiente**

**backend/.env**:

```env
# Configuração para acesso público
HOST=0.0.0.0
PORT=5000
FRONTEND_URL=http://SEU_IP_PUBLICO:3000

# Permitir CORS para IP público
CORS_ORIGIN=http://SEU_IP_PUBLICO:3000,http://localhost:3000

# Outras configurações
MONGODB_URI=mongodb://127.0.0.1:27017/kpcloud
JWT_SECRET=your-super-secret-jwt-key
UPLOAD_PATH=C:\KPCloudStorage
```


### 3. **Configurar Frontend para Produção**

**src/services/api.js** - Configuração dinâmica:

```javascript
// Detectar ambiente automaticamente
const getAPIBaseURL = () => {
  if (process.env.NODE_ENV === 'production') {
    // Em produção, usar IP do servidor atual
    const currentHost = window.location.hostname;
    return `http://${currentHost}:5000/api`;
  }
  
  // Em desenvolvimento
  return process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getAPIBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```


### 4. **Configurar Firewall do Windows**

#### Opção A: Via Interface Gráfica

```bash
# 1. Abrir "Windows Defender Firewall com Segurança Avançada"
# 2. Clicar em "Regras de Entrada"
# 3. Clicar em "Nova Regra..."
# 4. Selecionar "Porta" > Próximo
# 5. Selecionar "TCP" > Portas Específicas Locais: 3000,5000
# 6. Selecionar "Permitir a conexão"
# 7. Aplicar a todos os perfis (Domínio, Privado, Público)
# 8. Nome: "KPCloud - Portas 3000 e 5000"
```


#### Opção B: Via PowerShell (Como Administrador)

```powershell
# Abrir portas para KPCloud
New-NetFirewallRule -DisplayName "KPCloud Frontend" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
New-NetFirewallRule -DisplayName "KPCloud Backend" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow

# Verificar se as regras foram criadas
Get-NetFirewallRule -DisplayName "*KPCloud*"
```


### 5. **Descobrir seu IP Público**

```powershell
# Método 1: PowerShell
Invoke-RestMethod -Uri "https://api.ipify.org?format=json"

# Método 2: Via CMD
curl https://api.ipify.org

# Método 3: Via browser
# Aceder a https://whatismyipaddress.com/
```


### 6. **Script de Deployment Automático**

**deploy-windows.bat**:

```batch
@echo off
echo 🚀 Iniciando deployment do KPCloud...

REM Obter IP público
echo 🌐 Obtendo IP público...
for /f "tokens=*" %%a in ('curl -s https://api.ipify.org') do set PUBLIC_IP=%%a
echo IP Público detectado: %PUBLIC_IP%

REM Configurar backend
echo ⚙️ Configurando backend...
cd backend
copy .env.example .env
powershell -Command "(gc .env) -replace 'FRONTEND_URL=.*', 'FRONTEND_URL=http://%PUBLIC_IP%:3000' | Out-File -encoding ASCII .env"
powershell -Command "(gc .env) -replace 'HOST=.*', 'HOST=0.0.0.0' | Out-File -encoding ASCII .env"

REM Instalar dependências
echo 📦 Instalando dependências do backend...
npm install

REM Configurar frontend
echo ⚙️ Configurando frontend...
cd ../frontend
echo REACT_APP_API_URL=http://%PUBLIC_IP%:5000/api > .env.production.local

REM Instalar dependências
echo 📦 Instalando dependências do frontend...
npm install

echo ✅ Deployment configurado!
echo 🌐 Frontend: http://%PUBLIC_IP%:3000
echo 🔧 Backend: http://%PUBLIC_IP%:5000
echo 📝 Para iniciar: execute start-kpcloud.bat

pause
```

**start-kpcloud.bat**:

```batch
@echo off
echo 🚀 Iniciando KPCloud...

REM Iniciar MongoDB (se não estiver como serviço)
echo 📊 Verificando MongoDB...
sc query MongoDB >nul 2>&1
if %errorlevel% neq 0 (
    echo Iniciando MongoDB...
    start "MongoDB" cmd /k "mongod --dbpath C:\data\db"
    timeout /t 5
)

REM Iniciar Backend
echo 🔧 Iniciando Backend...
start "KPCloud Backend" cmd /k "cd backend && npm start"

REM Aguardar backend iniciar
timeout /t 10

REM Iniciar Frontend
echo 🎨 Iniciando Frontend...
start "KPCloud Frontend" cmd /k "cd frontend && npm start"

echo ✅ KPCloud iniciado!
echo 🌐 Acesse: http://localhost:3000 (local) ou http://SEU_IP_PUBLICO:3000 (público)
```


### 7. **Configuração de Proxy Reverso com IIS (Opcional)**

Se quiser usar porta 80 (HTTP padrão):

**web.config** para IIS:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <!-- Proxy para Frontend -->
                <rule name="Frontend" stopProcessing="true">
                    <match url="^(?!api/)(.*)" />
                    <action type="Rewrite" url="http://localhost:3000/{R:1}" />
                </rule>
                
                <!-- Proxy para Backend API -->
                <rule name="Backend API" stopProcessing="true">
                    <match url="^api/(.*)" />
                    <action type="Rewrite" url="http://localhost:5000/api/{R:1}" />
                </rule>
            </rules>
        </rewrite>
    </system.webServer>
</configuration>
```


### 8. **Verificação e Testes**

**test-connection.ps1**:

```powershell
# Script para testar conectividade
param(
    [string]$PublicIP = (Invoke-RestMethod -Uri "https://api.ipify.org?format=text")
)

Write-Host "🧪 Testando conectividade do KPCloud..." -ForegroundColor Green
Write-Host "IP Público: $PublicIP" -ForegroundColor Yellow

# Testar Backend
try {
    $backend = Invoke-RestMethod -Uri "http://${PublicIP}:5000/api/health" -TimeoutSec 10
    Write-Host "✅ Backend: Funcionando" -ForegroundColor Green
    Write-Host "   Status: $($backend.status)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Backend: Erro de conexão" -ForegroundColor Red
    Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Gray
}

# Testar Frontend
try {
    $frontend = Invoke-WebRequest -Uri "http://${PublicIP}:3000" -TimeoutSec 10 -UseBasicParsing
    Write-Host "✅ Frontend: Funcionando" -ForegroundColor Green
    Write-Host "   Código: $($frontend.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Frontend: Erro de conexão" -ForegroundColor Red
    Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Gray
}

# Testar portas
Write-Host "`n🔍 Testando portas..." -ForegroundColor Blue
Test-NetConnection -ComputerName $PublicIP -Port 3000
Test-NetConnection -ComputerName $PublicIP -Port 5000
```


### 9. **Configuração de Serviço Windows (Produção)**

**install-service.ps1** (Executar como Administrador):

```powershell
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
```


### 10. **Checklist Final**

- [ ] ✅ Backend configurado para `HOST=0.0.0.0`
- [ ] ✅ Firewall configurado (portas 3000, 5000)
- [ ] ✅ IP público descoberto
- [ ] ✅ Frontend apontando para IP público
- [ ] ✅ MongoDB a correr
- [ ] ✅ Testes de conectividade passou
- [ ] ✅ CORS configurado corretamente


### 🌐 **Acesso Final**

Após todas as configurações:

- **Frontend**: `http://SEU_IP_PUBLICO:3000`
- **Backend API**: `http://SEU_IP_PUBLICO:5000/api`
- **Health Check**: `http://SEU_IP_PUBLICO:5000/api/health`


### ⚠️ **Considerações de Segurança**

```bash
# 1. Usar HTTPS em produção
# 2. Configurar rate limiting mais restritivo
# 3. Usar reverse proxy (nginx/IIS)
# 4. Configurar backup automático
# 5. Monitorizar logs de acesso
```

Agora o teu KPCloud está acessível publicamente via IP! 🚀

<div style="text-align: center">⁂</div>

[^1]: https://pt.stackoverflow.com/questions/384017/como-abrir-um-servidor-local-usando-node

[^2]: https://www.luiztools.com.br/post/deploy-de-aplicacao-node-js-na-digital-ocean/

[^3]: https://saveincloud.com/pt/blog/web-aplicacao/configuracao-servidor-dotnet-no-windows/

[^4]: https://www.youtube.com/watch?v=tgFViGwOJhQ

[^5]: https://stackoverflow.com/questions/5489956/how-could-others-on-a-local-network-access-my-nodejs-app-while-its-running-on

[^6]: https://learn.microsoft.com/pt-br/aspnet/web-forms/overview/deployment/configuring-server-environments-for-web-deployment/configuring-a-web-server-for-web-deploy-publishing-web-deploy-handler

[^7]: https://www.devmedia.com.br/construindo-um-servidor-web-com-node-js/32023

[^8]: https://www.reddit.com/r/node/comments/g7pnf4/how_can_i_access_my_nodejs_server_thats_running/?tl=pt-br

[^9]: https://www.youtube.com/live/163jmMqvGmY

[^10]: https://cursos.alura.com.br/forum/topico-publicar-o-projeto-no-servidor-vps-199386

