@echo off
chcp 65001 >nul
echo 🚀 Iniciando deployment do KPCloud...

REM Verificar se estamos na pasta correta
if not exist "backend" (
    echo ❌ Erro: Execute este script na pasta raiz do projeto KPCloud
    echo 📁 Estrutura esperada: KPCloud\backend e KPCloud\frontend
    pause
    exit /b 1
)

REM Obter IP público
echo 🌐 Obtendo IP público...
for /f "tokens=*" %%a in ('curl -s https://api.ipify.org') do set PUBLIC_IP=%%a
echo ✅ IP Público detectado: %PUBLIC_IP%

REM Configurar backend
echo ⚙️ Configurando backend...
cd backend

REM Verificar se .env.example existe
if not exist ".env.example" (
    echo ❌ Ficheiro .env.example não encontrado!
    echo 📝 A criar .env.example...
    
    echo # Server Configuration > .env.example
    echo HOST=localhost >> .env.example
    echo PORT=5000 >> .env.example
    echo NODE_ENV=development >> .env.example
    echo FRONTEND_URL=http://localhost:3000 >> .env.example
    echo. >> .env.example
    echo # Database >> .env.example
    echo MONGODB_URI=mongodb://127.0.0.1:27017/kpcloud >> .env.example
    echo. >> .env.example
    echo # Security >> .env.example
    echo JWT_SECRET=your-super-secret-jwt-key-change-this >> .env.example
    echo. >> .env.example
    echo # Storage Configuration >> .env.example
    echo UPLOAD_PATH=C:\KPCloudStorage >> .env.example
    echo MAX_FILE_SIZE=100MB >> .env.example
    echo USER_QUOTA=10GB >> .env.example
)

REM Criar .env se não existir
if not exist ".env" (
    echo 📝 A criar .env a partir do .env.example...
    copy .env.example .env
)

REM Atualizar .env com IP público
echo 🔧 Atualizando configurações para IP público...
powershell -Command "(Get-Content .env) -replace 'FRONTEND_URL=.*', 'FRONTEND_URL=http://%PUBLIC_IP%:3000' | Set-Content .env"
powershell -Command "(Get-Content .env) -replace 'HOST=.*', 'HOST=0.0.0.0' | Set-Content .env"
powershell -Command "(Get-Content .env) -replace 'CORS_ORIGIN=.*', 'CORS_ORIGIN=http://%PUBLIC_IP%:3000,http://localhost:3000' | Set-Content .env"

echo ✅ Backend configurado!

REM Instalar dependências do backend
echo 📦 Instalando dependências do backend...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependências do backend
    pause
    exit /b 1
)

REM Configurar frontend
echo ⚙️ Configurando frontend...
cd ../frontend

REM Criar .env.local para desenvolvimento
echo REACT_APP_API_URL=http://localhost:5000/api > .env.local
echo REACT_APP_NAME=KPCloud >> .env.local
echo REACT_APP_DEBUG=true >> .env.local

REM Criar .env.production.local para produção
echo REACT_APP_API_URL=http://%PUBLIC_IP%:5000/api > .env.production.local
echo REACT_APP_NAME=KPCloud >> .env.production.local
echo REACT_APP_DEBUG=false >> .env.production.local

echo ✅ Frontend configurado!

REM Instalar dependências do frontend
echo 📦 Instalando dependências do frontend...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependências do frontend
    pause
    exit /b 1
)

REM Voltar para pasta raiz
cd ..

echo.
echo ✅ Deployment configurado com sucesso!
echo.
echo 📋 Informações importantes:
echo 🌐 IP Público: %PUBLIC_IP%
echo 🏠 Acesso Local: http://localhost:3000
echo 🌍 Acesso Público: http://%PUBLIC_IP%:3000
echo 🔧 API Local: http://localhost:5000/api
echo 🔧 API Pública: http://%PUBLIC_IP%:5000/api
echo.
echo 📝 Próximos passos:
echo 1. Configurar firewall: execute configure-firewall.bat
echo 2. Iniciar aplicação: execute start-kpcloud.bat
echo 3. Verificar conectividade: execute test-connection.ps1
echo.

pause
