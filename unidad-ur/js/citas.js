/* Lógica compartida de la agenda (index y panel). Todo vive en este navegador. */
(() => {
  "use strict";

  const TZ = "America/Managua";
  const KEY_CITAS = "unidad-ur:citas";
  const KEY_BLOQUEOS = "unidad-ur:bloqueos";
  const KEY_SEED = "unidad-ur:seed-v1";
  const WA_PRUEBA = "50500000000";

  const SERVICIOS = [
    {
      id: "metabolico",
      nombre: "Control metabólico y enfermedades crónicas",
      grupo: "Atención médica",
      texto: "Valoración y seguimiento de enfermedades crónicas y sus complicaciones, con enfoque multidisciplinario.",
      medicos: ["namoyure"],
    },
    {
      id: "ultrasonido",
      nombre: "Ultrasonido clínico",
      grupo: "Diagnóstico por imágenes",
      texto: "Ecografía clínica y de urgencias, con ultrasonido en el punto de atención (POCUS).",
      medicos: ["namoyure"],
    },
    {
      id: "ginecologia",
      nombre: "Ginecología",
      grupo: "Salud femenina",
      texto: "Consulta integral, toma de PAP, termocoagulación, ultrasonido obstétrico y de mamas, y procedimientos sujetos a valoración.",
      medicos: ["zavala"],
    },
    {
      id: "urologia",
      nombre: "Urología",
      grupo: "Consulta especializada",
      texto: "Valoración urológica especializada. Las jornadas reales del especialista se confirman con el centro.",
      medicos: ["cruz"],
    },
    {
      id: "neurodesarrollo",
      nombre: "Estimulación infantil y neurodesarrollo",
      grupo: "Desarrollo integral",
      texto: "Estimulación temprana e infantil, acompañamiento a personas con autismo e intervención en condiciones del neurodesarrollo.",
      medicos: ["miranda"],
    },
    {
      id: "lenguaje",
      nombre: "Lenguaje y acompañamiento familiar",
      grupo: "Psicología y comunicación",
      texto: "Abordaje de dificultades del lenguaje y la comunicación, con orientación a familias y cuidadores.",
      medicos: ["miranda"],
    },
    {
      id: "laboratorio",
      nombre: "Laboratorio clínico",
      grupo: "Apoyo diagnóstico",
      texto: "Servicio de laboratorio clínico. En esta muestra podés reservar un cupo de ejemplo para toma de muestra.",
      medicos: ["laboratorio"],
    },
    {
      id: "farmacia",
      nombre: "Farmacia",
      grupo: "Cuidado continuo",
      texto: "Consulta de disponibilidad de surtido. Esta reserva de ejemplo es un turno breve de orientación, no una receta.",
      medicos: ["farmacia"],
    },
    {
      id: "estetica",
      nombre: "Medicina estética",
      grupo: "Valoración personalizada",
      texto: "Consulta de valoración para tratamientos estéticos. La indicación se determina de forma individual y no se reserva un procedimiento en esta agenda.",
      medicos: ["zavala", "namoyure"],
    },
  ];

  const MEDICOS = [
    {
      id: "namoyure",
      nombre: "Dr. Héctor Namoyure",
      rol: "Atención médica · Ultrasonido clínico",
      tipo: "planta",
      tipoEtiqueta: "Equipo de planta",
      foto: "assets/photos/doctor-namoyure.webp",
      agenda: "planta24",
      bio: "Evaluación médica y ultrasonido clínico como apoyo al diagnóstico y a la orientación de la atención.",
    },
    {
      id: "miranda",
      nombre: "Lic. Sarahí Miranda",
      rol: "Estimulación infantil · Lenguaje y neurodesarrollo",
      tipo: "planta",
      tipoEtiqueta: "Equipo de planta",
      foto: "assets/photos/lic-sarahi-miranda.webp",
      agenda: "diurna",
      bio: "Atención a niños y adultos, acompañamiento en autismo, dificultades del lenguaje y orientación a familias.",
    },
    {
      id: "cruz",
      nombre: "Dr. Alner Cruz",
      rol: "Urología",
      tipo: "jornada",
      tipoEtiqueta: "Especialista de jornada",
      foto: "",
      iniciales: "AC",
      agenda: "jornadaSabado",
      bio: "Valoración urológica y cirugía mínimamente invasiva. Participa en las jornadas anunciadas por el centro. Las fechas reales están por confirmar.",
    },
    {
      id: "lopez",
      nombre: "Dr. Lenin López",
      rol: "Cardiología clínica",
      tipo: "jornada",
      tipoEtiqueta: "Especialista de jornada",
      foto: "assets/photos/dr-lenin-lopez.webp",
      agenda: "jornadaSabado",
      bio: "Valoración y chequeo cardíaco en jornadas anunciadas por el centro. Las fechas reales están por confirmar.",
    },
    {
      id: "zavala",
      nombre: "Dra. Ximell Zavala",
      rol: "Ginecología",
      tipo: "jornada",
      tipoEtiqueta: "Especialista de jornada",
      foto: "assets/photos/dra-ximell-zavala.webp",
      agenda: "jornadaSabado",
      bio: "Evaluación ginecológica, colposcopia y procedimientos sujetos a valoración individual. Las fechas reales de jornada están por confirmar.",
    },
    {
      id: "laboratorio",
      nombre: "Equipo de laboratorio",
      rol: "Toma de muestras (ejemplo)",
      tipo: "apoyo",
      tipoEtiqueta: "Servicio del centro",
      foto: "",
      iniciales: "LB",
      agenda: "diurna",
      bio: "Cupo de ejemplo para laboratorio clínico. El profesional se confirma en el centro.",
    },
    {
      id: "farmacia",
      nombre: "Farmacia del centro",
      rol: "Orientación y surtido (ejemplo)",
      tipo: "apoyo",
      tipoEtiqueta: "Servicio del centro",
      foto: "",
      iniciales: "FM",
      agenda: "diurna",
      bio: "Turno breve de ejemplo para consultar disponibilidad. No sustituye una receta médica.",
    },
  ];

  const ESTADOS = {
    pendiente: { label: "Pendiente", tono: "amber" },
    confirmada: { label: "Confirmada", tono: "blue" },
    atendida: { label: "Atendida", tono: "green" },
    cancelada: { label: "Cancelada", tono: "stone" },
  };

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[c]);
  }

  function ahora() {
    return new Date();
  }

  function ymdEnTZ(date, tz = TZ) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(date);
    const g = (t) => parts.find((p) => p.type === t).value;
    return `${g("year")}-${g("month")}-${g("day")}`;
  }

  function hmEnTZ(date, tz = TZ) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(date);
    const g = (t) => parts.find((p) => p.type === t).value;
    return `${g("hour")}:${g("minute")}`;
  }

  function parseYmd(ymd) {
    const [y, m, d] = ymd.split("-").map(Number);
    // noon UTC-6 construction: use a date that is unambiguously that calendar day in Managua
    return new Date(Date.UTC(y, m - 1, d, 18, 0, 0)); // 12:00 in Managua (UTC-6)
  }

  function weekdayISO(ymd) {
    // 1=Mon ... 7=Sun, in TZ
    const d = parseYmd(ymd);
    const wd = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" }).format(d);
    return { Sun: 7, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[wd];
  }

  function fmtFechaLarga(ymd) {
    const d = parseYmd(ymd);
    const txt = new Intl.DateTimeFormat("es-NI", {
      timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric",
    }).format(d);
    return txt.charAt(0).toUpperCase() + txt.slice(1);
  }

  function fmtFechaCorta(ymd) {
    const d = parseYmd(ymd);
    return new Intl.DateTimeFormat("es-NI", {
      timeZone: TZ, weekday: "short", day: "numeric", month: "short",
    }).format(d);
  }

  function fmtHora(hm) {
    const [h, m] = hm.split(":").map(Number);
    const ampm = h < 12 ? "a.m." : "p.m.";
    let hh = h % 12;
    if (hh === 0) hh = 12;
    return `${hh}:${String(m).padStart(2, "0")} ${ampm}`;
  }

  function esMadrugada(hm) {
    const h = Number(hm.split(":")[0]);
    return h >= 0 && h < 6;
  }

  function tramo(hm) {
    const h = Number(hm.split(":")[0]);
    if (h < 6) return "madrugada";
    if (h < 12) return "manana";
    if (h < 18) return "tarde";
    return "noche";
  }

  function leer(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }
  function escribir(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }

  function citas() { return leer(KEY_CITAS, []); }
  function guardarCitas(list) { escribir(KEY_CITAS, list); }
  function bloqueos() { return leer(KEY_BLOQUEOS, []); }
  function guardarBloqueos(list) { escribir(KEY_BLOQUEOS, list); }

  function medicoPorId(id) { return MEDICOS.find((m) => m.id === id); }
  function servicioPorId(id) { return SERVICIOS.find((s) => s.id === id); }

  function medicosDeServicio(servicioId) {
    const s = servicioPorId(servicioId);
    if (!s) return [];
    return s.medicos.map(medicoPorId).filter(Boolean);
  }

  function horasBase(medico, ymd) {
    const agenda = (medico && medico.agenda) || "diurna";
    const wd = weekdayISO(ymd);
    const push = (list, from, to, step = 60) => {
      for (let min = from; min < to; min += step) {
        const h = Math.floor(min / 60);
        const m = min % 60;
        list.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      }
    };
    const out = [];
    if (agenda === "planta24") {
      // Horario de ejemplo 24/7, cada hora en punto
      push(out, 0, 24 * 60, 60);
      return out;
    }
    if (agenda === "diurna") {
      if (wd === 7) return []; // domingo: sin cupos de ejemplo
      push(out, 8 * 60, 16 * 60, 60);
      return out;
    }
    if (agenda === "jornadaSabado") {
      // Solo sábados, como jornada de EJEMPLO (las fechas reales están por confirmar)
      if (wd !== 6) return [];
      push(out, 8 * 60, 13 * 60, 60);
      return out;
    }
    return out;
  }

  function ocupado(ymd, hm, medicoId) {
    return citas().some((c) =>
      c.fecha === ymd && c.hora === hm && c.medicoId === medicoId && c.estado !== "cancelada"
    );
  }

  function bloqueado(ymd, hm, medicoId) {
    return bloqueos().some((b) => b.fecha === ymd && b.hora === hm && (!b.medicoId || b.medicoId === medicoId));
  }

  function esPasado(ymd, hm) {
    const hoy = ymdEnTZ(ahora());
    if (ymd < hoy) return true;
    if (ymd > hoy) return false;
    return hm <= hmEnTZ(ahora());
  }

  function slots(medico, ymd) {
    return horasBase(medico, ymd).map((hm) => ({
      hora: hm,
      etiqueta: fmtHora(hm),
      tramo: tramo(hm),
      madrugada: esMadrugada(hm),
      ocupado: ocupado(ymd, hm, medico.id),
      bloqueado: bloqueado(ymd, hm, medico.id),
      pasado: esPasado(ymd, hm),
    }));
  }

  function diasDisponibles(medico, n = 14) {
    const hoy = ymdEnTZ(ahora());
    const [y, m, d] = hoy.split("-").map(Number);
    const out = [];
    for (let i = 0; i < n; i++) {
      const dt = new Date(Date.UTC(y, m - 1, d + i, 18, 0, 0));
      const ymd = ymdEnTZ(dt);
      const lista = slots(medico, ymd);
      const libres = lista.filter((s) => !s.ocupado && !s.bloqueado && !s.pasado).length;
      out.push({
        fecha: ymd,
        etiqueta: fmtFechaCorta(ymd),
        larga: fmtFechaLarga(ymd),
        weekday: weekdayISO(ymd),
        libres,
        esJornadaEjemplo: medico.agenda === "jornadaSabado" && weekdayISO(ymd) === 6,
      });
    }
    return out;
  }

  function codigoNuevo() {
    const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const usados = new Set(citas().map((c) => c.codigo));
    for (let i = 0; i < 50; i++) {
      let s = "UR-";
      for (let j = 0; j < 4; j++) s += abc[Math.floor(Math.random() * abc.length)];
      if (!usados.has(s)) return s;
    }
    return "UR-" + String(Date.now()).slice(-4);
  }

  function crearCita(datos) {
    const cita = {
      id: "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      codigo: datos.codigo || codigoNuevo(),
      servicioId: datos.servicioId,
      medicoId: datos.medicoId,
      fecha: datos.fecha,
      hora: datos.hora,
      nombre: (datos.nombre || "").trim(),
      telefono: (datos.telefono || "").trim(),
      motivo: (datos.motivo || "").trim(),
      estado: datos.estado || "pendiente",
      ejemplo: !!datos.ejemplo,
      creadaEn: datos.creadaEn || new Date().toISOString(),
      origen: datos.origen || "agenda",
    };
    const list = citas();
    list.push(cita);
    guardarCitas(list);
    return cita;
  }

  function actualizarCita(id, patch) {
    const list = citas().map((c) => (c.id === id ? { ...c, ...patch } : c));
    guardarCitas(list);
    return list.find((c) => c.id === id);
  }

  function toggleBloqueo(fecha, hora, medicoId) {
    const list = bloqueos();
    const i = list.findIndex((b) => b.fecha === fecha && b.hora === hora && (b.medicoId || "") === (medicoId || ""));
    if (i >= 0) list.splice(i, 1);
    else list.push({ fecha, hora, medicoId: medicoId || "", en: new Date().toISOString() });
    guardarBloqueos(list);
    return list;
  }

  function seedSiFalta() {
    if (leer(KEY_SEED, null)) return;
    const hoy = ymdEnTZ(ahora());
    const muestras = [
      {
        codigo: "UR-EJ01",
        servicioId: "ultrasonido",
        medicoId: "namoyure",
        fecha: hoy,
        hora: "02:00",
        nombre: "María E. (ejemplo)",
        telefono: "8888-0001",
        motivo: "Consulta de ejemplo",
        estado: "pendiente",
        ejemplo: true,
        creadaEn: `${hoy}T02:14:00-06:00`,
        origen: "madrugada",
        notaMadrugada: "Llegó a las 2:14 a.m. mientras dormía",
      },
      {
        codigo: "UR-EJ02",
        servicioId: "metabolico",
        medicoId: "namoyure",
        fecha: hoy,
        hora: "09:00",
        nombre: "Luis A. (ejemplo)",
        telefono: "8888-0002",
        motivo: "",
        estado: "confirmada",
        ejemplo: true,
        creadaEn: `${hoy}T07:10:00-06:00`,
        origen: "seed",
      },
      {
        codigo: "UR-EJ03",
        servicioId: "neurodesarrollo",
        medicoId: "miranda",
        fecha: hoy,
        hora: "11:00",
        nombre: "Ana P. (ejemplo)",
        telefono: "8888-0003",
        motivo: "Primera visita de ejemplo",
        estado: "atendida",
        ejemplo: true,
        creadaEn: `${hoy}T08:40:00-06:00`,
        origen: "seed",
      },
    ];
    // Un cupo de jornada de ejemplo el próximo sábado, si cae en la ventana
    const sab = diasDisponibles(medicoPorId("cruz"), 14).find((d) => d.esJornadaEjemplo);
    if (sab) {
      muestras.push({
        codigo: "UR-EJ04",
        servicioId: "urologia",
        medicoId: "cruz",
        fecha: sab.fecha,
        hora: "09:00",
        nombre: "Carlos R. (ejemplo)",
        telefono: "8888-0004",
        motivo: "",
        estado: "confirmada",
        ejemplo: true,
        creadaEn: new Date().toISOString(),
        origen: "seed",
      });
    }
    const list = citas();
    for (const m of muestras) {
      if (!list.some((c) => c.codigo === m.codigo)) list.push({ id: "seed-" + m.codigo, ...m });
    }
    guardarCitas(list);
    escribir(KEY_SEED, { en: new Date().toISOString() });
  }

  function numeroWhatsApp() {
    if (window.DemoExtras && typeof DemoExtras.numero === "function") {
      return DemoExtras.numero(WA_PRUEBA) || WA_PRUEBA;
    }
    return WA_PRUEBA;
  }

  function mensajeWhatsApp(cita) {
    const serv = servicioPorId(cita.servicioId);
    const med = medicoPorId(cita.medicoId);
    const lineas = [
      "Unidad de Diagnóstico UR · Medical Center",
      "CITA DE PRUEBA (versión de muestra)",
      `Código: ${cita.codigo}`,
      `Servicio: ${serv ? serv.nombre : cita.servicioId}`,
      `Profesional: ${med ? med.nombre : cita.medicoId}`,
      `Fecha: ${fmtFechaLarga(cita.fecha)}`,
      `Hora: ${fmtHora(cita.hora)} (horario de ejemplo)`,
      `Nombre: ${cita.nombre}`,
      `Teléfono: ${cita.telefono}`,
    ];
    if (cita.motivo) lineas.push(`Motivo (opcional): ${cita.motivo}`);
    lineas.push("—");
    lineas.push("Los horarios de esta demostración son de ejemplo. Esta reserva no es una cita clínica real ni sustituye una valoración médica.");
    return lineas.join("\n");
  }

  function urlWhatsApp(cita) {
    return `https://wa.me/${numeroWhatsApp()}?text=${encodeURIComponent(mensajeWhatsApp(cita))}`;
  }

  function icsDeCita(cita) {
    const serv = servicioPorId(cita.servicioId);
    const med = medicoPorId(cita.medicoId);
    const [y, mo, d] = cita.fecha.split("-").map(Number);
    const [hh, mm] = cita.hora.split(":").map(Number);
    // America/Managua is UTC-6 year-round (no DST)
    const startUTC = new Date(Date.UTC(y, mo - 1, d, hh + 6, mm, 0));
    const endUTC = new Date(startUTC.getTime() + 30 * 60 * 1000);
    const stamp = (dt) => dt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    const uid = `${cita.codigo}@unidad-ur-demo`;
    const desc = [
      `Código ${cita.codigo}`,
      med ? med.nombre : "",
      "Horario de ejemplo. Versión de muestra, no es una cita clínica real.",
      "Unidad de Diagnóstico UR · Medical Center, Río Blanco.",
    ].filter(Boolean).join("\\n");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Unidad UR Demo//ES",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(startUTC)}`,
      `DTEND:${stamp(endUTC)}`,
      `SUMMARY:${(serv ? serv.nombre : "Cita")} — ${cita.codigo}`,
      `DESCRIPTION:${desc}`,
      "LOCATION:Frente al CDC, Río Blanco, Matagalpa, Nicaragua",
      "END:VEVENT",
      "END:VCALENDAR",
      "",
    ].join("\r\n");
    return ics;
  }

  function descargarIcs(cita) {
    const blob = new Blob([icsDeCita(cita)], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${cita.codigo}.ics`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    return a.download;
  }

  function asset(path) {
    if (location.pathname.indexOf("/panel") !== -1 && path.startsWith("assets/")) {
      return "../" + path;
    }
    return path;
  }

  window.UnidadUR = {
    TZ, WA_PRUEBA, SERVICIOS, MEDICOS, ESTADOS,
    esc, ahora, ymdEnTZ, hmEnTZ, fmtFechaLarga, fmtFechaCorta, fmtHora,
    esMadrugada, tramo, weekdayISO,
    medicoPorId, servicioPorId, medicosDeServicio,
    slots, diasDisponibles, ocupado, bloqueado, esPasado,
    citas, crearCita, actualizarCita, toggleBloqueo, bloqueos, seedSiFalta,
    codigoNuevo, numeroWhatsApp, mensajeWhatsApp, urlWhatsApp,
    icsDeCita, descargarIcs, asset,
  };
})();
