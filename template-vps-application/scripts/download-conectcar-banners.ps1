$dest = "c:\Users\nw\Desktop\tags\template-vps-application\public\brands\conectcar\banners"
New-Item -ItemType Directory -Force -Path $dest | Out-Null

$urls = @{
  "01-plano-completo.png" = "https://conectcar.com/wp-content/uploads/2026/05/250519_banner_home_NP.png"
  "02-master-driver.png" = "https://conectcar.com/wp-content/uploads/2026/08/MASTER-DRIVER-Banner-LP-PF_desktop-v2.png"
  "03-mgm.png" = "https://conectcar.com/wp-content/uploads/2026/03/MGM40-20_BannerDesk-scaled.png"
  "04-plano-basico.png" = "https://conectcar.com/wp-content/uploads/2026/05/250521_banner_home_Plano_basico1.png"
  "05-freeflow.webp" = "https://conectcar.com/wp-content/uploads/2026/04/Free-Flow-Isencao-Multas_BannerDesk-scaled.webp"
  "06-nova-home.gif" = "https://conectcar.com/wp-content/uploads/2024/05/Banner_NovaHome_Desk02.gif"
}

foreach ($k in $urls.Keys) {
  try {
    Invoke-WebRequest -Uri $urls[$k] -OutFile (Join-Path $dest $k) -UseBasicParsing
    Write-Host "OK $k"
  } catch {
    Write-Host "FAIL $k : $_"
  }
}

Get-ChildItem $dest | Select-Object Name, Length | Format-Table -AutoSize
