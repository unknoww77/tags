#!/usr/bin/env node
/**
 * Auditoria UX/UI de conectcar.com — estrutura e medições, sem copiar assets.
 * Screenshots locais apenas para estudo.
 */

import { chromium } from "playwright";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "docs/reference/conectcar-screenshots");
const BASE = "https://conectcar.com";

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
};

function uniq(arr) {
  return [...new Set(arr)];
}

function textSample(s, max = 120) {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max) + "…" : t;
}

async function extractNavLinks(page) {
  const links = await page.evaluate(() => {
    const out = [];
    const seen = new Set();
    document.querySelectorAll("header a[href], nav a[href], footer a[href]").forEach((a) => {
      const href = a.getAttribute("href") || "";
      const label = (a.textContent || "").replace(/\s+/g, " ").trim();
      if (!label || label.length > 80) return;
      const key = href + "|" + label;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ label, href });
    });
    return out;
  });
  return links;
}

async function extractHeaderFooter(page) {
  return page.evaluate(() => {
    function summarize(el) {
      if (!el) return null;
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName.toLowerCase(),
        classes: el.className?.toString?.().slice(0, 120) || "",
        height: el.offsetHeight,
        padding: cs.padding,
        background: cs.backgroundColor,
        childCount: el.children.length,
      };
    }
    const header = document.querySelector("header") || document.querySelector('[role="banner"]');
    const footer = document.querySelector("footer") || document.querySelector('[role="contentinfo"]');
    const headerItems = header
      ? [...header.querySelectorAll("a, button")].map((n) =>
          (n.textContent || "").replace(/\s+/g, " ").trim(),
        ).filter(Boolean).slice(0, 40)
      : [];
    const footerCols = footer
      ? [...footer.querySelectorAll("h4, h5, h3")].map((h) =>
          (h.textContent || "").replace(/\s+/g, " ").trim(),
        )
      : [];
    return {
      header: summarize(header),
      footer: summarize(footer),
      headerItems,
      footerColumns: footerCols,
    };
  });
}

async function extractHomeSections(page) {
  return page.evaluate(() => {
    const main =
      document.querySelector("main") ||
      document.querySelector("#main") ||
      document.body;
    const sections = [];
    const candidates = main.querySelectorAll("section, [class*='section'], main > div");
    candidates.forEach((el, i) => {
      if (el.offsetHeight < 40) return;
      const h = el.querySelector("h1,h2,h3");
      const heading = h ? (h.textContent || "").replace(/\s+/g, " ").trim().slice(0, 100) : "";
      const cs = getComputedStyle(el);
      sections.push({
        index: i,
        tag: el.tagName.toLowerCase(),
        classes: (el.className?.toString?.() || "").slice(0, 100),
        heading,
        height: el.offsetHeight,
        paddingTop: cs.paddingTop,
        paddingBottom: cs.paddingBottom,
        background: cs.backgroundColor,
      });
    });
    return sections.slice(0, 30);
  });
}

async function extractDesignTokens(page) {
  return page.evaluate(() => {
    const fonts = new Set();
    const colors = new Set();
    const buttons = [];
    const headings = [];

    document.querySelectorAll("body *").forEach((el) => {
      if (el.children.length > 8) return;
      const cs = getComputedStyle(el);
      if (cs.fontFamily) fonts.add(cs.fontFamily.split(",")[0].replace(/['"]/g, "").trim());
      if (cs.color && cs.color !== "rgba(0, 0, 0, 0)") colors.add(cs.color);
      if (cs.backgroundColor && cs.backgroundColor !== "rgba(0, 0, 0, 0)")
        colors.add(cs.backgroundColor);
    });

    document.querySelectorAll("button, a[class*='btn'], a[class*='button'], [class*='cta']").forEach((el) => {
      const cs = getComputedStyle(el);
      const t = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (!t || t.length > 40) return;
      buttons.push({
        text: t,
        bg: cs.backgroundColor,
        color: cs.color,
        padding: cs.padding,
        borderRadius: cs.borderRadius,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
      });
    });

    document.querySelectorAll("h1,h2,h3").forEach((el) => {
      const cs = getComputedStyle(el);
      headings.push({
        tag: el.tagName,
        sample: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60),
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        color: cs.color,
        fontFamily: cs.fontFamily.split(",")[0].replace(/['"]/g, "").trim(),
      });
    });

    return {
      fonts: [...fonts].slice(0, 15),
      colors: [...colors].slice(0, 40),
      buttons: buttons.slice(0, 25),
      headings: headings.slice(0, 20),
    };
  });
}

async function detectPatterns(page) {
  return page.evaluate(() => {
    const carousels = document.querySelectorAll(
      "[class*='carousel'], [class*='swiper'], [class*='slider'], [data-carousel], .slick-slider",
    ).length;
    const accordions = document.querySelectorAll(
      "[class*='accordion'], details, [aria-expanded]",
    ).length;
    const forms = [...document.querySelectorAll("form")].map((f) => ({
      fields: f.querySelectorAll("input, select, textarea").length,
      id: f.id || "",
      classes: (f.className?.toString?.() || "").slice(0, 80),
    }));
    const grids = document.querySelectorAll("[class*='grid'], [style*='grid']").length;
    const cards = document.querySelectorAll(
      "[class*='card'], article[class], [class*='plan'], [class*='box']",
    ).length;
    const heroes = document.querySelectorAll(
      "[class*='hero'], [class*='banner'], [class*='carousel']",
    ).length;
    const dropdowns = document.querySelectorAll(
      "[class*='dropdown'], [aria-haspopup='true'], [class*='submenu']",
    ).length;
    return { carousels, accordions, forms, grids, cards, heroes, dropdowns };
  });
}

async function collectInternalUrls(page, origin) {
  const hrefs = await page.evaluate((origin) => {
    const urls = [];
    document.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
      try {
        const u = new URL(href, origin);
        if (u.hostname.replace("www.", "") === origin.replace("www.", "")) {
          urls.push(u.pathname + (u.search || ""));
        }
      } catch {
        /* skip */
      }
    });
    return urls;
  }, origin.replace("https://www.", "https://"));
  return uniq(hrefs).sort();
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const report = {
    auditedAt: new Date().toISOString(),
    baseUrl: BASE,
    note: "Análise estrutural/UX — sem reprodução de assets ou textos longos proprietários.",
    pages: [],
    viewports: VIEWPORTS,
    screenshots: [],
  };

  const context = await browser.newContext({
    viewport: VIEWPORTS.desktop,
    locale: "pt-BR",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();
  page.setDefaultTimeout(45000);

  try {
    await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(3000);

    const internalUrls = await collectInternalUrls(page, "conectcar.com");
    report.allNavigablePaths = internalUrls;

    // Homepage analysis desktop
    report.homepage = {
      headerFooter: await extractHeaderFooter(page),
      sections: await extractHomeSections(page),
      patterns: await detectPatterns(page),
      designTokens: await extractDesignTokens(page),
      navLinks: await extractNavLinks(page),
    };

    for (const [name, vp] of Object.entries(VIEWPORTS)) {
      await page.setViewportSize(vp);
      await page.waitForTimeout(800);
      const shot = join(OUT_DIR, `homepage-${name}.png`);
      await page.screenshot({ path: shot, fullPage: false });
      report.screenshots.push({ page: "homepage", viewport: name, path: shot });
    }

    // Sample key paths
    const keyPaths = uniq([
      "/",
      "/para-voce/",
      "/para-empresas/",
      "/como-funciona/",
      "/ativar/",
      "/blog/",
      "/free-flow/",
      "/ajuda/",
      "/login/",
      ...internalUrls.filter((p) => p.split("/").length <= 3).slice(0, 15),
    ]).slice(0, 20);

    for (const path of keyPaths) {
      if (path === "/" || path === "") continue;
      const url = BASE + path.replace(/^\//, "/");
      try {
        const p = await context.newPage();
        await p.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
        await p.waitForTimeout(2000);
        const title = await p.title();
        const patterns = await detectPatterns(p);
        const sections = await extractHomeSections(p);
        report.pages.push({
          path,
          title: textSample(title, 80),
          patterns,
          sectionCount: sections.length,
          topHeadings: sections.map((s) => s.heading).filter(Boolean).slice(0, 8),
        });
        const safeName = path.replace(/\//g, "_").replace(/^_/, "") || "root";
        const shotPath = join(OUT_DIR, `page-${safeName}-desktop.png`);
        await p.screenshot({ path: shotPath, fullPage: false });
        report.screenshots.push({ page: path, viewport: "desktop", path: shotPath });
        await p.close();
      } catch (err) {
        report.pages.push({ path, error: String(err.message || err) });
      }
    }

    // Mobile menu behavior
    const mobilePage = await context.newPage();
    await mobilePage.setViewportSize(VIEWPORTS.mobile);
    await mobilePage.goto(BASE, { waitUntil: "domcontentloaded" });
    await mobilePage.waitForTimeout(2000);
    const mobileMenu = await mobilePage.evaluate(() => {
      const btn = document.querySelector(
        "[class*='menu'], [class*='hamburger'], button[aria-label*='menu' i], [class*='nav-toggle']",
      );
      return {
        hasMenuButton: !!btn,
        menuButtonText: btn ? (btn.textContent || btn.getAttribute("aria-label") || "").trim() : "",
      };
    });
    report.mobileBehavior = mobileMenu;
    await mobilePage.screenshot({ path: join(OUT_DIR, "homepage-mobile-menu-closed.png") });
    report.screenshots.push({
      page: "homepage",
      viewport: "mobile-closed",
      path: join(OUT_DIR, "homepage-mobile-menu-closed.png"),
    });

    // Try open mobile menu
    try {
      const menuBtn = mobilePage.locator(
        "button[class*='menu'], button[class*='hamburger'], [aria-label*='Menu' i], [class*='nav-toggle']",
      ).first();
      if (await menuBtn.count()) {
        await menuBtn.click({ timeout: 3000 });
        await mobilePage.waitForTimeout(500);
        await mobilePage.screenshot({ path: join(OUT_DIR, "homepage-mobile-menu-open.png") });
        report.screenshots.push({
          page: "homepage",
          viewport: "mobile-open",
          path: join(OUT_DIR, "homepage-mobile-menu-open.png"),
        });
      }
    } catch {
      report.mobileBehavior.menuOpenAttempt = "could not trigger";
    }
    await mobilePage.close();
  } finally {
    await browser.close();
  }

  const jsonPath = join(ROOT, "docs/reference/conectcar-audit-raw.json");
  writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  console.log("RAW:", jsonPath);
  console.log("Screenshots:", OUT_DIR);
  console.log("Pages found:", report.allNavigablePaths?.length ?? 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
