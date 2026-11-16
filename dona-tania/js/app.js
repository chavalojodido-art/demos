/* Demo Asados Doña Tania — basada en la plantilla A (restaurante).
   Funciones extra: estado Abierto/Cerrado con horario real, pedido anticipado con hora
   de retiro (franjas de 15 min), armador de plato con total en vivo, combos de ejemplo,
   pedido estructurado a WhatsApp (poco empaque, retiro/delivery) y avisos "Voy en camino / Llegué".
   Prueba de horario: añadir ?ahora=2026-11-20T18:30 (hora de Managua) a la URL. */
(() => {
  "use strict";

  const app = document.getElementById("app");
  const state = {
    config: null,
    vista: "menu",
    categoria: "Arma tu plato",
    carrito: [],
    plato: { carne: "", complementos: {}, bebida: "", sabor: "" },
    cliente: { nombre: "", telefono: "", tipo: "retiro", direccion: "", dia: "", hora: "", pago: "", poco_empaque: true, notas: "" },
    codigo: "",
    ultimoMensaje: "",
    llegada: { carro: "" },
    aviso: "",
    avisoPlato: "",
  };

  const ICO = {
    pin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    reloj: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  };
  const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const DIAS_CORTO = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

  // ---------- utilidades ----------
  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function moneda() { return (state.config && state.config.moneda) || "C$"; }
  function fmt(n) {
    const num = Number(n) || 0;
    return `${moneda()}${num.toLocaleString("es-NI", { maximumFractionDigits: 2 })}`;
  }
  function productos() { return state.config.productos || []; }
  function prod(id) { return productos().find((p) => p.id === id); }
  function deCategoria(cat) { return productos().filter((p) => p.categoria === cat); }
  function categoriasMenu() {
    const cats = [];
    for (const p of productos()) if (!cats.includes(p.categoria)) cats.push(p.categoria);
    return cats;
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
  function sumarDias(base, n) {
    const dt = new Date(Date.UTC(base.y, base.m - 1, base.d + n));
    return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate(), dow: dt.getUTCDay() };
  }
  function aMin(hhmm) { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; }
  function rango(dow) {
    const r = (state.config.horario_semana || {})[String(dow)];
    if (!r) return null;
    const [a, b] = r.split("-");
    return { abre: aMin(a), cierra: aMin(b) };
  }
  function hora12(min) {
    const h = Math.floor(min / 60), m = min % 60;
    const suf = h >= 12 ? "p. m." : "a. m.";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, "0")} ${suf}`;
  }
  function enRangos(min, lista) {
    return (lista || []).some((r) => { const [a, b] = r.split("-"); return min >= aMin(a) && min < aMin(b); });
  }
  function claveDia(f) { return `${f.y}-${String(f.m).padStart(2, "0")}-${String(f.d).padStart(2, "0")}`; }
  function etiquetaDia(f, offset) {
    const base = `${DIAS_CORTO[f.dow]} ${f.d} ${MESES[f.m - 1]}`;
    if (offset === 0) return `Hoy · ${base}`;
    if (offset === 1) return `Mañana · ${base}`;
    return base;
  }

  function estadoLocal() {
    const now = ahoraManagua();
    const r = rango(now.dow);
    if (r && now.min >= r.abre && now.min < r.cierra) {
      return { abierto: true, texto: `Abierto ahora · cierra ${hora12(r.cierra)}` };
    }
    if (r && now.min < r.abre) return { abierto: false, texto: `Cerrado · abre hoy ${hora12(r.abre)}` };
    for (let i = 1; i <= 7; i++) {
      const f = sumarDias(now, i), rr = rango(f.dow);
      if (rr) {
        const cuando = i === 1 ? "mañana" : DIAS[f.dow];
        const extra = now.dow === 6 && !r ? " (los sábados cerramos)" : "";
        return { abierto: false, texto: `Cerrado${extra} · abre ${cuando} ${hora12(rr.abre)}` };
      }
    }
    return { abierto: false, texto: "Cerrado" };
  }

  // Franjas de retiro/entrega dentro del horario real
  function diasDisponibles() {
    const cfg = state.config.retiro || {};
    const paso = cfg.intervalo_minutos || 15;
    const anticip = cfg.anticipacion_minutos ?? 30;
    const margen = cfg.ultimo_pedido_antes_cierre_minutos ?? 30;
    const max = cfg.dias_a_mostrar || 3;
    const now = ahoraManagua();
    const dias = [];
    for (let i = 0; i < 8 && dias.length < max; i++) {
      const f = sumarDias(now, i);
      const r = rango(f.dow);
      if (!r) continue;
      let desde = r.abre;
      if (i === 0) desde = Math.max(desde, Math.ceil((now.min + anticip) / paso) * paso);
      const hasta = r.cierra - margen;
      const franjas = [];
      for (let t = desde; t <= hasta; t += paso) {
        franjas.push({ min: t, recomendada: enRangos(t, cfg.franjas_recomendadas), alta: enRangos(t, cfg.franjas_alta_demanda) });
      }
      if (franjas.length) dias.push({ clave: claveDia(f), etiqueta: etiquetaDia(f, i), franjas });
    }
    return dias;
  }

  // ---------- carrito ----------
  function totalItems() { return state.carrito.reduce((a, it) => a + it.cantidad, 0); }
  function totalMonto() { return state.carrito.reduce((a, it) => a + it.cantidad * it.precio, 0); }
  function agregarLinea(linea) {
    const ex = state.carrito.find((x) => x.key === linea.key);
    if (ex) ex.cantidad += 1;
    else state.carrito.push({ ...linea, cantidad: 1 });
  }
  function agregarProducto(id) {
    const p = prod(id);
    if (!p) return;
    agregarLinea({ key: `p:${id}`, nombre: p.nombre, detalle: [], precio: Number(p.precio) || 0, foto: p.foto });
  }
  function precioCombo(c) { return c.items.reduce((a, id) => a + ((prod(id) || {}).precio || 0), 0); }
  function agregarCombo(cid) {
    const c = (state.config.combos || []).find((x) => x.id === cid);
    if (!c) return;
    agregarLinea({ key: `c:${cid}`, nombre: c.nombre, detalle: c.items.map((id) => prod(id).nombre), precio: precioCombo(c), foto: c.foto, combo: true });
  }

  // ---------- armador de plato ----------
  function totalPlato() {
    const pl = state.plato;
    let t = 0;
    if (pl.carne) t += prod(pl.carne).precio;
    for (const [id, q] of Object.entries(pl.complementos)) t += prod(id).precio * q;
    if (pl.bebida) t += prod(pl.bebida).precio;
    return t;
  }
  function detallePlato() {
    const pl = state.plato, d = [];
    for (const [id, q] of Object.entries(pl.complementos)) if (q > 0) d.push(q > 1 ? `${q}× ${prod(id).nombre}` : prod(id).nombre);
    if (pl.bebida) {
      const b = prod(pl.bebida).nombre;
      d.push(pl.bebida === "refrescos-naturales" && pl.sabor ? `Refresco de ${pl.sabor}` : b);
    }
    return d;
  }
  function agregarPlato() {
    const pl = state.plato;
    if (!pl.carne) { state.avisoPlato = "Elegí primero tu carne."; render(); return; }
    const det = detallePlato();
    const key = `a:${pl.carne}|${det.join("|")}`;
    agregarLinea({ key, nombre: `Plato armado: ${prod(pl.carne).nombre}`, detalle: det, precio: totalPlato(), foto: prod(pl.carne).foto });
    state.plato = { carne: "", complementos: {}, bebida: "", sabor: "" };
    state.avisoPlato = "¡Plato agregado a tu pedido!";
    render();
  }

  // ---------- vistas ----------
  function hero() {
    const c = state.config, st = estadoLocal();
    return `<header class="hero">
        <img class="logo" src="${esc(c.logo)}" alt="Logo de ${esc(c.nombre)}">
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
        <strong>⏱ Evitá la fila</strong>
        <span>${esc(c.banner_mejor_hora || "")}</span>
        ${st.abierto ? "" : `<span class="cerrado-nota">Ahora estamos cerrados, pero podés <b>programar tu pedido</b> para el próximo horario.</span>`}
      </div>`;
  }

  function vistaArmador() {
    const a = state.config.armador, pl = state.plato;
    const carnes = deCategoria(a.categoria_carne);
    const comps = deCategoria(a.categoria_complementos);
    const bebidas = deCategoria(a.categoria_bebidas);
    return `<section class="armador" id="armador">
      <h2>Armá tu plato</h2>
      <p class="sub">Elegí la carne, sumá acompañamientos y bebida. El total se actualiza al instante.</p>
      <h3>1 · Carne al carbón <small>(incluye ensalada)</small></h3>
      <div class="chips">
        ${carnes.map((p) => `<button type="button" class="chip${pl.carne === p.id ? " activa" : ""}" data-accion="carne" data-id="${p.id}">${esc(p.nombre)}<b>${fmt(p.precio)}</b></button>`).join("")}
      </div>
      <h3>2 · Acompañamientos</h3>
      <div class="comp-lista">
        ${comps.map((p) => {
          const q = pl.complementos[p.id] || 0;
          return `<div class="comp${q ? " activa" : ""}">
            <span>${esc(p.nombre)} <small>${fmt(p.precio)}</small></span>
            <div class="qty mini">
              <button type="button" data-accion="comp-menos" data-id="${p.id}" aria-label="Quitar ${esc(p.nombre)}">−</button>
              <span>${q}</span>
              <button type="button" data-accion="comp-mas" data-id="${p.id}" aria-label="Agregar ${esc(p.nombre)}">+</button>
            </div></div>`;
        }).join("")}
      </div>
      <h3>3 · Bebida</h3>
      <div class="chips">
        <button type="button" class="chip${!pl.bebida ? " activa" : ""}" data-accion="bebida" data-id="">Sin bebida</button>
        ${bebidas.map((p) => `<button type="button" class="chip${pl.bebida === p.id ? " activa" : ""}" data-accion="bebida" data-id="${p.id}">${esc(p.nombre)}<b>${fmt(p.precio)}</b></button>`).join("")}
      </div>
      ${pl.bebida === "refrescos-naturales" ? `<div class="campo"><label for="sabor">Sabor (según temporada)</label>
        <select id="sabor" data-accion="sabor"><option value="">Sabor del día</option>${(a.sabores_refresco || []).map((s) => `<option${pl.sabor === s ? " selected" : ""}>${esc(s)}</option>`).join("")}</select></div>` : ""}
      <div class="total-plato">
        <div><small>Total de tu plato</small><strong id="total-plato">${fmt(totalPlato())}</strong></div>
        <button type="button" class="btn-primario" data-accion="agregar-plato" id="btn-agregar-plato">Agregar al pedido</button>
      </div>
      <p class="aviso ${state.avisoPlato.startsWith("¡") ? "ok" : ""}" id="aviso-plato">${esc(state.avisoPlato)}</p>
    </section>`;
  }

  function vistaCombos() {
    return `<section class="lista" aria-label="Combos">
      <p class="nota-combos">Combos de <b>ejemplo</b> para la demo: el precio es la <b>suma exacta de la carta</b>, sin descuento. El restaurante define sus combos reales.</p>
      ${(state.config.combos || []).map((c) => `<article class="tarjeta combo">
        <img src="${esc(c.foto)}" alt="">
        <div class="tarjeta-cuerpo">
          <span class="badge">Ejemplo de combo</span>
          <h2>${esc(c.nombre)}</h2>
          <p class="desc">${c.items.map((id) => esc(prod(id).nombre)).join(" + ")}</p>
          <div class="tarjeta-pie">
            <span class="precio">${fmt(precioCombo(c))}</span>
            <button type="button" class="btn-add" data-accion="combo" data-id="${esc(c.id)}">+ Agregar</button>
          </div>
        </div></article>`).join("")}
    </section>`;
  }

  function vistaCategoria(cat) {
    return `<section class="lista" aria-label="${esc(cat)}">
      ${deCategoria(cat).map((p) => `<article class="tarjeta">
        <img src="${esc(p.foto)}" alt="">
        <div class="tarjeta-cuerpo">
          <h2>${esc(p.nombre)}</h2>
          <p class="desc">${esc(p.descripcion || "")}</p>
          <div class="tarjeta-pie">
            <span class="precio">${fmt(p.precio)}</span>
            <button type="button" class="btn-add" data-accion="agregar" data-id="${esc(p.id)}">+ Agregar</button>
          </div>
        </div></article>`).join("")}
    </section>`;
  }

  function pie() {
    const c = state.config, r = c.redes || {};
    return `<footer class="pie">
      ${r.facebook ? `<div class="redes"><a href="${esc(r.facebook)}" target="_blank" rel="noopener noreferrer">Facebook</a></div>` : ""}
      <p>${esc(c.nota_precios || "")}</p>
      <p class="marca-demo">DEMO – versión de prueba · propuesta no oficial · WhatsApp de prueba ficticio</p>
    </footer>`;
  }

  function barraCarrito() {
    if (!state.carrito.length || state.vista !== "menu") return "";
    const n = totalItems();
    return `<div class="barra-carrito" role="status">
      <div><strong id="barra-total">${fmt(totalMonto())}</strong><small>${n} ${n === 1 ? "producto" : "productos"} en el pedido</small></div>
      <button type="button" class="btn-barra" data-accion="ver-pedido">Ver pedido</button>
    </div>`;
  }

  function renderMenu() {
    const tabs = ["Arma tu plato", "Combos", ...categoriasMenu()];
    let cuerpo;
    if (state.categoria === "Arma tu plato") cuerpo = vistaArmador();
    else if (state.categoria === "Combos") cuerpo = vistaCombos();
    else cuerpo = vistaCategoria(state.categoria);
    app.dataset.vista = "menu";
    app.classList.toggle("con-barra", state.carrito.length > 0);
    app.innerHTML = `${hero()}
      <nav class="tabs" role="tablist" aria-label="Menú">
        ${tabs.map((t) => `<button type="button" role="tab" class="tab${state.categoria === t ? " activa" : ""}" data-accion="tab" data-cat="${esc(t)}" aria-selected="${state.categoria === t}">${esc(t)}</button>`).join("")}
      </nav>
      ${cuerpo}
      ${pie()}
      ${barraCarrito()}`;
  }

  function selectorHora() {
    const dias = diasDisponibles();
    if (!dias.length) return `<p class="aviso">No hay horarios disponibles en los próximos días.</p>`;
    if (!dias.find((d) => d.clave === state.cliente.dia)) { state.cliente.dia = dias[0].clave; state.cliente.hora = ""; }
    const dia = dias.find((d) => d.clave === state.cliente.dia);
    if (state.cliente.hora && !dia.franjas.find((f) => String(f.min) === state.cliente.hora)) state.cliente.hora = "";
    const etiqueta = state.cliente.tipo === "entrega" ? "¿A qué hora lo querés recibir?" : "¿A qué hora pasás a retirar?";
    return `<div class="campo">
      <label>${etiqueta}</label>
      <div class="dias">${dias.map((d) => `<button type="button" class="dia-btn${d.clave === state.cliente.dia ? " activo" : ""}" data-accion="dia" data-dia="${d.clave}">${esc(d.etiqueta)}</button>`).join("")}</div>
      <div class="horas" id="franjas">
        ${dia.franjas.map((f) => `<button type="button" class="hora${String(f.min) === state.cliente.hora ? " activa" : ""}${f.recomendada ? " reco" : ""}${f.alta ? " alta" : ""}" data-accion="hora" data-min="${f.min}">${hora12(f.min)}${f.recomendada ? "<small>sin fila</small>" : f.alta ? "<small>más demanda</small>" : ""}</button>`).join("")}
      </div>
      <p class="ayuda izq">Franjas de 15 min dentro del horario. Pedí con al menos 30 min de anticipación.</p>
    </div>`;
  }

  function renderPedido() {
    const c = state.config;
    const pagos = c.metodos_pago || ["Efectivo"];
    if (!state.cliente.pago) state.cliente.pago = pagos[0];
    app.dataset.vista = "pedido";
    const items = state.carrito.length
      ? state.carrito.map((it, i) => `<article class="linea">
          <img src="${esc(it.foto)}" alt="">
          <div>
            <h3>${esc(it.nombre)}${it.combo ? ' <span class="badge">Ejemplo de combo</span>' : ""}</h3>
            ${it.detalle.length ? `<p class="detalle">${esc(it.detalle.join(" + "))}</p>` : ""}
            <p class="sub">${fmt(it.precio)} c/u · ${fmt(it.precio * it.cantidad)}</p>
            <div class="linea-pie">
              <div class="qty"><button type="button" data-accion="menos" data-i="${i}" aria-label="Quitar uno">−</button><span>${it.cantidad}</span><button type="button" data-accion="mas" data-i="${i}" aria-label="Agregar uno">+</button></div>
              <button type="button" class="btn-quitar" data-accion="quitar" data-i="${i}">Quitar</button>
            </div>
          </div></article>`).join("")
      : `<div class="vacio"><p>Tu pedido está vacío.</p><button type="button" class="btn-primario" data-accion="ver-menu" style="max-width:240px;margin:0 auto">Volver al menú</button></div>`;

    app.innerHTML = `
      <div class="topbar"><button type="button" class="btn-atras" data-accion="ver-menu" aria-label="Volver al menú">←</button><h1>Tu pedido</h1></div>
      <div class="pedido">
        ${items}
        ${state.carrito.length ? `
        <div class="resumen"><div class="fila"><span>Total</span><span id="total-pedido">${fmt(totalMonto())}</span></div>
          <p class="ayuda izq">Sin comisión de apps: el pedido llega directo al WhatsApp del restaurante.</p></div>
        <form class="formulario" id="form-pedido" novalidate>
          <h2>Tus datos</h2>
          <div class="campo"><label for="cli-nombre">Nombre</label><input id="cli-nombre" autocomplete="name" placeholder="Tu nombre" value="${esc(state.cliente.nombre)}"></div>
          <div class="campo"><label for="cli-tel">Teléfono (opcional)</label><input id="cli-tel" type="tel" inputmode="tel" placeholder="8888-8888" value="${esc(state.cliente.telefono)}"></div>
          <div class="campo"><label>¿Cómo lo querés?</label>
            <div class="opciones">
              <label class="opcion"><input type="radio" name="tipo" value="retiro" ${state.cliente.tipo === "retiro" ? "checked" : ""}> Retiro en el local, sin hacer fila</label>
              <label class="opcion"><input type="radio" name="tipo" value="entrega" ${state.cliente.tipo === "entrega" ? "checked" : ""}> Delivery a domicilio</label>
            </div></div>
          <div class="campo ${state.cliente.tipo === "entrega" ? "" : "oculto"}" id="campo-direccion">
            <label for="cli-dir">Dirección de entrega</label>
            <textarea id="cli-dir" rows="2" placeholder="Barrio, referencias, casa…">${esc(state.cliente.direccion)}</textarea>
            <p class="ayuda izq">El costo del delivery lo confirma el restaurante por WhatsApp.</p>
          </div>
          ${selectorHora()}
          <div class="campo"><label class="opcion check"><input type="checkbox" id="poco-empaque" ${state.cliente.poco_empaque ? "checked" : ""}> 🌱 Poco empaque: sin cubiertos, servilletas ni bolsas extra</label></div>
          <div class="campo"><label>Pago</label><div class="opciones">
            ${pagos.map((p) => `<label class="opcion"><input type="radio" name="pago" value="${esc(p)}" ${state.cliente.pago === p ? "checked" : ""}> ${esc(p)}</label>`).join("")}
          </div></div>
          <div class="campo"><label for="cli-notas">Notas (opcional)</label><textarea id="cli-notas" rows="2" placeholder="Ej.: carne bien cocida, sin cebollitas">${esc(state.cliente.notas)}</textarea></div>
          <p class="aviso" id="aviso-pedido">${esc(state.aviso)}</p>
          <button type="submit" class="btn-primario" id="btn-whatsapp">Enviar pedido por WhatsApp</button>
          <p class="ayuda">Se abrirá WhatsApp con el pedido ya escrito para que lo confirmes.<br><b>Demo:</b> va a un número de prueba ficticio, no al restaurante.</p>
        </form>` : ""}
      </div>`;
  }

  function renderEnviado() {
    app.dataset.vista = "pedido";
    const retiro = state.cliente.tipo === "retiro";
    app.innerHTML = `
      <div class="topbar"><button type="button" class="btn-atras" data-accion="ver-menu" aria-label="Volver al menú">←</button><h1>Pedido ${esc(state.codigo)}</h1></div>
      <div class="pedido">
        <div class="enviado">
          <div class="check-ok">✓</div>
          <h2>¡Pedido listo para enviar!</h2>
          <p>Confirmalo en WhatsApp. ${retiro ? `Te esperamos <b>${esc(textoCuando())}</b> en el <b>carril de retiro</b>: no hacés fila.` : `Lo recibís aprox. <b>${esc(textoCuando())}</b>.`}</p>
          <p class="codigo">Código: <b>${esc(state.codigo)}</b> · Total ${fmt(totalMonto())}</p>
        </div>
        ${retiro ? `
        <h2 class="h2-sec">Cuando vengas a retirar</h2>
        <div class="campo"><label for="carro">Carro o moto (opcional, para ubicarte en el parqueo)</label><input id="carro" placeholder="Ej.: Hilux gris / moto roja" value="${esc(state.llegada.carro)}"></div>
        <div class="acciones-llegada">
          <button type="button" class="btn-secundario" data-accion="en-camino" id="btn-en-camino">🚗 Voy en camino</button>
          <button type="button" class="btn-primario" data-accion="llegue" id="btn-llegue">📍 Llegué</button>
        </div>
        <p class="ayuda">Cada botón envía un aviso corto al WhatsApp del local con tu código.</p>` : ""}
        <button type="button" class="btn-link" data-accion="reenviar">Volver a abrir el mensaje del pedido</button>
        <button type="button" class="btn-link" data-accion="nuevo">Hacer otro pedido</button>
      </div>`;
  }

  function render() {
    if (state.vista === "pedido") renderPedido();
    else if (state.vista === "enviado") renderEnviado();
    else renderMenu();
  }

  // ---------- formulario y mensajes ----------
  function leerFormulario() {
    const g = (id) => document.getElementById(id);
    if (g("cli-nombre")) state.cliente.nombre = g("cli-nombre").value.trim();
    if (g("cli-tel")) state.cliente.telefono = g("cli-tel").value.trim();
    if (g("cli-dir")) state.cliente.direccion = g("cli-dir").value.trim();
    if (g("cli-notas")) state.cliente.notas = g("cli-notas").value.trim();
    if (g("poco-empaque")) state.cliente.poco_empaque = g("poco-empaque").checked;
    if (g("carro")) state.llegada.carro = g("carro").value.trim();
    const tipo = document.querySelector('input[name="tipo"]:checked');
    const pago = document.querySelector('input[name="pago"]:checked');
    if (tipo) state.cliente.tipo = tipo.value;
    if (pago) state.cliente.pago = pago.value;
  }

  function textoCuando() {
    const d = diasDisponibles().find((x) => x.clave === state.cliente.dia);
    const etiqueta = d ? d.etiqueta : state.cliente.dia;
    const e = etiqueta.replace(" · ", " ");
    return `${e.charAt(0).toLowerCase() + e.slice(1)} a las ${hora12(Number(state.cliente.hora))}`;
  }

  function armarMensajePedido() {
    const c = state.config, cl = state.cliente, L = [];
    L.push(`Hola, quiero hacer un pedido en *${c.nombre}*`);
    L.push(`*Código:* ${state.codigo}`);
    L.push("");
    L.push("*Pedido:*");
    for (const it of state.carrito) {
      L.push(`• ${it.cantidad}× ${it.nombre}${it.combo ? " (combo de ejemplo)" : ""} — ${fmt(it.precio * it.cantidad)}`);
      if (it.detalle.length) L.push(`   ${it.detalle.join(" + ")}`);
    }
    L.push("");
    L.push(`*Total:* ${fmt(totalMonto())}`);
    L.push("");
    L.push(`*Cliente:* ${cl.nombre}${cl.telefono ? ` · Tel. ${cl.telefono}` : ""}`);
    if (cl.tipo === "entrega") {
      L.push("*Tipo:* Delivery a domicilio");
      L.push(`*Dirección:* ${cl.direccion}`);
      L.push(`*Hora deseada:* ${textoCuando()}`);
    } else {
      L.push("*Tipo:* Retiro en el local (carril de retiro, sin fila)");
      L.push(`*Hora de retiro:* ${textoCuando()}`);
    }
    L.push(`*Empaque:* ${cl.poco_empaque ? "Poco empaque (sin cubiertos, servilletas ni bolsas extra)" : "Normal"}`);
    L.push(`*Pago:* ${cl.pago}`);
    if (cl.notas) L.push(`*Notas:* ${cl.notas}`);
    L.push("");
    L.push("_Enviado desde la app (DEMO – versión de prueba)_");
    return L.join("\n");
  }

  function armarMensajeLlegada(tipo) {
    const cl = state.cliente;
    const carro = state.llegada.carro ? ` Vengo en ${state.llegada.carro}.` : "";
    if (tipo === "camino") {
      return `🚗 Hola, soy ${cl.nombre}. *Voy en camino* a retirar mi pedido *${state.codigo}* (retiro ${textoCuando()}, total ${fmt(totalMonto())}).${carro}\n_DEMO – versión de prueba_`;
    }
    return `📍 Hola, soy ${cl.nombre}. *Ya llegué* a retirar mi pedido *${state.codigo}* (${fmt(totalMonto())}). Estoy en el parqueo / carril de retiro.${carro}\n_DEMO – versión de prueba_`;
  }

  function urlWhatsApp(texto) {
    const num = String(state.config.whatsapp || "").replace(/\D/g, "");
    return `https://wa.me/${num}?text=${encodeURIComponent(texto)}`;
  }
  function abrirWhatsApp(texto) {
    state.ultimoMensaje = texto;
    window.open(urlWhatsApp(texto), "_blank", "noopener");
  }

  function validarPedido() {
    leerFormulario();
    if (!state.carrito.length) return "Agregá al menos un producto.";
    if (!state.cliente.nombre) return "Escribí tu nombre.";
    if (state.cliente.tipo === "entrega" && !state.cliente.direccion) return "Escribí la dirección de entrega.";
    if (!state.cliente.hora) return state.cliente.tipo === "entrega" ? "Elegí la hora de entrega." : "Elegí la hora de retiro.";
    return "";
  }

  function enviarPedido(ev) {
    ev.preventDefault();
    const err = validarPedido();
    state.aviso = err;
    if (err) { const a = document.getElementById("aviso-pedido"); if (a) a.textContent = err; return; }
    if (!state.codigo) state.codigo = `DT-${String(Math.floor(1000 + Math.random() * 9000))}`;
    abrirWhatsApp(armarMensajePedido());
    state.vista = "enviado";
    render();
    window.scrollTo(0, 0);
  }

  // ---------- eventos ----------
  function onClick(ev) {
    const btn = ev.target.closest("[data-accion]");
    if (!btn || btn.tagName === "SELECT") return;
    const a = btn.dataset.accion, id = btn.dataset.id, i = Number(btn.dataset.i);
    const pl = state.plato;
    if (["dia", "hora"].includes(a)) leerFormulario();
    switch (a) {
      case "tab": state.categoria = btn.dataset.cat; state.avisoPlato = ""; render(); break;
      case "agregar": agregarProducto(id); render(); break;
      case "combo": agregarCombo(id); render(); break;
      case "carne": pl.carne = id; state.avisoPlato = ""; render(); break;
      case "comp-mas": pl.complementos[id] = (pl.complementos[id] || 0) + 1; state.avisoPlato = ""; render(); break;
      case "comp-menos": if (pl.complementos[id]) { pl.complementos[id] -= 1; if (!pl.complementos[id]) delete pl.complementos[id]; } render(); break;
      case "bebida": pl.bebida = id; if (id !== "refrescos-naturales") pl.sabor = ""; render(); break;
      case "agregar-plato": agregarPlato(); break;
      case "ver-pedido": state.vista = "pedido"; state.aviso = ""; render(); window.scrollTo(0, 0); break;
      case "ver-menu": if (state.vista === "pedido") leerFormulario(); state.vista = "menu"; render(); break;
      case "mas": state.carrito[i].cantidad += 1; leerFormulario(); render(); break;
      case "menos": leerFormulario(); state.carrito[i].cantidad -= 1; if (state.carrito[i].cantidad <= 0) state.carrito.splice(i, 1); render(); break;
      case "quitar": leerFormulario(); state.carrito.splice(i, 1); render(); break;
      case "dia": state.cliente.dia = btn.dataset.dia; state.cliente.hora = ""; render(); break;
      case "hora": state.cliente.hora = btn.dataset.min; state.aviso = ""; render(); break;
      case "en-camino": leerFormulario(); abrirWhatsApp(armarMensajeLlegada("camino")); break;
      case "llegue": leerFormulario(); abrirWhatsApp(armarMensajeLlegada("llegue")); break;
      case "reenviar": abrirWhatsApp(armarMensajePedido()); break;
      case "nuevo":
        state.carrito = []; state.codigo = ""; state.cliente.hora = ""; state.cliente.notas = "";
        state.vista = "menu"; state.categoria = "Arma tu plato"; render(); break;
    }
  }
  function onChange(ev) {
    const el = ev.target;
    if (el.name === "tipo") { leerFormulario(); render(); }
    else if (el.dataset.accion === "sabor") { state.plato.sabor = el.value; }
  }

  async function init() {
    try {
      const res = await fetch("config.json", { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudo cargar config.json");
      state.config = await res.json();
      const r = document.documentElement.style, col = state.config.colores || {};
      r.setProperty("--primario", col.primario || "#ED1651");
      r.setProperty("--secundario", col.secundario || "#3A1220");
      r.setProperty("--acento", col.acento || "#FBB522");
      document.title = `${state.config.nombre} — DEMO`;
      if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
      app.addEventListener("click", onClick);
      app.addEventListener("change", onChange);
      app.addEventListener("submit", (ev) => { if (ev.target.id === "form-pedido") enviarPedido(ev); });
      setInterval(() => { const e = document.getElementById("estado-local"); if (e && state.vista === "menu") { const st = estadoLocal(); e.className = `estado ${st.abierto ? "abierto" : "cerrado"}`; e.lastChild.textContent = st.texto; } }, 60000);
      render();
    } catch (err) {
      app.innerHTML = `<p class="error">No se pudo cargar la demo. ${esc(err.message)}</p>`;
    }
  }

  window.__demo = { state, armarMensajePedido, armarMensajeLlegada, urlWhatsApp, diasDisponibles, estadoLocal, totalPlato, fmt };
  init();
})();
