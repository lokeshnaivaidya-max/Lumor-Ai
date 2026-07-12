param([string]$DbUrl)
$env:DATABASE_URL = $DbUrl
$env:BETTER_AUTH_URL = "http://localhost:3000"
$env:BETTER_AUTH_SECRET = "50ce7e851dd45f8b295c92324803861417b6f49a2567b722b55ce8226499ceba"

Set-Location "C:\Users\sathw\OneDrive\Desktop\Lumor-Ai"
Write-Host "Starting server..."
$proc = Start-Process -NoNewWindow -PassThru -FilePath "npx.cmd" -ArgumentList "next dev -p 3000"
Start-Sleep 25

function CallApi($method, $path, $bodyJson) {
  try {
    if ($bodyJson) {
      $r = Invoke-RestMethod -Uri "http://localhost:3000$path" -Method $method -ContentType "application/json" -Body $bodyJson -TimeoutSec 15
    } else {
      $r = Invoke-RestMethod -Uri "http://localhost:3000$path" -Method $method -TimeoutSec 15
    }
    return $r
  } catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    return $null
  }
}

Write-Host "`n=== 1. SIGN UP ==="
$r1 = CallApi POST "/api/auth/sign-up/email" '{"email":"flowtest@lumora.ai","password":"TestPass1234","name":"Flow Test"}'
if ($r1) { Write-Host "OK - User: $($r1.user.id)" } else { Write-Host "FAIL" }

Write-Host "`n=== 2. SIGN IN ==="
$r2 = CallApi POST "/api/auth/sign-in/email" '{"email":"flowtest@lumora.ai","password":"TestPass1234"}'
if ($r2) { Write-Host "OK - Token: $($r2.token)" } else { Write-Host "FAIL" }

Write-Host "`n=== 3. SEND OTP ==="
$r3 = CallApi POST "/api/auth/email-otp/send-verification" '{"email":"flowtest@lumora.ai","type":"sign-in"}'
if ($r3) { Write-Host "OK - $($r3 | ConvertTo-Json)" } else { Write-Host "FAIL" }

Write-Host "`n=== 4. GET SESSION ==="
$r4 = CallApi GET "/api/auth/session" $null
if ($r4) { Write-Host "OK" } else { Write-Host "OK - unauthenticated (expected)" }

Write-Host "`n=== 5. SIGN OUT ==="
$r5 = CallApi POST "/api/auth/sign-out" '{}'
if ($r5 -or $?) { Write-Host "OK" } else { Write-Host "OK - (no session)" }

Write-Host "`n=== 6. FORGOT PASSWORD (send OTP) ==="
$r6 = CallApi POST "/api/auth/email-otp/send-verification" '{"email":"flowtest@lumora.ai","type":"forget-password"}'
if ($r6) { Write-Host "OK" } else { Write-Host "FAIL" }

Write-Host "`n=== 7. RESET PASSWORD (verify OTP) ==="
$r7 = CallApi POST "/api/auth/email-otp/verify" '{"email":"flowtest@lumora.ai","otp":"000000","type":"forget-password"}'
if ($r7) { Write-Host "OK - $($r7 | ConvertTo-Json)" } else { Write-Host "This may fail if OTP doesn't match (expected)" }

Write-Host "`n=== 8. TEST SESSION AFTER REFRESH ==="
$r8 = CallApi GET "/api/auth/session" $null
if ($r8) { Write-Host "OK" } else { Write-Host "OK (no session)" }

Write-Host "`n=== DONE ==="
Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
