# Dump visual/CSS/HTML da ConectCar (LP planos + home).
# Uso: powershell -ExecutionPolicy Bypass -File scripts/dump-conectcar.ps1
# Saida: scripts/conectcar-dump/

$ErrorActionPreference = "Stop"
$OutDir = Join-Path $PSScriptRoot "conectcar-dump"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $OutDir "assets") | Out-Null

$Urls = @(
  "https://lp.conectcar.com/planos",
  "https://conectcar.com/",
  "https://conectcar.com/para-voce/"
)

$Headers = @{
  "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
  "Accept"     = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
}

function Save-UrlHtml([string]$Url, [string]$Name) {
  Write-Host "GET $Url"
  $resp = Invoke-WebRequest -Uri $Url -Headers $Headers -UseBasicParsing
  $htmlPath = Join-Path $OutDir "$Name.html"
  [System.IO.File]::WriteAllText($htmlPath, $resp.Content, [System.Text.UTF8Encoding]::new($false))
  Write-Host "  -> $htmlPath ($($resp.Content.Length) bytes)"

  # Extrai CSS linkados e inline
  $cssLinks = [regex]::Matches($resp.Content, '(?i)<link[^>]+href=["'']([^"'']+\.css[^"'']*)["'']') |
    ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
  $cssInline = [regex]::Matches($resp.Content, '(?is)<style[^>]*>(.*?)</style>') |
    ForEach-Object { $_.Groups[1].Value }

  $i = 0
  foreach ($href in $cssLinks) {
    $i++
    try {
      $abs = if ($href -match '^https?://') { $href } else { [Uri]::new([Uri]$Url, $href).AbsoluteUri }
      $css = (Invoke-WebRequest -Uri $abs -Headers $Headers -UseBasicParsing).Content
      $fname = "css-$Name-$i.css"
      [System.IO.File]::WriteAllText((Join-Path $OutDir $fname), $css, [System.Text.UTF8Encoding]::new($false))
      Write-Host "  CSS $fname ($($css.Length) bytes)"
    } catch {
      Write-Host "  skip CSS $href : $_"
    }
  }

  if ($cssInline.Count -gt 0) {
    $joined = ($cssInline -join "`n/* --- inline --- */`n")
    [System.IO.File]::WriteAllText((Join-Path $OutDir "inline-$Name.css"), $joined, [System.Text.UTF8Encoding]::new($false))
    Write-Host "  inline-$Name.css ($($joined.Length) bytes)"
  }

  # Extrai URLs de imagem (limitado)
  $imgs = [regex]::Matches($resp.Content, '(?i)(?:src|href)=["'']([^"'']+\.(?:png|jpe?g|webp|svg|gif)[^"'']*)["'']') |
    ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique | Select-Object -First 80
  $manifest = @()
  foreach ($img in $imgs) {
    try {
      $abs = if ($img -match '^https?://') { $img } elseif ($img.StartsWith('//')) { "https:$img" } else { [Uri]::new([Uri]$Url, $img).AbsoluteUri }
      $leaf = ($abs -split '/')[-1] -replace '[?#].*$',''
      if (-not $leaf) { continue }
      $dest = Join-Path (Join-Path $OutDir "assets") "$Name-$leaf"
      if (-not (Test-Path $dest)) {
        Invoke-WebRequest -Uri $abs -Headers $Headers -OutFile $dest -UseBasicParsing
      }
      $manifest += [pscustomobject]@{ page = $Name; url = $abs; file = $dest }
    } catch { }
  }
  $manifest | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $OutDir "assets-$Name.json") -Encoding UTF8
  return $resp.Content
}

# Snippet DevTools (copia pro clipboard se possivel)
$devtools = @'
(() => {
  const KEYS = [
    "width","height","margin","padding","border","borderRadius","boxShadow",
    "backgroundColor","color","fontFamily","fontSize","fontWeight","lineHeight",
    "letterSpacing","textAlign","display","gap","gridTemplateColumns","transition","transform"
  ];
  const dumpEl = (el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const css = {};
    for (const k of KEYS) css[k] = s[k];
    return {
      tag: el.tagName, id: el.id, className: el.className,
      w: Math.round(r.width), h: Math.round(r.height),
      text: (el.innerText || "").slice(0, 800),
      html: el.outerHTML.slice(0, 4000),
      css
    };
  };
  const cards = [...document.querySelectorAll(".plan-card, [class*='plan']")]
    .filter(el => /plano|pedir|mensal/i.test(el.innerText || "") && el.getBoundingClientRect().width > 200)
    .slice(0, 12)
    .map(dumpEl);
  const cssRules = [...document.styleSheets].flatMap(ss => {
    try { return [...ss.cssRules].map(r => r.cssText); } catch { return []; }
  }).filter(t => /plan-card|choose-plan|header-highlight|plans-container|#ff6338|#FF6338/i.test(t));
  const out = { url: location.href, at: new Date().toISOString(), cards, cssRules };
  console.log("cards:", cards.length, "cssRules:", cssRules.length);
  copy(JSON.stringify(out, null, 2));
  console.log("JSON copiado pro clipboard. Cole em scripts/conectcar-dump/devtools.json");
  return out;
})();
'@

[System.IO.File]::WriteAllText((Join-Path $OutDir "devtools-snippet.js"), $devtools, [System.Text.UTF8Encoding]::new($false))

$meta = @{
  dumpedAt = (Get-Date).ToString("o")
  note = "HTML/CSS estatico. Para medidas reais (hover, computed), cole devtools-snippet.js no Console em lp.conectcar.com/planos"
  urls = $Urls
  officialTokens = @{
    orange = "#FF6338"
    gray = "#4D5761"
    subtitleBg = "#EDEDED"
    cardRadius = "12px"
    cardShadow = "0 4px 6px rgba(0,0,0,0.1)"
    cardWidth = "344-400px"
    cardHeight = "500px"
    font = "Averta, Lato"
    btnRadius = "24px"
    btnHeight = "47px"
  }
}
$meta | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $OutDir "meta.json") -Encoding UTF8

Save-UrlHtml $Urls[0] "lp-planos" | Out-Null
Save-UrlHtml $Urls[1] "home" | Out-Null

Write-Host ""
Write-Host "Dump pronto em: $OutDir"
Write-Host "1) Abra https://lp.conectcar.com/planos"
Write-Host "2) F12 > Console > cole o conteudo de scripts/conectcar-dump/devtools-snippet.js"
Write-Host "3) Salve o JSON do clipboard em scripts/conectcar-dump/devtools.json"
