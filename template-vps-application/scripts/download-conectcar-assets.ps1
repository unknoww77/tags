$dest = "c:\Users\nw\Desktop\tags\template-vps-application\public\brands\conectcar"
New-Item -ItemType Directory -Force -Path $dest | Out-Null

$urls = @{
  "logo-header.png" = "https://conectcar.com/wp-content/themes/conectcar/assets/images/menu-logo-conectcar.png"
  "logo-footer.png" = "https://conectcar.com/wp-content/uploads/2022/07/logo-conectcar-footer-1.png"
  "hero-banner.png" = "https://conectcar.com/wp-content/uploads/2026/05/250519_banner_home_NP.png"
  "badge-appstore.png" = "https://conectcar.com/wp-content/uploads/2022/08/disponivel-na-app-store-botao-1-300x89.png"
  "badge-googleplay.png" = "https://conectcar.com/wp-content/uploads/2022/08/disponivel-google-play-badge-1-e1661902266479-300x89.png"
  "icon-pedagio.png" = "https://conectcar.com/wp-content/uploads/2022/09/pedagio-150x150.png"
  "icon-freeflow.png" = "https://conectcar.com/wp-content/uploads/2024/04/Ativo-1@4x.png"
  "icon-estacionamento.png" = "https://conectcar.com/wp-content/uploads/2022/09/estacionamento1-150x150.png"
  "icon-estacionamento2.png" = "https://conectcar.com/wp-content/uploads/2022/09/estacionamento2-150x150.png"
  "icon-escola.png" = "https://conectcar.com/wp-content/uploads/2022/09/escola-150x150.png"
  "icon-estadio.png" = "https://conectcar.com/wp-content/uploads/2022/09/estadio-150x150.png"
  "frota.png" = "https://conectcar.com/wp-content/uploads/elementor/thumbs/frota_hm-qjv1f3yd042cp9x0ey9eh8lhgf5ppt4ltfbu3ug9vk.png"
  "pagamento.jpg" = "https://conectcar.com/wp-content/uploads/elementor/thumbs/shutterstock_2006035988-scaled-qo7s7lpn03x093r461xx51es4y7is21onc9f43gkhw.jpg"
  "partner-itau.png" = "https://conectcar.com/wp-content/uploads/2024/10/tag-1.png"
  "partner-porto.png" = "https://conectcar.com/wp-content/uploads/2024/04/tag-porto-bank-300x75.png"
  "partner-mp.png" = "https://conectcar.com/wp-content/uploads/2024/05/mercado-pago-e1715787507143.png"
  "partner-localiza.png" = "https://conectcar.com/wp-content/uploads/2024/04/tag-localiza-300x78.png"
  "partner-segsat.png" = "https://conectcar.com/wp-content/uploads/2024/05/segsat-300x75.png"
  "partner-unicred.png" = "https://conectcar.com/wp-content/uploads/2024/05/unicred-300x75.png"
  "partner-uniprime.png" = "https://conectcar.com/wp-content/uploads/2024/05/Uniprime-300x75.png"
  "partner-maxifrota.png" = "https://conectcar.com/wp-content/uploads/2024/05/maxifrota-300x79.png"
  "partner-meoo.png" = "https://conectcar.com/wp-content/uploads/2024/05/localiza-meoo-300x75.png"
  "iso-27001.png" = "https://conectcar.com/wp-content/uploads/2022/12/Certificacao_ISO27001_IQNET.png"
  "iso-9001.png" = "https://conectcar.com/wp-content/uploads/2022/12/Certificacao_ISO9001_IQNET.png"
  "social-ig.png" = "https://conectcar.com/wp-content/uploads/2022/07/footer-instagram.png"
  "social-fb.png" = "https://conectcar.com/wp-content/uploads/2022/07/footer-facebook.png"
  "social-li.png" = "https://conectcar.com/wp-content/uploads/2022/07/footer-linkedin.png"
  "social-yt.png" = "https://conectcar.com/wp-content/uploads/2024/05/icone_youutbe.png"
  "sua-marca.png" = "https://conectcar.com/wp-content/uploads/elementor/thumbs/sua-marca-tag-2-q2bt00at3leq6s3oy2mw7du1a2snkyuww3ni4o69z4.png"
  "selos.png" = "https://conectcar.com/wp-content/uploads/2026/06/Selos-e-Premios.png"
  "acionistas.png" = "https://conectcar.com/wp-content/uploads/2024/05/acionistas_rodape-3.png"
  "atencao.png" = "https://conectcar.com/wp-content/uploads/2025/12/atencao2-1024x926.png"
}

foreach ($k in $urls.Keys) {
  try {
    Invoke-WebRequest -Uri $urls[$k] -OutFile (Join-Path $dest $k) -UseBasicParsing
    Write-Host "OK $k"
  } catch {
    Write-Host "FAIL $k : $_"
  }
}

Get-ChildItem $dest | Select-Object Name, Length
