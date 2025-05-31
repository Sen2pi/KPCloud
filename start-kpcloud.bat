@echo off
chcp 65001 >nul
echo 🚀 Iniciando KPCloud...

REM Verificar se MongoDB está instalado e a correr
echo 📊 Verificando MongoDB...
sc query MongoDB >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ MongoDB não está instalado como serviço
    echo 📝 Tentando iniciar MongoDB manualmente...
    
    if exist "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" (
        start "MongoDB" "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath C:\data\db
    ) else if exist "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" (
        start "MongoDB" "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" --dbpath C:\data\db
    ) else (
        echo ❌ MongoDB não encontrado! Instale MongoDB primeiro.
        echo 🔗 Download: https://www.mongodb.com/try/download/community
        pause
        exit /b 1
    )
    
    echo ⏳ Aguardando MongoDB iniciar...
    timeout /t 10
)

REM Verificar se ficheiros .env existem
if not exist "backend\.env" (
    echo ❌ Ficheiro backend\.env não encontrado!
    echo 🔧 Execute deploy-windows.bat primeiro
    pause
    exit /b 1
)

REM Iniciar Backend
echo 🔧 Iniciando Backend na porta 5000...
start "KPCloud Backend" cmd /k "cd backend && npm start"

echo ⏳ Aguardando backend iniciar...
timeout /t 15

REM Verificar se backend iniciou
curl -s http://localhost:5000/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ Backend pode não ter iniciado corretamente
)

REM Iniciar Frontend
echo 🎨 Iniciando Frontend na porta 3000...
start "KPCloud Frontend" cmd /k "cd frontend && npm start"

echo ⏳ Aguardando frontend iniciar...
timeout /t 20

echo.
echo ✅ KPCloud iniciado!
echo.
echo 🌐 Acessos disponíveis:
for /f "tokens=*" %%a in ('curl -s https://api.ipify.org') do set PUBLIC_IP=%%a
echo 🏠 Local: http://localhost:3000
echo 🌍 Público: http://%PUBLIC_IP%:3000
echo 🔧 API: http://localhost:5000/api/health
echo.
echo 📝 Para parar: feche as janelas do CMD abertas
