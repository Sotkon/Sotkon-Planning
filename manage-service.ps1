# =========================================
# GESTÃO SERVIÇO PLANNING APP
# =========================================

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('start', 'stop', 'restart', 'status', 'logs', 'edit')]
    [string]$Action = 'status'
)

$ServiceName = 'PlanningApp'
$NssmPath = 'C:\Apps\nssm.exe'
$LogPath = 'C:\Apps\Sotkon-Planning\logs'

switch ($Action) {
    'start' {
        Write-Host '🚀 Iniciando serviço...' -ForegroundColor Green
        & $NssmPath start $ServiceName
        Start-Sleep -Seconds 2
        & $NssmPath status $ServiceName
    }
    'stop' {
        Write-Host '🛑 Parando serviço...' -ForegroundColor Yellow
        & $NssmPath stop $ServiceName
        Start-Sleep -Seconds 2
        & $NssmPath status $ServiceName
    }
    'restart' {
        Write-Host '🔄 Reiniciando serviço...' -ForegroundColor Cyan
        & $NssmPath restart $ServiceName
        Start-Sleep -Seconds 2
        & $NssmPath status $ServiceName
    }
    'status' {
        Write-Host '📊 Status do serviço:' -ForegroundColor Cyan
        & $NssmPath status $ServiceName
        Write-Host ''
        Write-Host '🌐 Testando HTTP...' -ForegroundColor Cyan
        try {
            $response = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 5
            Write-Host "   ✅ Aplicação responde (HTTP $($response.StatusCode))" -ForegroundColor Green
        } catch {
            Write-Host '   ❌ Aplicação não responde' -ForegroundColor Red
        }
    }
    'logs' {
        Write-Host '📝 ÚLTIMAS 30 LINHAS - OUTPUT LOG:' -ForegroundColor Cyan
        Write-Host '=================================' -ForegroundColor Gray
        Get-Content "$LogPath\output.log" -Tail 30
        Write-Host ''
        Write-Host '❌ ÚLTIMAS 30 LINHAS - ERROR LOG:' -ForegroundColor Yellow
        Write-Host '=================================' -ForegroundColor Gray
        if (Test-Path "$LogPath\error.log") {
            Get-Content "$LogPath\error.log" -Tail 30
        } else {
            Write-Host '(vazio)' -ForegroundColor Gray
        }
    }
    'edit' {
        Write-Host '⚙️  Abrindo configuração GUI...' -ForegroundColor Cyan
        & $NssmPath edit $ServiceName
    }
}
