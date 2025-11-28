@"
# =========================================
# TEST PRODUCTION BUILD LOCALLY
# Build + test local (sem copiar standalone)
# =========================================

Write-Host ''
Write-Host '🧪 TESTAR BUILD PRODUÇÃO LOCALMENTE' -ForegroundColor Cyan
Write-Host '=====================================' -ForegroundColor Cyan
Write-Host ''

# 1. Gerar Prisma
Write-Host '📦 1/3 Gerando Prisma Client...' -ForegroundColor Yellow
npx prisma generate

# 2. Build
Write-Host '🏗️  2/3 Building Next.js...' -ForegroundColor Yellow
npm run build

# 3. Iniciar
Write-Host '🚀 3/3 Iniciando servidor produção...' -ForegroundColor Green
Write-Host '   URL: http://localhost:3000' -ForegroundColor Gray
Write-Host '   Pressiona Ctrl+C para parar' -ForegroundColor Gray
Write-Host ''

npm start
"@ | Out-File -FilePath test-prod.ps1 -Encoding UTF8

Write-Host "✅ Criado: test-prod.ps1" -ForegroundColor Green