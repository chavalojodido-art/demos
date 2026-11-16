/* Demo Comedor Los Coco — basada en la plantilla A (restaurante).
   Ataca los dolores reales de las reseñas:
   1) Siempre lleno → turno de mesa por WhatsApp + banner de hora tranquila (afluencia de Google).
   2) Pizarra sin precios y platos tachados → pizarra digital del día; el dueño marca "Agotado" con un toque
      y puede poner precios (si no, "precio a confirmar").
   3) Papelito a mano y sin forma de pedir antes → pedido anticipado / para llevar con hora, mensaje estructurado
      a WhatsApp con código LC-xxxx para decir en caja.
   Prueba de horario: ?ahora=2026-11-17T07:00 (hora de Managua). */
(() => {
  "use strict";

  const app = document.getElementById("app");
  const KEY_PIZARRA = "lc_pizarra:" + location.pathname;
  const state = {
    config: null,
    vista: "menu",
    tab: "",
    carrito: [],
    pizarra: { agotados: [], precios: {} },
    cliente: { nombre: "", telefono: "", tipo: "llevar", dia: "", hora: "", pago: "", notas: "" },
    mesa: { nombre: "", personas: 2, cuando: "ya", dia: "", hora: "", planta: "Donde haya", notas: "" },
    codigo: "",
    codigoMesa: "",
    ultimoMensaje: "",
    aviso: "",
    avisoMesa: "",
    avisoMenu: "",
  };

  const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const DIAS_CORTO = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const ICO = {
    pin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    reloj: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  };

  // ---------- utilidades ----------
  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function fmt(n) { return `${state.config.moneda || "C$"}${(Number(n) || 0).toLocaleString("es-NI", { maximumFractionDigits: 2 })}`; }
  function productos() { return state.config.productos || []; }
  function prod(id) { return productos().find((p) => p.id === id); }
  function categorias() { const c = []; for (const p of productos()) if (!c.includes(p.categoria)) c.push(p.categoria); return c; }
  function deCategoria(cat) { return productos().filter((p) => p.categoria === cat); }
  function agotado(id) { return state.pizarra.agotados.includes(id); }
  function precio(id) {
    const v = Number(state.pizarra.precios[id]);
    if (v > 0) return v;
    const p = prod(id);
    return p && Number(p.precio) > 0 ? Number(p.precio) : null;
  }
  function textoPrecio(id) { const v = precio(id); return v ? fmt(v) : "precio a confirmar"; }

  // ---------- pizarra (lo que edita el dueño) ----------
  function cargarPizarra() {
    try {
      const raw = localStorage.getItem(KEY_PIZARRA);
      if (raw) { const o = JSON.parse(raw); state.pizarra = { agotados: o.agotados || [], precios: o.precios || {} }; return; }
    } catch {}
    state.pizarra = { agotados: [...(state.config.agotados_demo || [])], precios: {} };
  }
  function guardarPizarra() { try { localStorage.setItem(KEY_PIZARRA, JSON.stringify(state.pizarra)); } catch {} }
  function alternarAgotado(id) {
    const a = state.pizarra.agotados;
    const i = a.indexOf(id);
    if (i >= 0) a.splice(i, 1); else a.push(id);
    guardarPizarra();
    // si se agotó algo que estaba en el carrito, lo sacamos
    if (agotado(id)) state.carrito = state.carrito.filter((x) => x.id !== id);
  }

  // ---------- hora de Managua ----------
  function ahoraManagua() {
    const tz = state.config.zona_horaria || "America/Managua";
    const q = new URLSearchParams(location.search).get("ahora");
    if (q && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(q)) {
      const [f, h] = q.split("T");
      const [y, m, d] = f.split("-").map(Number);
      const [hh, mm] = h.split(":").map(Number);
      return { y, m, d, min: hh * 60 + mm, dow: new Date(Date.UTC(y, m - 1, d)).getUTCDay(), simulado: true };
    }
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
        .formatToParts(new Date()).map((p) => [p.type, p.value])
    );
    const y = +parts.year, m = +parts.month, d = +parts.day;
    return { y, m, d, min: (+parts.hour % 24) * 60 + +parts.minute, dow: new Date(Date.UTC(y, m - 1, d)).getUTCDay(), simulado: false };
  }
  function sumarDias(b, n) { const dt = new Date(Date.UTC(b.y, b.m - 1, b.d + n)); return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate(), dow: dt.getUTCDay() }; }
  function aMin(hhmm) { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; }
  function rango(dow) { const r = (state.config.horario_semana || {})[String(dow)]; if (!r) return null; const [a, b] = r.split("-"); return { abre: aMin(a), cierra: aMin(b) }; }
  function hora12(min) { const h = Math.floor(min / 60), m = min % 60; return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "p. m." : "a. m."}`; }
  function enRangos(min, lista) { return (lista || []).some((r) => { const [a, b] = r.split("-"); return min >= aMin(a) && min < aMin(b); }); }
  function claveDia(f) { return `${f.y}-${String(f.m).padStart(2, "0")}-${String(f.d).padStart(2, "0")}`; }
  function etiquetaDia(f, off) { const b = `${DIAS_CORTO[f.dow]} ${f.d} ${MESES[f.m - 1]}`; return off === 0 ? `Hoy · ${b}` : off === 1 ? `Mañana · ${b}` : b; }

  function estadoLocal() {
    const now = ahoraManagua(), r = rango(now.dow);
    if (r && now.min >= r.abre && now.min < r.cierra) return { abierto: true, texto: `Abierto ahora · cierra ${hora12(r.cierra)}` };
    if (r && now.min < r.abre) return { abierto: false, texto: `Cerrado · abre hoy ${hora12(r.abre)}` };
    for (let i = 1; i <= 7; i++) {
      const f = sumarDias(now, i), rr = rango(f.dow);
      if (rr) return { abierto: false, texto: `Cerrado · abre ${i === 1 ? "mañana" : DIAS[f.dow]} ${hora12(rr.abre)}` };
    }
    return { abierto: false, texto: "Cerrado" };
  }
  function esHoraDesayuno() {
    const now = ahoraManagua(), corte = aMin(state.config.corte_desayuno || "10:30"), r = rango(now.dow);
    if (!r || now.min >= r.cierra) return true; // cerrado: lo próximo es desayuno
    return now.min < corte;
  }

  function diasDisponibles() {
    const cfg = state.config.retiro || {};
    const paso = cfg.intervalo_minutos || 15, anticip = cfg.anticipacion_minutos ?? 30, margen = cfg.ultimo_pedido_antes_cierre_minutos ?? 30, max = cfg.dias_a_mostrar || 3;
    const now = ahoraManagua(), dias = [];
    for (let i = 0; i < 8 && dias.length < max; i++) {
      const f = sumarDias(now, i), r = rango(f.dow);
      if (!r) continue;
      let desde = r.abre;
      if (i === 0) desde = Math.max(desde, Math.ceil((now.min + anticip) / paso) * paso);
      const hasta = r.cierra - margen, franjas = [];
      const altaDia = ((cfg.franjas_alta_demanda_por_dia || {})[String(f.dow)]) || cfg.franjas_alta_demanda;
      for (let t = desde; t <= hasta; t += paso) {
        const alta = enRangos(t, altaDia);
        franjas.push({ min: t, alta, recomendada: !alta && enRangos(t, cfg.franjas_recomendadas) });
      }
      if (franjas.length) dias.push({ clave: claveDia(f), etiqueta: etiquetaDia(f, i), franjas });
    }
    return dias;
  }
  function textoCuando(dia, hora) {
    const d = diasDisponibles().find((x) => x.clave === dia);
    const e = (d ? d.etiqueta : dia).replace(" · ", " ");
    return `${e.charAt(0).toLowerCase() + e.slice(1)} a las ${hora12(Number(hora))}`;
  }

  // ---------- carrito ----------
  function totalItems() { return state.carrito.reduce((a, it) => a + it.cantidad, 0); }
  function totales() {
    let suma = 0, sinPrecio = 0;
    for (const it of state.carrito) { const p = precio(it.id); if (p) suma += p * it.cantidad; else sinPrecio += it.cantidad; }
    return { suma, sinPrecio };
  }
  function textoTotal() {
    const t = totales();
    if (!state.carrito.length) return fmt(0);
    if (!t.sinPrecio) return fmt(t.suma);
    if (!t.suma) return "a confirmar por el comedor";
    return `${fmt(t.suma)} + ${t.sinPrecio} con precio a confirmar`;
  }
  function agregar(id, opcion) {
    if (agotado(id)) { state.avisoMenu = `${prod(id).nombre} está agotado hoy.`; return; }
    const key = `${id}|${opcion || ""}`;
    const ex = state.carrito.find((x) => x.key === key);
    if (ex) ex.cantidad += 1;
    else state.carrito.push({ key, id, nombre: prod(id).nombre, opcion: opcion || "", cantidad: 1, foto: prod(id).foto });
    state.avisoMenu = "";
  }

  // ---------- vistas ----------
  function hero() {
    const c = state.config, st = estadoLocal();
    return `<header class="hero">
        <img class="logo" src="${esc(c.logo)}" alt="Logo de ${esc(c.nombre)} (propuesta)">
        <div>
          <h1>${esc(c.nombre)}</h1>
          <p class="eslogan">${esc(c.eslogan || "")}</p>
          <span class="estado ${st.abierto ? "abierto" : "cerrado"}" id="estado-local"><i></i>${esc(st.texto)}</span>
          <div class="meta">
            <span>${ICO.pin}<span>${esc(c.direccion)}</span></span>
            <span>${ICO.reloj}<span>${esc(c.horario)}</span></span>
          </div>
        </div>
      </header>
      <div class="banner-hora" id="banner-mejor-hora" role="note">
        <strong>⏱ Evitá esperar mesa</strong>
        <span>${esc(c.banner_mejor_hora || "")}</span>
        <small class="fuente">${esc(c.banner_fuente || "")}</small>
        ${st.abierto ? "" : `<span class="cerrado-nota">Ahora está cerrado, pero podés <b>dejar tu pedido programado</b> para el próximo horario.</span>`}
      </div>
      <div class="acciones-inicio">
        <button type="button" class="accion-grande" data-accion="ir-pizarra" id="btn-ir-pizarra"><span>🧾</span><b>Ver la pizarra de hoy</b><small>Qué hay y qué se acabó</small></button>
        <button type="button" class="accion-grande" data-accion="ir-mesa" id="btn-ir-mesa"><span>🪑</span><b>Apartar turno de mesa</b><small>Te avisan por WhatsApp</small></button>
        <button type="button" class="accion-grande" data-accion="ir-pedido" id="btn-ir-pedido"><span>🥡</span><b>Pedir para llevar</b><small>Listo a la hora que digás</small></button>
        <a class="accion-grande" href="${esc(c.maps_url || "#")}" target="_blank" rel="noopener noreferrer" id="btn-como-llegar"><span>📍</span><b>Cómo llegar</b><small>No tiene rótulo afuera</small></a>
      </div>`;
  }

  function tarjeta(p) {
    const ag = agotado(p.id), op = p.opciones;
    const botones = ag
      ? `<button type="button" class="btn-add" disabled>Agotado</button>`
      : op
        ? `<div class="ops">${op.valores.map((v) => `<button type="button" class="btn-add" data-accion="agregar" data-id="${esc(p.id)}" data-op="${esc(v)}">+ ${esc(v)}</button>`).join("")}</div>`
        : `<button type="button" class="btn-add" data-accion="agregar" data-id="${esc(p.id)}">+ Agregar</button>`;
    return `<article class="tarjeta${ag ? " agotada" : ""}" data-producto="${esc(p.id)}">
      <img src="${esc(p.foto)}" alt="">
      <div class="tarjeta-cuerpo">
        ${ag ? '<span class="badge badge-agotado">Agotado hoy</span>' : ""}
        <h2>${esc(p.nombre)}</h2>
        <p class="desc">${esc(p.descripcion || "")}</p>
        <div class="tarjeta-pie">
          <span class="precio${precio(p.id) ? "" : " por-confirmar"}">${esc(textoPrecio(p.id))}</span>
          ${botones}
        </div>
      </div></article>`;
  }

  function pie() {
    const c = state.config;
    return `<footer class="pie">
      <p>${esc(c.nota_precios || "")}</p>
      <p>Logo y colores: propuesta nuestra (el comedor no tiene marca publicada).</p>
      <p class="marca-demo">DEMO – versión de prueba · propuesta no oficial · WhatsApp de prueba ficticio</p>
    </footer>`;
  }

  function barraCarrito() {
    if (!state.carrito.length || state.vista !== "menu") return "";
    const n = totalItems();
    return `<div class="barra-carrito" role="status">
      <div><strong id="barra-total">${n} ${n === 1 ? "plato" : "platos"}</strong><small>Total: ${esc(textoTotal())}</small></div>
      <button type="button" class="btn-barra" data-accion="ver-pedido">Ver pedido</button>
    </div>`;
  }

  function renderMenu() {
    const cats = categorias();
    if (!state.tab || !cats.includes(state.tab)) state.tab = esHoraDesayuno() ? "Desayunos" : (cats[1] || cats[0]);
    const nAg = state.pizarra.agotados.length;
    const dueno = window.DemoExtras && window.DemoExtras.modoDueno();
    app.dataset.vista = "menu";
    app.classList.toggle("con-barra", state.carrito.length > 0);
    app.innerHTML = `${hero()}
      <section class="pizarra" id="pizarra">
        <div class="pizarra-cab">
          <div><h2>🧾 Pizarra de hoy</h2>
          <p class="sub">${nAg ? `${nAg} ${nAg === 1 ? "plato agotado" : "platos agotados"} · ` : ""}Lo que dice la pizarra, en tu celular.</p></div>
          <button type="button" class="btn-dueno-pizarra${dueno ? " destacado" : ""}" data-accion="editar-pizarra" id="btn-editar-pizarra">✏️ ${dueno ? "Editar pizarra" : "Soy el dueño"}</button>
        </div>
        <nav class="tabs" role="tablist" aria-label="Pizarra">
          ${cats.map((t) => `<button type="button" role="tab" class="tab${state.tab === t ? " activa" : ""}" data-accion="tab" data-cat="${esc(t)}" aria-selected="${state.tab === t}">${esc(t)}</button>`).join("")}
        </nav>
        ${state.avisoMenu ? `<p class="aviso" id="aviso-menu">${esc(state.avisoMenu)}</p>` : ""}
        <div class="lista">${deCategoria(state.tab).map(tarjeta).join("")}</div>
      </section>
      ${pie()}
      ${barraCarrito()}`;
  }

  function renderEditor() {
    app.dataset.vista = "pedido";
    app.classList.remove("con-barra");
    app.innerHTML = `
      <div class="topbar"><button type="button" class="btn-atras" data-accion="ver-menu" aria-label="Volver">←</button><h1>Pizarra del dueño</h1></div>
      <div class="pedido editor">
        <div class="nota-dueno">
          <b>Así reemplaza tachar la pizarra:</b> tocá <b>“Hay”</b> para marcar un plato como <b>Agotado</b>. Si querés, poné el precio y ya no sale “precio a confirmar”.
          <br><small>En esta demo los cambios se guardan solo en este celular. En la app real, al marcarlo lo ven todos los clientes al instante.</small>
        </div>
        ${categorias().map((cat) => `<h2 class="h2-sec">${esc(cat)}</h2>
          ${deCategoria(cat).map((p) => {
            const ag = agotado(p.id), pv = state.pizarra.precios[p.id] || "";
            return `<div class="fila-editor${ag ? " agotada" : ""}" data-producto="${esc(p.id)}">
              <span class="nom">${esc(p.nombre)}</span>
              <input class="precio-input" type="number" inputmode="numeric" min="0" step="5" placeholder="C$ —" aria-label="Precio de ${esc(p.nombre)}" data-precio="${esc(p.id)}" value="${esc(pv)}">
              <button type="button" class="toggle-ag${ag ? " on" : ""}" data-accion="toggle-agotado" data-id="${esc(p.id)}" aria-pressed="${ag}">${ag ? "Agotado" : "Hay"}</button>
            </div>`;
          }).join("")}`).join("")}
        <button type="button" class="btn-primario" data-accion="guardar-pizarra" id="btn-guardar-pizarra">Listo, ver cómo lo ve el cliente</button>
        <button type="button" class="btn-link" data-accion="reset-pizarra">Volver a la pizarra de ejemplo</button>
      </div>`;
  }

  function selectorHora(obj, etiqueta) {
    const dias = diasDisponibles();
    if (!dias.length) return `<p class="aviso">No hay horarios disponibles en los próximos días.</p>`;
    if (!dias.find((d) => d.clave === obj.dia)) { obj.dia = dias[0].clave; obj.hora = ""; }
    const dia = dias.find((d) => d.clave === obj.dia);
    if (obj.hora && !dia.franjas.find((f) => String(f.min) === obj.hora)) obj.hora = "";
    return `<div class="campo">
      <label>${etiqueta}</label>
      <div class="dias">${dias.map((d) => `<button type="button" class="dia-btn${d.clave === obj.dia ? " activo" : ""}" data-accion="dia" data-dia="${d.clave}">${esc(d.etiqueta)}</button>`).join("")}</div>
      <div class="horas" id="franjas">
        ${dia.franjas.map((f) => `<button type="button" class="hora${String(f.min) === obj.hora ? " activa" : ""}${f.recomendada ? " reco" : ""}${f.alta ? " alta" : ""}" data-accion="hora" data-min="${f.min}">${hora12(f.min)}${f.recomendada ? "<small>tranquilo</small>" : f.alta ? "<small>más lleno</small>" : ""}</button>`).join("")}
      </div>
      <p class="ayuda izq">Franjas de 15 min dentro del horario del comedor.</p>
    </div>`;
  }

  function renderPedido() {
    const c = state.config, pagos = c.metodos_pago || ["Efectivo"];
    if (!state.cliente.pago) state.cliente.pago = pagos[0];
    app.dataset.vista = "pedido";
    app.classList.remove("con-barra");
    const items = state.carrito.length
      ? state.carrito.map((it, i) => `<article class="linea">
          <img src="${esc(it.foto)}" alt="">
          <div>
            <h3>${esc(it.nombre)}${it.opcion ? ` <small>(${esc(it.opcion)})</small>` : ""}</h3>
            <p class="sub">${esc(textoPrecio(it.id))}${precio(it.id) ? ` c/u · ${fmt(precio(it.id) * it.cantidad)}` : ""}</p>
            <div class="linea-pie">
              <div class="qty"><button type="button" data-accion="menos" data-i="${i}" aria-label="Quitar uno">−</button><span>${it.cantidad}</span><button type="button" data-accion="mas" data-i="${i}" aria-label="Agregar uno">+</button></div>
              <button type="button" class="btn-quitar" data-accion="quitar" data-i="${i}">Quitar</button>
            </div>
          </div></article>`).join("")
      : `<div class="vacio"><p>Todavía no elegiste nada.</p><button type="button" class="btn-primario" data-accion="ir-pizarra" style="max-width:260px;margin:0 auto">Ver la pizarra de hoy</button></div>`;
    const cl = state.cliente;
    app.innerHTML = `
      <div class="topbar"><button type="button" class="btn-atras" data-accion="ver-menu" aria-label="Volver">←</button><h1>Tu pedido</h1></div>
      <div class="pedido">
        ${items}
        ${state.carrito.length ? `
        <div class="resumen"><div class="fila"><span>Total</span><span id="total-pedido">${esc(textoTotal())}</span></div>
          <p class="ayuda izq">Llega directo al WhatsApp del comedor, ya ordenado. Pagás en caja diciendo tu código: <b>sin papelito</b>.</p></div>
        <form class="formulario" id="form-pedido" novalidate>
          <h2>Tus datos</h2>
          <div class="campo"><label for="cli-nombre">Nombre</label><input id="cli-nombre" autocomplete="name" placeholder="Tu nombre" value="${esc(cl.nombre)}"></div>
          <div class="campo"><label for="cli-tel">Teléfono (opcional)</label><input id="cli-tel" type="tel" inputmode="tel" placeholder="8888-8888" value="${esc(cl.telefono)}"></div>
          <div class="campo"><label>¿Cómo lo querés?</label>
            <div class="opciones">
              <label class="opcion"><input type="radio" name="tipo" value="llevar" ${cl.tipo === "llevar" ? "checked" : ""}> 🥡 Para llevar: paso a retirarlo</label>
              <label class="opcion"><input type="radio" name="tipo" value="aqui" ${cl.tipo === "aqui" ? "checked" : ""}> 🍽 Comer ahí: que esté listo cuando llegue</label>
            </div></div>
          ${selectorHora(cl, cl.tipo === "aqui" ? "¿A qué hora llegás a comer?" : "¿A qué hora pasás a retirar?")}
          <div class="campo"><label>Pago</label><div class="opciones">
            ${pagos.map((p) => `<label class="opcion"><input type="radio" name="pago" value="${esc(p)}" ${cl.pago === p ? "checked" : ""}> ${esc(p)}</label>`).join("")}
          </div></div>
          <div class="campo"><label for="cli-notas">Notas (opcional)</label><textarea id="cli-notas" rows="2" placeholder="Ej.: sin cebolla, tortillas aparte">${esc(cl.notas)}</textarea></div>
          <p class="aviso" id="aviso-pedido">${esc(state.aviso)}</p>
          <button type="submit" class="btn-primario" id="btn-whatsapp">Enviar pedido por WhatsApp</button>
          <p class="ayuda">Se abre WhatsApp con el pedido ya escrito para que lo confirmés.<br>${window.DemoExtras && window.DemoExtras.modoDueno() ? "<b>Modo dueño:</b> el pedido va a <b>tu</b> WhatsApp." : "<b>Demo:</b> va a un número de prueba ficticio, no al comedor."}</p>
        </form>` : ""}
      </div>`;
  }

  function renderEnviado() {
    app.dataset.vista = "pedido";
    const aqui = state.cliente.tipo === "aqui";
    app.innerHTML = `
      <div class="topbar"><button type="button" class="btn-atras" data-accion="ver-menu" aria-label="Volver">←</button><h1>Pedido ${esc(state.codigo)}</h1></div>
      <div class="pedido">
        <div class="enviado">
          <div class="check-ok">✓</div>
          <h2>¡Pedido listo para enviar!</h2>
          <p>Confirmalo en WhatsApp. ${aqui ? `Llegás <b>${esc(textoCuando(state.cliente.dia, state.cliente.hora))}</b> y tu comida ya va saliendo.` : `Pasá a retirar <b>${esc(textoCuando(state.cliente.dia, state.cliente.hora))}</b>.`}</p>
          <div class="codigo-grande">En caja decí: <b id="codigo-pedido">${esc(state.codigo)}</b></div>
          <p class="codigo">Total: ${esc(textoTotal())}</p>
        </div>
        <div class="acciones-llegada">
          <button type="button" class="btn-secundario" data-accion="en-camino" id="btn-en-camino">🚶 Voy en camino</button>
          <button type="button" class="btn-primario" data-accion="llegue" id="btn-llegue">📍 Llegué</button>
        </div>
        <p class="ayuda">Cada botón manda un aviso corto al WhatsApp del comedor con tu código.</p>
        <button type="button" class="btn-link" data-accion="reenviar">Volver a abrir el mensaje del pedido</button>
        <button type="button" class="btn-link" data-accion="nuevo">Hacer otro pedido</button>
      </div>`;
  }

  function renderMesa() {
    const m = state.mesa, st = estadoLocal();
    if (!st.abierto && m.cuando === "ya") m.cuando = "hora";
    app.dataset.vista = "pedido";
    app.classList.remove("con-barra");
    app.innerHTML = `
      <div class="topbar"><button type="button" class="btn-atras" data-accion="ver-menu" aria-label="Volver">←</button><h1>Turno de mesa</h1></div>
      <div class="pedido">
        <div class="nota-dueno"><b>¿Siempre está lleno?</b> Apartá tu turno y el comedor te avisa por WhatsApp cuando tu mesa esté lista. Así no esperás de pie ni subís a buscar.</div>
        <form class="formulario" id="form-mesa" novalidate>
          <div class="campo"><label for="mesa-nombre">Nombre</label><input id="mesa-nombre" autocomplete="name" placeholder="Tu nombre" value="${esc(m.nombre)}"></div>
          <div class="campo"><label>¿Cuántas personas?</label>
            <div class="qty grande"><button type="button" data-accion="pers-menos" aria-label="Menos personas">−</button><span id="mesa-personas">${m.personas}</span><button type="button" data-accion="pers-mas" aria-label="Más personas">+</button></div></div>
          <div class="campo"><label>¿Cuándo llegás?</label>
            <div class="opciones">
              <label class="opcion${st.abierto ? "" : " deshab"}"><input type="radio" name="cuando" value="ya" ${m.cuando === "ya" ? "checked" : ""} ${st.abierto ? "" : "disabled"}> Ya voy (en unos 15 minutos)${st.abierto ? "" : " · ahora está cerrado"}</label>
              <label class="opcion"><input type="radio" name="cuando" value="hora" ${m.cuando === "hora" ? "checked" : ""}> A una hora exacta</label>
            </div></div>
          ${m.cuando === "hora" ? selectorHora(m, "Elegí la hora") : ""}
          <div class="campo"><label>¿Dónde preferís?</label>
            <div class="chips">${["Donde haya", "Abajo", "Arriba"].map((p) => `<button type="button" class="chip${m.planta === p ? " activa" : ""}" data-accion="planta" data-planta="${p}">${p}</button>`).join("")}</div></div>
          <div class="campo"><label for="mesa-notas">Notas (opcional)</label><textarea id="mesa-notas" rows="2" placeholder="Ej.: vamos con un bebé, silla para niño">${esc(m.notas)}</textarea></div>
          <p class="aviso" id="aviso-mesa">${esc(state.avisoMesa)}</p>
          <button type="submit" class="btn-primario" id="btn-mesa-whatsapp">Pedir turno por WhatsApp</button>
          <p class="ayuda">El comedor confirma por WhatsApp. El turno no está garantizado hasta que te respondan.</p>
        </form>
      </div>`;
  }

  function renderMesaEnviada() {
    app.dataset.vista = "pedido";
    app.innerHTML = `
      <div class="topbar"><button type="button" class="btn-atras" data-accion="ver-menu" aria-label="Volver">←</button><h1>Turno ${esc(state.codigoMesa)}</h1></div>
      <div class="pedido">
        <div class="enviado">
          <div class="check-ok">✓</div>
          <h2>¡Turno pedido!</h2>
          <p>Mesa para <b>${state.mesa.personas}</b> · ${esc(cuandoMesa())}. Te avisan por WhatsApp cuando esté lista.</p>
          <div class="codigo-grande">Tu turno: <b id="codigo-mesa">${esc(state.codigoMesa)}</b></div>
        </div>
        <button type="button" class="btn-primario" data-accion="llegue-mesa" id="btn-llegue-mesa">📍 Ya llegué</button>
        <button type="button" class="btn-secundario ancho" data-accion="ir-pizarra-aqui" id="btn-pedir-de-una">🍽 Pedir la comida de una vez</button>
        <p class="ayuda">Si pedís de una vez, cuando te sentás ya va saliendo tu plato.</p>
        <button type="button" class="btn-link" data-accion="reenviar">Volver a abrir el mensaje</button>
      </div>`;
  }

  function render() {
    ({ pedido: renderPedido, enviado: renderEnviado, mesa: renderMesa, "mesa-enviada": renderMesaEnviada, editor: renderEditor }[state.vista] || renderMenu)();
  }

  // ---------- mensajes ----------
  function leerFormulario() {
    const g = (id) => document.getElementById(id);
    if (g("cli-nombre")) state.cliente.nombre = g("cli-nombre").value.trim();
    if (g("cli-tel")) state.cliente.telefono = g("cli-tel").value.trim();
    if (g("cli-notas")) state.cliente.notas = g("cli-notas").value.trim();
    if (g("mesa-nombre")) state.mesa.nombre = g("mesa-nombre").value.trim();
    if (g("mesa-notas")) state.mesa.notas = g("mesa-notas").value.trim();
    const tipo = document.querySelector('input[name="tipo"]:checked');
    const pago = document.querySelector('input[name="pago"]:checked');
    const cuando = document.querySelector('input[name="cuando"]:checked');
    if (tipo) state.cliente.tipo = tipo.value;
    if (pago) state.cliente.pago = pago.value;
    if (cuando) state.mesa.cuando = cuando.value;
    document.querySelectorAll("[data-precio]").forEach((inp) => {
      const v = Number(inp.value);
      if (v > 0) state.pizarra.precios[inp.dataset.precio] = v; else delete state.pizarra.precios[inp.dataset.precio];
    });
  }
  function cuandoMesa() { return state.mesa.cuando === "ya" ? "llego en unos 15 minutos" : textoCuando(state.mesa.dia, state.mesa.hora); }

  function armarMensajePedido() {
    const c = state.config, cl = state.cliente, L = [];
    L.push(`Hola, quiero hacer un pedido en *${c.nombre}*`);
    L.push(`*Código:* ${state.codigo}`);
    L.push("");
    L.push("*Pedido:*");
    for (const it of state.carrito) {
      const p = precio(it.id);
      L.push(`• ${it.cantidad}× ${it.nombre}${it.opcion ? ` (${it.opcion})` : ""} — ${p ? fmt(p * it.cantidad) : "precio a confirmar"}`);
    }
    L.push("");
    L.push(`*Total:* ${textoTotal()}`);
    L.push("");
    L.push(`*Cliente:* ${cl.nombre}${cl.telefono ? ` · Tel. ${cl.telefono}` : ""}`);
    L.push(cl.tipo === "aqui" ? "*Tipo:* Comer ahí (tenerlo listo al llegar)" : "*Tipo:* Para llevar (paso a retirar)");
    L.push(`*Hora:* ${textoCuando(cl.dia, cl.hora)}`);
    L.push(`*Pago:* ${cl.pago}`);
    if (cl.notas) L.push(`*Notas:* ${cl.notas}`);
    L.push("");
    L.push("_Enviado desde la app (DEMO – versión de prueba)_");
    return L.join("\n");
  }
  function armarMensajeMesa() {
    const c = state.config, m = state.mesa, L = [];
    L.push(`🪑 Hola, quiero *turno de mesa* en *${c.nombre}*`);
    L.push(`*Turno:* ${state.codigoMesa}`);
    L.push(`*Nombre:* ${m.nombre}`);
    L.push(`*Personas:* ${m.personas}`);
    L.push(`*Llegada:* ${cuandoMesa()}`);
    L.push(`*Prefiero:* ${m.planta}`);
    if (m.notas) L.push(`*Notas:* ${m.notas}`);
    L.push("");
    L.push("Por favor me avisan por aquí cuando esté lista la mesa.");
    L.push("_Enviado desde la app (DEMO – versión de prueba)_");
    return L.join("\n");
  }
  function armarMensajeLlegada(tipo) {
    if (tipo === "mesa") return `📍 Hola, soy ${state.mesa.nombre}. *Ya llegué* por mi turno de mesa *${state.codigoMesa}* (${state.mesa.personas} personas).\n_DEMO – versión de prueba_`;
    const n = state.cliente.nombre;
    if (tipo === "camino") return `🚶 Hola, soy ${n}. *Voy en camino* por mi pedido *${state.codigo}* (${textoCuando(state.cliente.dia, state.cliente.hora)}).\n_DEMO – versión de prueba_`;
    return `📍 Hola, soy ${n}. *Ya llegué* por mi pedido *${state.codigo}*. Estoy en la caja.\n_DEMO – versión de prueba_`;
  }

  function urlWhatsApp(texto) {
    const num = String((window.DemoExtras ? window.DemoExtras.numero(state.config.whatsapp) : state.config.whatsapp) || "").replace(/\D/g, "");
    return `https://wa.me/${num}?text=${encodeURIComponent(texto)}`;
  }
  function abrirWhatsApp(texto) { state.ultimoMensaje = texto; window.open(urlWhatsApp(texto), "_blank", "noopener"); }
  function cod(pref) { return `${pref}-${String(Math.floor(1000 + Math.random() * 9000))}`; }

  function enviarPedido(ev) {
    ev.preventDefault();
    leerFormulario();
    let err = "";
    if (!state.carrito.length) err = "Agregá al menos un plato.";
    else if (!state.cliente.nombre) err = "Escribí tu nombre.";
    else if (!state.cliente.hora) err = state.cliente.tipo === "aqui" ? "Elegí la hora en que llegás." : "Elegí la hora de retiro.";
    state.aviso = err;
    if (err) { const a = document.getElementById("aviso-pedido"); if (a) a.textContent = err; return; }
    if (!state.codigo) state.codigo = cod("LC");
    abrirWhatsApp(armarMensajePedido());
    state.vista = "enviado"; render(); window.scrollTo(0, 0);
  }
  function enviarMesa(ev) {
    ev.preventDefault();
    leerFormulario();
    let err = "";
    if (!state.mesa.nombre) err = "Escribí tu nombre.";
    else if (state.mesa.cuando === "hora" && !state.mesa.hora) err = "Elegí la hora en que llegás.";
    state.avisoMesa = err;
    if (err) { const a = document.getElementById("aviso-mesa"); if (a) a.textContent = err; return; }
    if (!state.codigoMesa) state.codigoMesa = cod("M");
    abrirWhatsApp(armarMensajeMesa());
    state.vista = "mesa-enviada"; render(); window.scrollTo(0, 0);
  }

  // ---------- eventos ----------
  function ir(vista) { state.vista = vista; state.aviso = ""; state.avisoMesa = ""; render(); window.scrollTo(0, 0); }
  function onClick(ev) {
    const btn = ev.target.closest("[data-accion]");
    if (!btn || btn.disabled) return;
    const a = btn.dataset.accion, id = btn.dataset.id, i = Number(btn.dataset.i);
    if (["dia", "hora", "planta", "pers-mas", "pers-menos", "mas", "menos", "quitar", "toggle-agotado"].includes(a)) leerFormulario();
    const obj = state.vista === "mesa" ? state.mesa : state.cliente;
    switch (a) {
      case "tab": state.tab = btn.dataset.cat; state.avisoMenu = ""; render(); break;
      case "ir-pizarra": state.vista = "menu"; render(); document.getElementById("pizarra").scrollIntoView({ block: "start" }); break;
      case "ir-pizarra-aqui": state.cliente.tipo = "aqui"; if (state.mesa.cuando === "hora") { state.cliente.dia = state.mesa.dia; state.cliente.hora = state.mesa.hora; } if (!state.cliente.nombre) state.cliente.nombre = state.mesa.nombre; state.vista = "menu"; render(); document.getElementById("pizarra").scrollIntoView({ block: "start" }); break;
      case "ir-mesa": ir("mesa"); break;
      case "ir-pedido": if (state.carrito.length) ir("pedido"); else { state.cliente.tipo = "llevar"; state.avisoMenu = "Elegí tus platos y después tocá «Ver pedido»."; state.vista = "menu"; render(); document.getElementById("pizarra").scrollIntoView({ block: "start" }); } break;
      case "agregar": agregar(id, btn.dataset.op); render(); break;
      case "ver-pedido": ir("pedido"); break;
      case "ver-menu": leerFormulario(); if (state.vista === "editor") guardarPizarra(); state.vista = "menu"; render(); window.scrollTo(0, 0); break;
      case "mas": state.carrito[i].cantidad += 1; render(); break;
      case "menos": state.carrito[i].cantidad -= 1; if (state.carrito[i].cantidad <= 0) state.carrito.splice(i, 1); render(); break;
      case "quitar": state.carrito.splice(i, 1); render(); break;
      case "dia": obj.dia = btn.dataset.dia; obj.hora = ""; render(); break;
      case "hora": obj.hora = btn.dataset.min; state.aviso = ""; state.avisoMesa = ""; render(); break;
      case "planta": state.mesa.planta = btn.dataset.planta; render(); break;
      case "pers-mas": state.mesa.personas = Math.min(20, state.mesa.personas + 1); render(); break;
      case "pers-menos": state.mesa.personas = Math.max(1, state.mesa.personas - 1); render(); break;
      case "editar-pizarra": ir("editor"); break;
      case "toggle-agotado": alternarAgotado(id); render(); break;
      case "guardar-pizarra": leerFormulario(); guardarPizarra(); state.vista = "menu"; render(); document.getElementById("pizarra").scrollIntoView({ block: "start" }); break;
      case "reset-pizarra": try { localStorage.removeItem(KEY_PIZARRA); } catch {} cargarPizarra(); render(); break;
      case "en-camino": abrirWhatsApp(armarMensajeLlegada("camino")); break;
      case "llegue": abrirWhatsApp(armarMensajeLlegada("llegue")); break;
      case "llegue-mesa": abrirWhatsApp(armarMensajeLlegada("mesa")); break;
      case "reenviar": abrirWhatsApp(state.ultimoMensaje || armarMensajePedido()); break;
      case "nuevo": state.carrito = []; state.codigo = ""; state.cliente.hora = ""; state.cliente.notas = ""; state.vista = "menu"; render(); window.scrollTo(0, 0); break;
    }
  }
  function onChange(ev) {
    const el = ev.target;
    if (el.name === "tipo" || el.name === "cuando") { leerFormulario(); render(); }
    else if (el.dataset.precio) { leerFormulario(); guardarPizarra(); }
  }

  async function init() {
    try {
      const res = await fetch("config.json", { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudo cargar config.json");
      state.config = await res.json();
      const r = document.documentElement.style, col = state.config.colores || {};
      r.setProperty("--primario", col.primario || "#1F6B3A");
      r.setProperty("--secundario", col.secundario || "#163322");
      r.setProperty("--acento", col.acento || "#F2B630");
      document.title = `${state.config.nombre} — DEMO`;
      cargarPizarra();
      if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
      app.addEventListener("click", onClick);
      app.addEventListener("change", onChange);
      window.addEventListener("demo:dueno", () => { if (state.vista === "menu") render(); });
      app.addEventListener("submit", (ev) => { if (ev.target.id === "form-pedido") enviarPedido(ev); else if (ev.target.id === "form-mesa") enviarMesa(ev); });
      setInterval(() => { const e = document.getElementById("estado-local"); if (e && state.vista === "menu") { const st = estadoLocal(); e.className = `estado ${st.abierto ? "abierto" : "cerrado"}`; e.lastChild.textContent = st.texto; } }, 60000);
      render();
    } catch (err) {
      app.innerHTML = `<p class="error">No se pudo cargar la demo. ${esc(err.message)}</p>`;
    }
  }

  window.__demo = { state, armarMensajePedido, armarMensajeMesa, armarMensajeLlegada, urlWhatsApp, diasDisponibles, estadoLocal, textoTotal, precio, agotado };
  init();
})();
