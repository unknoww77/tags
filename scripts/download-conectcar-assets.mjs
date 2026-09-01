#!/usr/bin/env node
/**
 * Baixa assets públicos de conectcar.com para public/brands/conectcar/
 * URLs expostas no HTML/CSS do site oficial.
 */

import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DEST = join(ROOT, "public/brands/conectcar");
const BANNERS = join(DEST, "banners");

const ASSETS = {
  "logo-header.png":
    "https://conectcar.com/wp-content/themes/conectcar/assets/images/menu-logo-conectcar.png",
  "logo-footer.png":
    "https://conectcar.com/wp-content/uploads/2022/07/logo-conectcar-footer-1.png",
  "hero-banner.png":
    "https://conectcar.com/wp-content/uploads/2026/05/250519_banner_home_NP.png",
  "badge-appstore.png":
    "https://conectcar.com/wp-content/uploads/2022/08/disponivel-na-app-store-botao-1-300x89.png",
  "badge-googleplay.png":
    "https://conectcar.com/wp-content/uploads/2022/08/disponivel-google-play-badge-1-e1661902266479-300x89.png",
  "btn-appstore-footer.png":
    "https://conectcar.com/wp-content/themes/conectcar/assets/images/btn-appstore-footer.png",
  "btn-googleplay-footer.png":
    "https://conectcar.com/wp-content/themes/conectcar/assets/images/btn-googleplay-footer.png",
  "icon-pedagio.png": "https://conectcar.com/wp-content/uploads/2022/09/pedagio-150x150.png",
  "icon-freeflow.png": "https://conectcar.com/wp-content/uploads/2024/04/Ativo-1@4x.png",
  "icon-estacionamento.png":
    "https://conectcar.com/wp-content/uploads/2022/09/estacionamento1-150x150.png",
  "icon-estacionamento2.png":
    "https://conectcar.com/wp-content/uploads/2022/09/estacionamento2-150x150.png",
  "icon-escola.png": "https://conectcar.com/wp-content/uploads/2022/09/escola-150x150.png",
  "icon-estadio.png": "https://conectcar.com/wp-content/uploads/2022/09/estadio-150x150.png",
  "frota.png":
    "https://conectcar.com/wp-content/uploads/elementor/thumbs/frota_hm-qjv1f3yd042cp9x0ey9eh8lhgf5ppt4ltfbu3ug9vk.png",
  "pagamento.jpg":
    "https://conectcar.com/wp-content/uploads/elementor/thumbs/shutterstock_2006035988-scaled-qo7s7lpn03x093r461xx51es4y7is21onc9f43gkhw.jpg",
  "partner-itau.png": "https://conectcar.com/wp-content/uploads/2024/10/tag-1.png",
  "partner-porto.png":
    "https://conectcar.com/wp-content/uploads/2024/04/tag-porto-bank-300x75.png",
  "partner-mp.png":
    "https://conectcar.com/wp-content/uploads/2024/05/mercado-pago-e1715787507143.png",
  "partner-localiza.png":
    "https://conectcar.com/wp-content/uploads/2024/04/tag-localiza-300x78.png",
  "partner-segsat.png": "https://conectcar.com/wp-content/uploads/2024/05/segsat-300x75.png",
  "partner-unicred.png": "https://conectcar.com/wp-content/uploads/2024/05/unicred-300x75.png",
  "partner-uniprime.png":
    "https://conectcar.com/wp-content/uploads/2024/05/Uniprime-300x75.png",
  "partner-maxifrota.png":
    "https://conectcar.com/wp-content/uploads/2024/05/maxifrota-300x79.png",
  "partner-meoo.png":
    "https://conectcar.com/wp-content/uploads/2024/05/localiza-meoo-300x75.png",
  "iso-27001.png":
    "https://conectcar.com/wp-content/uploads/2022/12/Certificacao_ISO27001_IQNET.png",
  "iso-9001.png":
    "https://conectcar.com/wp-content/uploads/2022/12/Certificacao_ISO9001_IQNET.png",
  "social-ig.png": "https://conectcar.com/wp-content/uploads/2022/07/footer-instagram.png",
  "social-fb.png": "https://conectcar.com/wp-content/uploads/2022/07/footer-facebook.png",
  "social-li.png": "https://conectcar.com/wp-content/uploads/2022/07/footer-linkedin.png",
  "social-yt.png": "https://conectcar.com/wp-content/uploads/2024/05/icone_youutbe.png",
  "sua-marca.png":
    "https://conectcar.com/wp-content/uploads/elementor/thumbs/sua-marca-tag-2-q2bt00at3leq6s3oy2mw7du1a2snkyuww3ni4o69z4.png",
  "selos.png": "https://conectcar.com/wp-content/uploads/2026/06/Selos-e-Premios.png",
  "acionistas.png": "https://conectcar.com/wp-content/uploads/2024/05/acionistas_rodape-3.png",
  "atencao.png": "https://conectcar.com/wp-content/uploads/2025/12/atencao2-1024x926.png",
  "app-phone.png":
    "https://conectcar.com/wp-content/uploads/elementor/thumbs/Ativo-2-e1715806487636-qo7q18vt70rbzdgutdoa2sfpldxka7tr7qru923aww.png",
};

const BANNER_ASSETS = {
  "01-plano-completo.png":
    "https://conectcar.com/wp-content/uploads/2026/05/250519_banner_home_NP.png",
  "02-master-driver.png":
    "https://conectcar.com/wp-content/uploads/2026/08/MASTER-DRIVER-Banner-LP-PF_desktop-v2.png",
  "03-mgm.png":
    "https://conectcar.com/wp-content/uploads/2026/03/MGM40-20_BannerDesk-scaled.png",
  "04-plano-basico.png":
    "https://conectcar.com/wp-content/uploads/2026/05/250521_banner_home_Plano_basico1.png",
  "05-freeflow.webp":
    "https://conectcar.com/wp-content/uploads/2026/04/Free-Flow-Isencao-Multas_BannerDesk-scaled.webp",
  "06-nova-home.gif":
    "https://conectcar.com/wp-content/uploads/2024/05/Banner_NovaHome_Desk02.gif",
};

async function download(url, destPath) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Top1Tags-asset-sync/1.0" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(destPath, buf);
  return buf.length;
}

async function main() {
  mkdirSync(BANNERS, { recursive: true });
  let ok = 0;
  let fail = 0;

  for (const [name, url] of Object.entries(ASSETS)) {
    const path = join(DEST, name);
    try {
      const bytes = await download(url, path);
      console.log(`OK ${name} (${bytes} bytes)`);
      ok++;
    } catch (e) {
      console.error(`FAIL ${name}: ${e.message}`);
      fail++;
    }
  }

  for (const [name, url] of Object.entries(BANNER_ASSETS)) {
    const path = join(BANNERS, name);
    try {
      const bytes = await download(url, path);
      console.log(`OK banners/${name} (${bytes} bytes)`);
      ok++;
    } catch (e) {
      console.error(`FAIL banners/${name}: ${e.message}`);
      fail++;
    }
  }

  // Homepage: descobrir banners extras no carrossel
  try {
    const html = await fetch("https://conectcar.com/", {
      headers: { "User-Agent": "Top1Tags-asset-sync/1.0" },
    }).then((r) => r.text());
    const urls = [...html.matchAll(/https:\/\/conectcar\.com\/wp-content\/uploads\/[^"'\\s]+/g)].map(
      (m) => m[0].replace(/\\$/,""),
    );
    const unique = [...new Set(urls)].filter(
      (u) =>
        /\.(png|jpg|jpeg|webp|gif|svg)(\?|$)/i.test(u) &&
        !u.includes("favicon") &&
        !u.includes("32x32") &&
        !u.includes("192x192"),
    );
    const extraDir = join(DEST, "discovered");
    mkdirSync(extraDir, { recursive: true });
    for (const url of unique.slice(0, 40)) {
      const base = url.split("/").pop()?.split("?")[0] ?? "asset";
      const safe = base.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = join(extraDir, safe);
      if (existsSync(path)) continue;
      try {
        const bytes = await download(url, path);
        console.log(`DISCOVER ${safe} (${bytes} bytes)`);
      } catch {
        /* skip */
      }
    }
  } catch (e) {
    console.warn("Homepage scrape skipped:", e.message);
  }

  console.log(`\nDone: ${ok} ok, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main();
