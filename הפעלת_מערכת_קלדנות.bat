@echo off
chcp 65001 >nul
title מערכת קלדנות לעורכי ספרים
echo ========================================================
echo   מערכת קלדנות וארכיון פרודוקטיביות לעורכי ספרים
echo   מפעיל את האפליקציה בחלון שולחן עבודה עצמאי...
echo ========================================================

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$port = 38472; " ^
  "$url = 'http://localhost:' + $port + '/'; " ^
  "$folder = $PSScriptRoot; " ^
  "if (-not $folder) { $folder = (Get-Location).Path }; " ^
  "$listener = New-Object System.Net.HttpListener; " ^
  "$listener.Prefixes.Add($url); " ^
  "try { $listener.Start(); } catch { Start-Process $url; exit; } " ^
  "$launched = $false; " ^
  "while ($listener.IsListening) { " ^
  "  if (-not $launched) { " ^
  "    $launched = $true; " ^
  "    Start-Job -ScriptBlock { " ^
  "      param($u); Start-Sleep -Milliseconds 300; " ^
  "      try { Start-Process 'msedge' -ArgumentList ('--app=' + $u); } catch { " ^
  "        try { Start-Process 'chrome' -ArgumentList ('--app=' + $u); } catch { Start-Process $u; } " ^
  "      } " ^
  "    } -ArgumentList $url | Out-Null; " ^
  "  } " ^
  "  $ctx = $listener.GetContext(); " ^
  "  $req = $ctx.Request; $res = $ctx.Response; " ^
  "  $raw = $req.RawUrl.Split('?')[0].TrimStart('/'); " ^
  "  if ([string]::IsNullOrEmpty($raw)) { $raw = 'index.html' }; " ^
  "  $filePath = [System.IO.Path]::Combine($folder, $raw); " ^
  "  if (Test-Path $filePath -PathType Leaf) { " ^
  "    $bytes = [System.IO.File]::ReadAllBytes($filePath); " ^
  "    $ext = [System.IO.Path]::GetExtension($filePath).ToLower(); " ^
  "    switch ($ext) { " ^
  "      '.html' { $res.ContentType = 'text/html; charset=utf-8' } " ^
  "      '.js'   { $res.ContentType = 'application/javascript; charset=utf-8' } " ^
  "      '.css'  { $res.ContentType = 'text/css; charset=utf-8' } " ^
  "      '.json' { $res.ContentType = 'application/json' } " ^
  "      '.webmanifest' { $res.ContentType = 'application/manifest+json' } " ^
  "      '.svg'  { $res.ContentType = 'image/svg+xml' } " ^
  "      '.png'  { $res.ContentType = 'image/png' } " ^
  "      '.ico'  { $res.ContentType = 'image/x-icon' } " ^
  "      default { $res.ContentType = 'application/octet-stream' } " ^
  "    } " ^
  "    $res.ContentLength64 = $bytes.Length; " ^
  "    $res.OutputStream.Write($bytes, 0, $bytes.Length); " ^
  "    $res.Close(); " ^
  "  } else { " ^
  "    $res.StatusCode = 404; $res.Close(); " ^
  "  } " ^
  "}"
