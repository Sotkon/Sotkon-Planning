@"
# =========================================
# DEVELOPMENT MODE
# Hot-reload, rápido para testar mudanças
# =========================================

Write-Host ''
Write-Host '🚀 MODO DESENVOLVIMENTO' -ForegroundColor Cyan
Write-Host '================================' -ForegroundColor Cyan
Write-Host ''

# Verificar se Prisma Client existe
if (-not (Test-Path 'node_modules\.prisma')) {
    Write-Host '📦 Gerando Prisma Client...' -ForegroundColor Yellow
    npx prisma generate
}

Write-Host '🔥 Iniciando servidor desenvolvimento...' -ForegroundColor Green
Write-Host '   URL: http://localhost:3000' -ForegroundColor Gray
Write-Host '   Pressiona Ctrl+C para parar' -ForegroundColor Gray
Write-Host ''

npm run dev
"@ | Out-File -FilePath dev.ps1 -Encoding UTF8

Write-Host "✅ Criado: dev.ps1" -ForegroundColor Green