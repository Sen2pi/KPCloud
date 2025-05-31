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
