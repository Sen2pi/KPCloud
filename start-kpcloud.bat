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
