param(
  [string]$DbUrl = "postgresql://neondb_owner:npg_CW0U3MPTnesw@ep-long-lake-atvfc2iq.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require"
)

$env:DATABASE_URL = $DbUrl
$env:BETTER_AUTH_URL = "http://localhost:3000"
$env:BETTER_AUTH_SECRET = "50ce7e851dd45f8b295c92324803861417b6f49a2567b722b55ce8226499ceba"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $scriptDir
Set-Location $projectDir

Write-Host "========================================"
Write-Host "🔧 Starting Next.js dev server..."
Write-Host "========================================"
$process = Start-Process -NoNewWindow -PassThru -FilePath "npx" -ArgumentList "next dev -p 3000"
Start-Sleep 20

# Test function
function Test-Endpoint {
  param([string]$Method, [string]$Path, [string]$Body, [string]$TestName)
  Write-Host ""
  Write-Host "📌 $TestName"
  try {
    if ($Body) {
      $r = Invoke-RestMethod -Uri "http://localhost:3000$Path" -Method $Method -ContentType "application/json" -Body $Body -TimeoutSec 15 -ErrorAction Stop
      Write-Host "   ✅ Success"
      return $r
    } else {
      $r = Invoke-RestMethod -Uri "http://localhost:3000$Path" -Method $Method -TimeoutSec 15 -ErrorAction Stop
      Write-Host "   ✅ Success"
      return $r
    }
  } catch {
    Write-Host "   ❌ $($_.Exception.Message)"
    return $null
  }
}

# 1. Sign Up
$signUp = Test-Endpoint -Method POST -Path "/api/auth/sign-up/email" -Body '{"email":"authtest@lumora.ai","password":"TestPass1234","name":"Auth Test User"}' -TestName "1. Sign Up"
if ($signUp) { Write-Host "   User ID: $($signUp.user.id)" }

# 2. Sign In
$signIn = Test-Endpoint -Method POST -Path "/api/auth/sign-in/email" -Body '{"email":"authtest@lumora.ai","password":"TestPass1234"}' -TestName "2. Sign In"
if ($signIn -and $signIn.token) { Write-Host "   Token: $($signIn.token)" }

# 3. Send OTP
$otpSent = Test-Endpoint -Method POST -Path "/api/auth/email-otp/send-verification" -Body '{"email":"authtest@lumora.ai","type":"sign-in"}' -TestName "3. Send OTP"

# 4. Get session
$session = Test-Endpoint -Method GET -Path "/api/auth/session" -TestName "4. Get Session"

# 5. Sign Out
$signOut = Test-Endpoint -Method POST -Path "/api/auth/sign-out" -TestName "5. Sign Out"

# 6. Forgot Password (send OTP)
$forgotPw = Test-Endpoint -Method POST -Path "/api/auth/email-otp/send-verification" -Body '{"email":"authtest@lumora.ai","type":"forget-password"}' -TestName "6. Forgot Password (send OTP)"

# 7. Reset Password (verify OTP)
$resetPw = Test-Endpoint -Method POST -Path "/api/auth/email-otp/verify" -Body '{"email":"authtest@lumora.ai","otp":"000000","type":"forget-password"}' -TestName "7. Reset Password (verify OTP)"

Write-Host ""
Write-Host "========================================"
Write-Host "🛑 Tests complete. Cleaning up..."
Write-Host "========================================"
Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
taskkill /F /IM node.exe 2>$null
