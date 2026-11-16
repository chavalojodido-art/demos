(() => {
  "use strict";
  const U = window.UnidadUR;
  let dia = U.ymdEnTZ(U.ahora());
  let bloqueoMedico = "namoyure";

  const $ = (s, r = document) => r.querySelector(s);

  function kpis() {
    const todas = U.citas().filter((c) => c.estado !== "cancelada");
    const deHoy = todas.filter((c) => c.fecha === dia);
    const madrugada = todas.filter((c) => {
      if (c.notaMadrugada) return true;
      if (c.origen === "madrugada") return true;
      if (c.creadaEn) {
        const h = new Date(c.creadaEn);
        if (!isNaN(h)) {
          const hm = U.hmEnTZ(h);
          return U.esMadrugada(hm);
        }
      }
      return false;
    });
    $("#kpi-hoy").textContent = String(deHoy.length);
    $("#kpi-pend").textContent = String(deHoy.filter((c) => c.estado === "pendiente").length);
    $("#kpi-night").textContent = String(madrugada.length);
  }

  function flagMadrugada(c) {
    if (c.notaMadrugada) return c.notaMadrugada;
    if (c.origen === "madrugada") return "Llegó de madrugada, mientras el equipo dormía";
    if (c.creadaEn) {
      const h = new Date(c.creadaEn);
      if (!isNaN(h) && U.esMadrugada(U.hmEnTZ(h))) {
        return `Llegó a las ${U.fmtHora(U.hmEnTZ(h))} mientras dormía`;
      }
    }
    return "";
  }

  function renderLista() {
    const box = $("#lista-citas");
    const list = U.citas()
      .filter((c) => c.fecha === dia)
      .sort((a, b) => a.hora.localeCompare(b.hora) || a.creadaEn.localeCompare(b.creadaEn));
    kpis();
    $("#titulo-dia").textContent = U.fmtFechaLarga(dia);
    if (!list.length) {
      box.innerHTML = `<p class="hint">No hay citas en este día de demostración. Agendá una desde la <a href="../#citas">agenda</a>.</p>`;
      return;
    }
    box.innerHTML = list.map((c) => {
      const serv = U.servicioPorId(c.servicioId);
      const med = U.medicoPorId(c.medicoId);
      const flag = flagMadrugada(c);
      const ej = c.ejemplo ? ` <span class="nota-ejemplo">ejemplo</span>` : "";
      const est = U.ESTADOS[c.estado] || U.ESTADOS.pendiente;
      return `<article class="cita-row ${flag ? "is-night" : ""}" data-id="${U.esc(c.id)}" data-test="cita">
        <div class="row-top">
          <div>
            <strong>${U.esc(U.fmtHora(c.hora))}</strong>
            · ${U.esc(c.codigo)}${ej}
            <div>${U.esc(c.nombre)} · ${U.esc(serv ? serv.nombre : "")}</div>
            <div class="hint">${U.esc(med ? med.nombre : "")}${c.motivo ? " · " + U.esc(c.motivo) : ""}</div>
          </div>
          <span class="estado ${U.esc(c.estado)}">${U.esc(est.label)}</span>
        </div>
        ${flag ? `<div class="night-flag">${U.esc(flag)}</div>` : ""}
        <div class="acciones">
          ${c.estado !== "confirmada" ? `<button type="button" data-estado="confirmada">Marcar confirmada</button>` : ""}
          ${c.estado !== "atendida" ? `<button type="button" data-estado="atendida">Marcar atendida</button>` : ""}
          ${c.estado !== "pendiente" ? `<button type="button" data-estado="pendiente">Volver a pendiente</button>` : ""}
          ${c.estado !== "cancelada" ? `<button type="button" data-estado="cancelada">Cancelar</button>` : ""}
        </div>
      </article>`;
    }).join("");
  }

  function renderBloqueos() {
    const med = U.medicoPorId(bloqueoMedico);
    const sel = $("#bloqueo-medico");
    if (sel && !sel.dataset.ready) {
      sel.innerHTML = U.MEDICOS.map((m) => `<option value="${m.id}">${U.esc(m.nombre)}</option>`).join("");
      sel.value = bloqueoMedico;
      sel.dataset.ready = "1";
    }
    const box = $("#horas-bloqueo");
    if (!med) return;
    const lista = U.slots(med, dia);
    if (!lista.length) {
      box.innerHTML = `<p class="hint">Este profesional no tiene horas de ejemplo en este día.</p>`;
      return;
    }
    box.innerHTML = `<div class="hora-grid">` + lista.map((s) => {
      const cls = s.bloqueado ? "is-on" : (s.ocupado ? "is-busy" : "");
      const label = s.bloqueado ? "Desbloquear" : (s.ocupado ? "Ocupada" : "Bloquear");
      return `<button type="button" class="hora ${cls}" data-bloquear="${s.hora}" ${s.ocupado && !s.bloqueado ? "disabled" : ""}>${s.etiqueta}<span class="mini">${label}</span></button>`;
    }).join("") + `</div>
    <p class="hint">Los bloqueos quedan solo en este navegador y se ocultan en la agenda del paciente.</p>`;
  }

  function init() {
    U.seedSiFalta();
    const input = $("#filtro-dia");
    if (input) {
      input.value = dia;
      input.addEventListener("change", () => {
        dia = input.value || U.ymdEnTZ(U.ahora());
        renderLista();
        renderBloqueos();
      });
    }
    $("#lista-citas")?.addEventListener("click", (ev) => {
      const btn = ev.target.closest("[data-estado]");
      const row = ev.target.closest("[data-id]");
      if (!btn || !row) return;
      U.actualizarCita(row.dataset.id, { estado: btn.dataset.estado });
      renderLista();
    });
    $("#bloqueo-medico")?.addEventListener("change", (ev) => {
      bloqueoMedico = ev.target.value;
      renderBloqueos();
    });
    $("#horas-bloqueo")?.addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-bloquear]");
      if (!b) return;
      U.toggleBloqueo(dia, b.dataset.bloquear, bloqueoMedico);
      renderBloqueos();
    });
    renderLista();
    renderBloqueos();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
