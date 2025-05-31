param(
    [string]$PublicIP = "185.128.9.70"
)

# Descobrir IP local
$LocalIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*"})[0].IPAddress

Write-Host "🔍 Teste de Port Forwarding" -ForegroundColor Green
Write-Host "IP Local: $LocalIP" -ForegroundColor Yellow
Write-Host "IP Público: $PublicIP" -ForegroundColor Yellow
Write-Host ("-" * 40)

# Teste 1: Verificar se servidor local responde
Write-Host "1. 🏠 Testando servidor local..." -ForegroundColor Blue
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -TimeoutSec 5
    Write-Host "✅ Backend local: $($response.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend local falhou" -ForegroundColor Red
}

# Teste 2: Verificar se servidor responde via IP local
Write-Host "2. 🌐 Testando via IP local..." -ForegroundColor Blue
try {
    $response = Invoke-RestMethod -Uri "http://${LocalIP}:5000/api/health" -TimeoutSec 5
    Write-Host "✅ Backend via IP local: $($response.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend via IP local falhou" -ForegroundColor Red
}

# Teste 3: Tentar via IP público (pode falhar por NAT hairpinning)
Write-Host "3. 🌍 Testando via IP público..." -ForegroundColor Blue
try {
    $response = Invoke-RestMethod -Uri "http://${PublicIP}:5000/api/health" -TimeoutSec 10
    Write-Host "✅ Backend via IP público: $($response.status)" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Backend via IP público falhou (normal devido a NAT hairpinning)" -ForegroundColor Yellow
}

Write-Host "`n📋 INSTRUÇÕES DE PORT FORWARDING:" -ForegroundColor Cyan
Write-Host "1. Aceder ao router: http://192.168.1.1 ou http://192.168.0.1" -ForegroundColor White
Write-Host "2. Procurar 'Port Forwarding' ou 'Virtual Servers'" -ForegroundColor White
Write-Host "3. Adicionar regra: Porta 3000 → $LocalIP:3000" -ForegroundColor White
Write-Host "4. Adicionar regra: Porta 5000 → $LocalIP:5000" -ForegroundColor White
Write-Host "5. Testar com dados móveis: http://${PublicIP}:3000" -ForegroundColor White
