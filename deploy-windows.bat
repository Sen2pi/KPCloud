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
