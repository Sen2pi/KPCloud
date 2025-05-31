@echo off
echo 🔥 Configurando Firewall do Windows...

REM Verificar se está a executar como Administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Este script deve ser executado como Administrador
    echo 👆 Clique com botão direito e selecione "Executar como Administrador"
    pause
    exit /b 1
)

echo 🔓 Abrindo porta 3000 (Frontend)...
netsh advfirewall firewall add rule name="KPCloud Frontend" dir=in action=allow protocol=TCP localport=3000

echo 🔓 Abrindo porta 5000 (Backend)...
netsh advfirewall firewall add rule name="KPCloud Backend" dir=in action=allow protocol=TCP localport=5000

echo 🔓 Abrindo porta 27017 (MongoDB)...
netsh advfirewall firewall add rule name="KPCloud MongoDB" dir=in action=allow protocol=TCP localport=27017

echo ✅ Firewall configurado com sucesso!
echo.
echo 📋 Regras criadas:
netsh advfirewall firewall show rule name="KPCloud Frontend"
netsh advfirewall firewall show rule name="KPCloud Backend"
netsh advfirewall firewall show rule name="KPCloud MongoDB"

pause
