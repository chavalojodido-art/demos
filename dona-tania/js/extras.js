/* Extras genéricos para las demos PWA (plantillas A, B y C):
   1) Ayuda para instalar: iPhone/iPad (Safari) -> Compartir → Agregar a inicio;
      navegadores internos (Instagram/Facebook/WhatsApp/TikTok) -> abrir en Safari/Chrome + copiar enlace;
      Android/Chrome -> botón "Instalar app" con beforeinstallprompt (y guía de menú si no aparece).
   2) Modo dueño: botón discreto "Probar como dueño" en el pie (o ?dueno=1). El dueño escribe su
      WhatsApp, se guarda SOLO en este teléfono (localStorage) y los pedidos de prueba le llegan a él.
      Sin número guardado se usa el de config.json (en demos: placeholder ficticio).
   Uso desde app.js: const num = window.DemoExtras ? DemoExtras.numero(config.whatsapp) : config.whatsapp; */
(() => {
  "use strict";
  const KEY = "demo_dueno_wa:" + location.pathname.replace(/index\.html$/, "");
  const KEY_CERRADO = "demo_install_cerrado:" + location.pathname.replace(/index\.html$/, "");
  const ua = navigator.userAgent || "";
  const esIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const esAndroid = /Android/i.test(ua);
  const enApp = /FBAN|FBAV|FB_IAB|FBIOS|Instagram|WhatsApp|Line\/|TikTok|musical_ly|Snapchat|Twitter|; wv\)/i.test(ua);
  const qs = new URLSearchParams(location.search);
  const instalada = () => window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  let cfg = { nombre: document.title.replace(/\s+—\s+DEMO$/, ""), whatsapp: "" };
  let promptEvt = null;

  const ICO_COMPARTIR = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="Compartir"><path d="M12 3v13"/><path d="M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';
  const ICO_MAS = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-label="Agregar"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/></svg>';
  const ICO_MENU = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-label="Menú"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>';

  function esc(s) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function soloDigitos(s) { return String(s || "").replace(/\D/g, ""); }
  function normalizar(n) {
    let d = soloDigitos(n);
    if (d.startsWith("00")) d = d.slice(2);
    if (d.length === 8) d = (cfg.prefijo_pais || "505") + d; // número local de 8 dígitos (Nicaragua por defecto)
    return d;
  }
  function guardado() { try { return localStorage.getItem(KEY) || ""; } catch { return ""; } }
  function bonito(d) { return d.length === 11 && d.startsWith("505") ? `+505 ${d.slice(3, 7)}-${d.slice(7)}` : `+${d}`; }

  const API = {
    numero(porDefecto) { return guardado() || soloDigitos(porDefecto); },
    modoDueno() { return !!guardado(); },
    abrirDueno() { abrirModalDueno(); },
    estado() { return { esIOS, esAndroid, enApp, instalada: instalada(), prompt: !!promptEvt, dueno: guardado() }; },
  };
  window.DemoExtras = API;

  // ---------- Banner de instalación ----------
  function cerrarBanner() { const b = document.getElementById("dx-instalar"); if (b) b.remove(); try { sessionStorage.setItem(KEY_CERRADO, "1"); } catch {} }
  function bannerHTML(tipo) {
    if (tipo === "app") {
      const intent = esAndroid ? `intent://${location.host}${location.pathname}${location.search}#Intent;scheme=https;package=com.android.chrome;end` : "";
      return `<strong>Abrí esta demo en ${esIOS ? "Safari" : "Chrome"}</strong>
        <p>Estás dentro de otra app (Instagram, Facebook o WhatsApp). Para instalarla y probarla bien, abrila en el navegador:
        ${esIOS ? `tocá <b>···</b> o ${ICO_COMPARTIR} y elegí <b>Abrir en Safari</b>.` : `tocá ${ICO_MENU} y elegí <b>Abrir en Chrome</b>.`}</p>
        <div class="dx-acciones"><button type="button" class="dx-btn" data-dx="copiar">Copiar enlace</button>
        ${intent ? `<a class="dx-btn dx-sec" href="${esc(intent)}">Abrir en Chrome</a>` : ""}</div>`;
    }
    if (tipo === "ios") {
      return `<strong>Instalala en tu iPhone</strong>
        <ol><li>Tocá ${ICO_COMPARTIR} <b>Compartir</b> (abajo en Safari).</li><li>Elegí ${ICO_MAS} <b>Agregar a inicio</b>.</li><li>Tocá <b>Agregar</b>: queda como una app.</li></ol>`;
    }
    if (tipo === "prompt") {
      return `<strong>Instalá la app</strong><p>Queda en tu pantalla de inicio y funciona como app.</p>
        <div class="dx-acciones"><button type="button" class="dx-btn" data-dx="instalar">Instalar app</button></div>`;
    }
    return `<strong>Instalala en tu Android</strong>
      <p>Tocá ${ICO_MENU} (arriba a la derecha en Chrome) y elegí <b>Instalar app</b> o <b>Agregar a pantalla principal</b>.</p>`;
  }
  function mostrarBanner(tipo) {
    if (instalada()) return;
    try { if (sessionStorage.getItem(KEY_CERRADO) && !qs.has("instalar")) return; } catch {}
    let b = document.getElementById("dx-instalar");
    if (!b) { b = document.createElement("div"); b.id = "dx-instalar"; b.className = "dx-banner"; b.setAttribute("role", "dialog"); b.setAttribute("aria-label", "Instalar la app"); document.body.appendChild(b); }
    b.dataset.tipo = tipo;
    b.innerHTML = `<img src="assets/icon-192.png" alt="" class="dx-icono"><div class="dx-texto">${bannerHTML(tipo)}</div>
      <button type="button" class="dx-cerrar" data-dx="cerrar" aria-label="Cerrar">×</button>`;
  }
  function copiarEnlace(btn) {
    const url = location.href.split("#")[0];
    let listo = false;
    const t = document.createElement("textarea");
    t.value = url; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
    document.body.appendChild(t); t.select(); t.setSelectionRange(0, url.length);
    try { listo = document.execCommand("copy"); } catch {}
    t.remove();
    if (!listo && navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
    if (btn) btn.textContent = "¡Enlace copiado!";
    window.__dxCopiado = url;
  }

  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); promptEvt = e; if (!enApp) mostrarBanner("prompt"); });
  window.addEventListener("appinstalled", () => { promptEvt = null; cerrarBanner(); });

  function iniciarBanner() {
    if (instalada()) return;
    if (enApp) return mostrarBanner("app");
    if (esIOS) return mostrarBanner("ios");
    if (esAndroid) setTimeout(() => { if (!promptEvt) mostrarBanner("android"); }, 2500);
  }

  // ---------- Modo dueño ----------
  function pasosHTML() {
    return `<div class="dx-pasos" id="dx-pasos"><h3>3 pasos para probarla</h3><ol>
      <li><b>Instalala</b> en tu teléfono: iPhone → ${ICO_COMPARTIR} Compartir → <b>Agregar a inicio</b>. Android → <b>Instalar app</b>.</li>
      <li><b>Poné tu WhatsApp</b> aquí abajo. Se guarda solo en este teléfono.</li>
      <li><b>Hacé un pedido de prueba</b>: te llega a tu WhatsApp tal como lo recibiría tu negocio.</li></ol></div>`;
  }
  function abrirModalDueno() {
    cerrarModal();
    const actual = guardado();
    const m = document.createElement("div");
    m.id = "dx-dueno"; m.className = "dx-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-label", "Probar como dueño");
    m.innerHTML = `<div class="dx-caja">
      <button type="button" class="dx-cerrar" data-dx="cerrar-modal" aria-label="Cerrar">×</button>
      <h2>Probar como dueño</h2>
      <p class="dx-sub">Mirá cómo te llegarían los pedidos de <b>${esc(cfg.nombre)}</b> en tu propio WhatsApp.</p>
      ${pasosHTML()}
      <label for="dx-num">Tu número de WhatsApp</label>
      <input id="dx-num" type="tel" inputmode="tel" autocomplete="tel" placeholder="Ej.: 8888 8888" value="${esc(actual ? bonito(actual) : "")}">
      <p class="dx-aviso" id="dx-aviso"></p>
      <button type="button" class="dx-btn dx-ancho" data-dx="guardar">Guardar y probar</button>
      ${actual ? `<button type="button" class="dx-link" data-dx="borrar">Quitar mi número (volver al de prueba)</button>` : ""}
      <p class="dx-nota">Tu número no se envía a ningún servidor: queda guardado solo en este navegador.</p>
    </div>`;
    document.body.appendChild(m);
    setTimeout(() => { const i = document.getElementById("dx-num"); if (i) i.focus(); }, 50);
  }
  function cerrarModal() { const m = document.getElementById("dx-dueno"); if (m) m.remove(); }
  function guardarNumero() {
    const v = normalizar((document.getElementById("dx-num") || {}).value);
    const aviso = document.getElementById("dx-aviso");
    if (v.length < 10 || v.length > 15) { if (aviso) aviso.textContent = "Escribí un número válido (8 dígitos o con código de país)."; return; }
    try { localStorage.setItem(KEY, v); } catch {}
    cerrarModal(); pintarChip(); pintarPie();
  }
  function borrarNumero() { try { localStorage.removeItem(KEY); } catch {} cerrarModal(); pintarChip(); pintarPie(); }
  function pintarChip() {
    let c = document.getElementById("dx-chip");
    const n = guardado();
    document.body.classList.toggle("dx-con-chip", !!n);
    if (!n) { if (c) c.remove(); return; }
    if (!c) { c = document.createElement("button"); c.type = "button"; c.id = "dx-chip"; c.className = "dx-chip"; c.dataset.dx = "abrir-dueno"; document.body.appendChild(c); }
    c.innerHTML = `👤 Modo dueño · pedidos a <b>${esc(bonito(n))}</b>`;
  }
  function pintarPie() {
    const pie = document.querySelector(".pie");
    if (!pie) return;
    let b = pie.querySelector(".dx-pie-dueno");
    if (!b) { b = document.createElement("button"); b.type = "button"; b.className = "dx-pie-dueno"; b.dataset.dx = "abrir-dueno"; pie.appendChild(b); }
    b.textContent = guardado() ? "Modo dueño activo · cambiar número" : "Probar como dueño";
  }

  document.addEventListener("click", (ev) => {
    const el = ev.target.closest("[data-dx]");
    if (!el) { if (ev.target.id === "dx-dueno") cerrarModal(); return; }
    const a = el.dataset.dx;
    if (a === "cerrar") cerrarBanner();
    else if (a === "copiar") copiarEnlace(el);
    else if (a === "instalar" && promptEvt) { promptEvt.prompt(); promptEvt.userChoice.finally(() => { promptEvt = null; cerrarBanner(); }); }
    else if (a === "abrir-dueno") abrirModalDueno();
    else if (a === "cerrar-modal") cerrarModal();
    else if (a === "guardar") guardarNumero();
    else if (a === "borrar") borrarNumero();
  });
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") cerrarModal();
    if (ev.key === "Enter" && ev.target.id === "dx-num") guardarNumero();
  });

  async function init() {
    try { const r = await fetch("config.json", { cache: "no-store" }); if (r.ok) cfg = { ...cfg, ...(await r.json()) }; } catch {}
    const app = document.getElementById("app");
    if (app) new MutationObserver(pintarPie).observe(app, { childList: true });
    pintarPie(); pintarChip(); iniciarBanner();
    if (qs.get("dueno") === "1") abrirModalDueno();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
