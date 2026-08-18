/**
 * Cole no Console (F12) em https://lp.conectcar.com/planos
 * Copia JSON completo (cards + CSS) para o clipboard.
 */
(() => {
  const KEYS = [
    "width", "height", "margin", "padding", "border", "borderRadius", "boxShadow",
    "backgroundColor", "color", "fontFamily", "fontSize", "fontWeight", "lineHeight",
    "letterSpacing", "textAlign", "display", "gap", "transition", "transform",
  ];
  const dumpEl = (el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const css = {};
    for (const k of KEYS) css[k] = s[k];
    return {
      tag: el.tagName,
      className: el.className,
      w: Math.round(r.width),
      h: Math.round(r.height),
      text: (el.innerText || "").slice(0, 800),
      html: el.outerHTML.slice(0, 4000),
      css,
    };
  };
  const cards = [...document.querySelectorAll(".plan-card")]
    .slice(0, 12)
    .map(dumpEl);
  const cssRules = [...document.styleSheets].flatMap((ss) => {
    try {
      return [...ss.cssRules].map((r) => r.cssText);
    } catch {
      return [];
    }
  }).filter((t) =>
    /plan-card|choose-plan|header-highlight|plans-container|#ff6338/i.test(t)
  );
  const out = { url: location.href, at: new Date().toISOString(), cards, cssRules };
  console.log("cards:", cards.length, "cssRules:", cssRules.length);
  copy(JSON.stringify(out, null, 2));
  console.log("JSON no clipboard → salve em scripts/conectcar-dump/devtools.json");
  return out;
})();
