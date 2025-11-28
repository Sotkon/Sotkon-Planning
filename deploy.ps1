# =========================================
# DEPLOY TO STANDALONE (PRODUCTION)
# Build completo + copiar tudo para standalone
# Usar com NSSM ou servidor produção
# =========================================

Write-Host ''
Write-Host '🚀 DEPLOY PARA PRODUÇÃO (STANDALONE)' -ForegroundColor Cyan
Write-Host '======================================' -ForegroundColor Cyan
Write-Host ''

# 1. Gerar Prisma
Write-Host '📦 1/6 Gerando Prisma Client...' -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) { Write-Host '❌ Erro no Prisma Generate' -ForegroundColor Red; exit 1 }

# 2. Build
Write-Host '🏗️  2/6 Building Next.js...' -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host '❌ Erro no Build' -ForegroundColor Red; exit 1 }

# 3. Copiar .env
Write-Host '📋 3/6 Copiando .env...' -ForegroundColor Yellow
Copy-Item .env .next\standalone\.env -Force

# 4. Copiar static assets
Write-Host '📂 4/6 Copiando static assets...' -ForegroundColor Yellow
Copy-Item -Recurse -Force .next\static .next\standalone\.next\static

# 5. Copiar public
if (Test-Path public) {
    Write-Host '📁 5/6 Copiando public...' -ForegroundColor Yellow
    Copy-Item -Recurse -Force public .next\standalone\public
} else {
    Write-Host '⏭️  5/6 Sem pasta public' -ForegroundColor Gray
}

# 6. Copiar Prisma Client
Write-Host '🔧 6/6 Copiando Prisma Client...' -ForegroundColor Yellow
Copy-Item -Recurse -Force node_modules\.prisma .next\standalone\node_modules\
Copy-Item -Recurse -Force node_modules\@prisma .next\standalone\node_modules\

Write-Host ''
Write-Host '✅ DEPLOY COMPLETO!' -ForegroundColor Green
Write-Host ''
Write-Host '📍 Ficheiros prontos em: .next\standalone\' -ForegroundColor Cyan
Write-Host ''
