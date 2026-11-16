(() => {
  "use strict";
  const U = window.UnidadUR;
  const state = {
    paso: 1,
    servicioId: "",
    medicoId: "",
    fecha: "",
    hora: "",
    cita: null,
    err: "",
    notif: false,
  };

  const $ = (s, r = document) => r.querySelector(s);

  function waHref() {
    const n = U.numeroWhatsApp();
    return `https://wa.me/${n}`;
  }

  function syncWaLinks() {
    document.querySelectorAll("[data-wa]").forEach((a) => {
      a.setAttribute("href", waHref());
    });
  }

  function renderServicios() {
    const box = $("#lista-servicios");
    if (!box) return;
    box.innerHTML = U.SERVICIOS.map((s) => `
      <article class="card">
        <small>${U.esc(s.grupo)}</small>
        <h3>${U.esc(s.nombre)}</h3>
        <p>${U.esc(s.texto)}</p>
        <p style="margin-top:10px"><button type="button" class="btn btn-ghost" data-go-servicio="${s.id}">Agendar</button></p>
      </article>`).join("");
  }

  function renderEquipo() {
    const box = $("#lista-equipo");
    if (!box) return;
    const visibles = U.MEDICOS.filter((m) => m.tipo === "planta" || m.tipo === "jornada");
    box.innerHTML = visibles.map((m) => {
      const foto = m.foto
        ? `<img src="${U.esc(U.asset(m.foto))}" alt="${U.esc(m.nombre)}" width="96" height="120">`
        : `<div class="avatar" aria-hidden="true">${U.esc(m.iniciales || m.nombre.slice(0, 2))}</div>`;
      return `<article class="card eq">
        ${foto}
        <div>
          <div class="tipo">${U.esc(m.tipoEtiqueta)}</div>
          <h3>${U.esc(m.nombre)}</h3>
          <p><strong>${U.esc(m.rol)}</strong></p>
          <p>${U.esc(m.bio)}</p>
        </div>
      </article>`;
    }).join("");
  }

  function pintarPasos() {
    document.querySelectorAll(".paso").forEach((el) => {
      const n = Number(el.dataset.paso);
      el.classList.toggle("is-on", n === state.paso);
      el.classList.toggle("is-done", n < state.paso);
    });
  }

  function renderAgenda() {
    const root = $("#agenda-card");
    if (!root) return;
    pintarPasos();
    state.err = "";
    if (state.cita && state.paso === 5) {
      root.innerHTML = vistaConfirmacion(state.cita);
      wireConfirmacion();
      return;
    }
    if (state.paso === 1) root.innerHTML = vistaServicios();
    else if (state.paso === 2) root.innerHTML = vistaMedicos();
    else if (state.paso === 3) root.innerHTML = vistaFechaHora();
    else if (state.paso === 4) root.innerHTML = vistaDatos();
    wireAgenda();
  }

  function vistaServicios() {
    return `<p class="aviso-horarios">Elegí el motivo de tu visita.</p>
      <div class="grid-svc" role="list">
        ${U.SERVICIOS.map((s) => `
          <button type="button" class="opt ${state.servicioId === s.id ? "is-on" : ""}" data-pick-servicio="${s.id}">
            <strong>${U.esc(s.nombre)}</strong>
            <small>${U.esc(s.grupo)}</small>
          </button>`).join("")}
      </div>`;
  }

  function vistaMedicos() {
    const list = U.medicosDeServicio(state.servicioId);
    if (!list.length) return `<p>No hay profesionales asociados a este servicio en la muestra.</p>`;
    return `<p class="aviso-horarios">Elegí con quién querés atenderte.</p>
      <div class="docs">
        ${list.map((m) => {
          const foto = m.foto
            ? `<img src="${U.esc(U.asset(m.foto))}" alt="">`
            : `<div class="avatar">${U.esc(m.iniciales || "·")}</div>`;
          const jornada = m.tipo === "jornada"
            ? `<small>Jornada de ejemplo · las fechas reales están por confirmar</small>`
            : `<small>${U.esc(m.tipoEtiqueta)}</small>`;
          return `<button type="button" class="doc ${state.medicoId === m.id ? "is-on" : ""}" data-pick-medico="${m.id}">
            ${foto}
            <span><strong>${U.esc(m.nombre)}</strong>${jornada}<small>${U.esc(m.rol)}</small></span>
          </button>`;
        }).join("")}
      </div>
      <p style="margin-top:12px"><button type="button" class="btn btn-ghost" data-back>Volver</button></p>`;
  }

  function vistaFechaHora() {
    const med = U.medicoPorId(state.medicoId);
    const dias = U.diasDisponibles(med, 14);
    const diasHtml = dias.map((d) => {
      const off = d.libres === 0;
      const on = state.fecha === d.fecha;
      const [y, m, dd] = d.fecha.split("-");
      return `<button type="button" class="dia ${on ? "is-on" : ""} ${off ? "is-off" : ""}" data-pick-fecha="${d.fecha}" ${off ? "disabled" : ""}>
        <span>${d.etiqueta.split(" ")[0]}</span>
        <strong>${Number(dd)}</strong>
        ${d.esJornadaEjemplo ? `<span class="tag">Jornada ej.</span>` : (off ? `<span class="tag">Sin cupo</span>` : `<span class="tag">${d.libres}</span>`)}
      </button>`;
    }).join("");
    let horas = "";
    if (state.fecha) {
      const grupos = { madrugada: [], manana: [], tarde: [], noche: [] };
      const tit = { madrugada: "Madrugada (ejemplo 24/7)", manana: "Mañana", tarde: "Tarde", noche: "Noche" };
      for (const s of U.slots(med, state.fecha)) grupos[s.tramo].push(s);
      horas = Object.entries(grupos).filter(([, arr]) => arr.length).map(([k, arr]) => `
        <div>
          <p class="tramo-t ${k === "madrugada" || k === "noche" ? "night" : ""}">${tit[k]}</p>
          <div class="hora-grid">
            ${arr.map((s) => {
              const dis = s.ocupado || s.bloqueado || s.pasado;
              return `<button type="button" class="hora ${state.hora === s.hora ? "is-on" : ""} ${dis ? "is-busy" : ""}" data-pick-hora="${s.hora}" ${dis ? "disabled" : ""}>
                ${s.etiqueta}${s.madrugada && !dis ? `<span class="mini">Madrugada</span>` : ""}
              </button>`;
            }).join("")}
          </div>
        </div>`).join("");
    }
    const notaJ = med && med.tipo === "jornada"
      ? `<p class="aviso-horarios">Estos sábados son <strong>jornadas de ejemplo</strong> para mostrar la agenda. Las fechas reales de especialistas visitantes están por confirmar.</p>`
      : `<p class="aviso-horarios"><span class="nota-ejemplo">Horarios de ejemplo</span> para esta demostración. Los horarios reales se confirman con el centro. Duración ilustrativa: 30 minutos.</p>`;
    return `
      ${notaJ}
      <div class="dias" aria-label="Elegir un día">${diasHtml}</div>
      ${state.fecha ? `<p class="aviso-horarios">${U.esc(U.fmtFechaLarga(state.fecha))}</p><div class="horas">${horas}</div>` : `<p class="aviso-horarios">Elegí un día para ver las horas disponibles.</p>`}
      <p style="margin-top:12px"><button type="button" class="btn btn-ghost" data-back>Volver</button></p>`;
  }

  function vistaDatos() {
    const serv = U.servicioPorId(state.servicioId);
    const med = U.medicoPorId(state.medicoId);
    return `
      <p class="aviso-horarios">
        <strong>${U.esc(serv.nombre)}</strong> con ${U.esc(med.nombre)}<br>
        ${U.esc(U.fmtFechaLarga(state.fecha))} · ${U.esc(U.fmtHora(state.hora))}
        <span class="nota-ejemplo">horario de ejemplo</span>
      </p>
      <form class="form-cita" id="form-cita" novalidate>
        <label for="cita-nombre">Tu nombre</label>
        <input id="cita-nombre" name="nombre" autocomplete="name" maxlength="80" required data-test="nombre">
        <label for="cita-tel">Tu teléfono</label>
        <input id="cita-tel" name="telefono" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" required data-test="telefono">
        <label for="cita-motivo">Motivo breve (opcional)</label>
        <textarea id="cita-motivo" name="motivo" rows="3" maxlength="160" placeholder="Ej.: control, primera visita… Sin datos clínicos sensibles." data-test="motivo"></textarea>
        <p class="privacidad">No escribas resultados de exámenes, diagnósticos ni datos de salud sensibles. Este formulario solo reserva un cupo. <strong>No sustituye una valoración médica</strong> y, en esta muestra, no es una cita real.</p>
        <p class="err" id="cita-err" role="alert"></p>
        <div class="form-actions">
          <button type="button" class="btn btn-ghost" data-back>Volver</button>
          <button type="submit" class="btn btn-navy" data-test="confirmar">Confirmar cita de muestra</button>
        </div>
      </form>`;
  }

  function vistaConfirmacion(cita) {
    const serv = U.servicioPorId(cita.servicioId);
    const med = U.medicoPorId(cita.medicoId);
    return `<div class="ok-box" data-test="confirmacion">
      <p>Tu solicitud quedó registrada en esta demostración</p>
      <div class="code" data-test="codigo">${U.esc(cita.codigo)}</div>
      <p><strong>${U.esc(serv.nombre)}</strong><br>
        ${U.esc(med.nombre)}<br>
        ${U.esc(U.fmtFechaLarga(cita.fecha))} · ${U.esc(U.fmtHora(cita.hora))}
        <span class="nota-ejemplo">horario de ejemplo</span>
      </p>
      <div class="remind">
        <strong>Recordatorio simulado</strong>
        En la versión real te avisaría el día anterior a las 6:00 p.m. y una hora antes de tu cita.
        <div><button type="button" class="btn btn-ghost" style="margin-top:8px" data-ver-recordatorio>Ver cómo se vería el aviso</button></div>
        <div class="mock-notif ${state.notif ? "is-on" : ""}" id="mock-notif">
          <em>Unidad UR · recordatorio de ejemplo</em>
          Hola ${U.esc(cita.nombre)}. Mañana a las ${U.esc(U.fmtHora(cita.hora))} tenés tu cupo ${U.esc(cita.codigo)} con ${U.esc(med.nombre)}.
        </div>
      </div>
      <div class="form-actions" style="justify-content:center">
        <button type="button" class="btn btn-navy" data-ics data-test="ics">Agregar a mi calendario</button>
        <a class="btn btn-wa" data-test="wa-envio" href="${U.esc(U.urlWhatsApp(cita))}" target="_blank" rel="noopener noreferrer">Enviar resumen por WhatsApp</a>
        <a class="btn btn-ghost" href="panel/">Ver en el panel del doctor</a>
      </div>
      <p class="aviso-horarios">El resumen se abre en WhatsApp hacia el número de prueba 505 0000 0000, o al tuyo si activaste «Probar como dueño».</p>
      <p><button type="button" class="btn btn-ghost" data-nueva>Agendar otra cita de muestra</button></p>
    </div>`;
  }

  function wireConfirmacion() {
    const root = $("#agenda-card");
    root.querySelector("[data-ics]")?.addEventListener("click", () => U.descargarIcs(state.cita));
    root.querySelector("[data-ver-recordatorio]")?.addEventListener("click", () => {
      state.notif = true;
      const n = $("#mock-notif");
      if (n) n.classList.add("is-on");
    });
    root.querySelector("[data-nueva]")?.addEventListener("click", () => {
      state.paso = 1; state.servicioId = ""; state.medicoId = ""; state.fecha = ""; state.hora = ""; state.cita = null; state.notif = false;
      renderAgenda();
    });
  }

  function wireAgenda() {
    const root = $("#agenda-card");
    root.querySelectorAll("[data-pick-servicio]").forEach((b) => b.addEventListener("click", () => {
      state.servicioId = b.dataset.pickServicio;
      state.medicoId = ""; state.fecha = ""; state.hora = "";
      const meds = U.medicosDeServicio(state.servicioId);
      if (meds.length === 1) { state.medicoId = meds[0].id; state.paso = 3; }
      else state.paso = 2;
      renderAgenda();
    }));
    root.querySelectorAll("[data-pick-medico]").forEach((b) => b.addEventListener("click", () => {
      state.medicoId = b.dataset.pickMedico;
      state.fecha = ""; state.hora = "";
      state.paso = 3;
      renderAgenda();
    }));
    root.querySelectorAll("[data-pick-fecha]").forEach((b) => b.addEventListener("click", () => {
      state.fecha = b.dataset.pickFecha;
      state.hora = "";
      renderAgenda();
    }));
    root.querySelectorAll("[data-pick-hora]").forEach((b) => b.addEventListener("click", () => {
      state.hora = b.dataset.pickHora;
      state.paso = 4;
      renderAgenda();
    }));
    root.querySelector("[data-back]")?.addEventListener("click", () => {
      if (state.paso === 4) { state.paso = 3; state.hora = ""; }
      else if (state.paso === 3) { state.paso = 2; state.fecha = ""; }
      else if (state.paso === 2) { state.paso = 1; state.medicoId = ""; }
      renderAgenda();
    });
    const form = $("#form-cita");
    if (form) form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const nombre = form.nombre.value.trim();
      const telefono = form.telefono.value.trim();
      const motivo = form.motivo.value.trim();
      const err = $("#cita-err");
      if (nombre.length < 2) { err.textContent = "Escribí tu nombre."; form.nombre.focus(); return; }
      if (telefono.replace(/\D/g, "").length < 8) { err.textContent = "Escribí un teléfono válido."; form.telefono.focus(); return; }
      if (/diagn[oó]stic|resultado|expediente|vih|embarazo|presión|presion|receta/i.test(motivo)) {
        err.textContent = "Por privacidad, no incluyas datos clínicos sensibles. Podés dejar el motivo en blanco o usar una frase breve (por ejemplo, «control»).";
        form.motivo.focus();
        return;
      }
      const med = U.medicoPorId(state.medicoId);
      const slot = U.slots(med, state.fecha).find((s) => s.hora === state.hora);
      if (!slot || slot.ocupado || slot.bloqueado || slot.pasado) {
        err.textContent = "Ese horario ya no está disponible. Elegí otro.";
        state.paso = 3;
        renderAgenda();
        return;
      }
      state.cita = U.crearCita({
        servicioId: state.servicioId,
        medicoId: state.medicoId,
        fecha: state.fecha,
        hora: state.hora,
        nombre, telefono, motivo,
        estado: "pendiente",
        origen: "agenda",
      });
      state.paso = 5;
      renderAgenda();
      $("#agenda-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function irAServicio(id) {
    state.paso = 1;
    state.servicioId = id;
    state.medicoId = ""; state.fecha = ""; state.hora = ""; state.cita = null;
    const meds = U.medicosDeServicio(id);
    if (meds.length === 1) { state.medicoId = meds[0].id; state.paso = 3; }
    else state.paso = 2;
    location.hash = "#citas";
    renderAgenda();
    setTimeout(() => $("#citas")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function menu() {
    const btn = $(".menu-toggle");
    const nav = $("#mobile-nav");
    if (!btn || !nav) return;
    btn.addEventListener("click", () => {
      const open = !nav.classList.contains("is-open");
      nav.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
      nav.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
    }));
  }

  function init() {
    U.seedSiFalta();
    renderServicios();
    renderEquipo();
    renderAgenda();
    menu();
    syncWaLinks();
    window.addEventListener("demo:dueno", syncWaLinks);
    document.addEventListener("click", (ev) => {
      const go = ev.target.closest("[data-go-servicio]");
      if (go) irAServicio(go.dataset.goServicio);
    });
    document.querySelectorAll(".paso").forEach((el) => el.addEventListener("click", () => {
      const n = Number(el.dataset.paso);
      if (n < state.paso && state.paso < 5) { state.paso = n; renderAgenda(); }
    }));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
