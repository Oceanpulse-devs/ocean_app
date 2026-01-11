# PowerShell Script to Create .env Files
# Run this from the ocean-app root directory

Write-Host "🚀 Creating .env files for Ocean App..." -ForegroundColor Cyan
Write-Host ""

# Create Frontend .env
Write-Host "📝 Creating frontend .env file..." -ForegroundColor Yellow
$frontendEnv = @"
VITE_ADMIN_EMAIL=admin@oceanpulse.com
VITE_ADMIN_PASSWORD=oceanpulse2024
VITE_TESTER_API_URL=http://localhost:5002/api/testers
VITE_FEEDBACK_API_URL=http://localhost:5002/api/feedback
"@

try {
    $frontendEnv | Out-File -FilePath "oceanpulsewebsite\.env" -Encoding utf8 -Force
    Write-Host "✅ Frontend .env created: oceanpulsewebsite\.env" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create frontend .env: $_" -ForegroundColor Red
}

Write-Host ""

# Create Backend .env (only if it doesn't exist)
Write-Host "📝 Checking backend .env file..." -ForegroundColor Yellow

if (Test-Path "ocean_tester_server\.env") {
    Write-Host "⚠️  Backend .env already exists. Checking FRONTEND_URL..." -ForegroundColor Yellow
    
    $backendEnvContent = Get-Content "ocean_tester_server\.env" -Raw
    
    if ($backendEnvContent -notmatch "FRONTEND_URL") {
        Write-Host "   Adding FRONTEND_URL to existing .env..." -ForegroundColor Yellow
        Add-Content -Path "ocean_tester_server\.env" -Value "`nFRONTEND_URL=http://localhost:5173"
        Write-Host "✅ FRONTEND_URL added to backend .env" -ForegroundColor Green
    } else {
        Write-Host "✅ Backend .env already has FRONTEND_URL" -ForegroundColor Green
    }
} else {
    Write-Host "   Creating new backend .env file..." -ForegroundColor Yellow
    $backendEnv = @"
PORT=5002
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ocean_app_db
ADMIN_PASSWORD=oceanpulse2024
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
"@
    
    try {
        $backendEnv | Out-File -FilePath "ocean_tester_server\.env" -Encoding utf8 -Force
        Write-Host "✅ Backend .env created: ocean_tester_server\.env" -ForegroundColor Green
        Write-Host "⚠️  IMPORTANT: Update DB_PASSWORD in ocean_tester_server\.env" -ForegroundColor Yellow
    } catch {
        Write-Host "❌ Failed to create backend .env: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 Done! Next steps:" -ForegroundColor Cyan
Write-Host "1. Update DB_PASSWORD in ocean_tester_server\.env (if newly created)" -ForegroundColor White
Write-Host "2. Restart both servers:" -ForegroundColor White
Write-Host "   - Backend: cd ocean_tester_server && npm run dev" -ForegroundColor Gray
Write-Host "   - Frontend: cd oceanpulsewebsite && npm run dev" -ForegroundColor Gray
Write-Host ""
