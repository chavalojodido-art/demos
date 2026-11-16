/* Eco-Lodge Cascada Blanca — demo site */
const WA_NUMBER = "50558469876";
const HERO_VIDEO_ENABLED = true;
const HERO_VIDEO = {
  desktop: { mp4: "media/hero.mp4", webm: "media/hero.webm" },
  mobile: { mp4: "media/hero-mobile.mp4", webm: "media/hero-mobile.webm" }
};

const I18N = {
  es: {
    langName: "Español",
    docTitle: "Eco-Lodge Cascada Blanca — San Ramón, Matagalpa (demo)",
    navExperiencias: "Experiencias",
    navGaleria: "Galería",
    navHospedaje: "Hospedaje",
    navLlegar: "Cómo llegar",
    navReservas: "Reservar",
    ctaReservar: "Reservar",
    heroKicker: "Matagalpa, Nicaragua",
    heroTitle: "El único lugar en Nicaragua donde puedes caminar debajo de un río",
    heroLead: "Cascada de 17 metros, cueva, senderos y un eco-lodge junto al agua, a 17 km de Matagalpa.",
    ctaVer: "Ver el lugar",
    award: "Premio Nacional Güegüense a la Excelencia Turística · CANATUR, Innovación Turística, 2018.",
    expKicker: "Qué ofrecemos",
    expTitle: "Una reserva para quedarse el día o dormir con el sonido del agua",
    expLead: "Todo se reserva o se confirma por WhatsApp. Los precios se consultan; no los publicamos aquí porque varían y hay que confirmarlos con el lodge.",
    e1t: "Caminar debajo del río", e1p: "El salto de 17 metros y la cueva detrás de la caída. El lema del lugar no es un eslogan: se camina bajo el agua.",
    e2t: "Senderos", e2p: "Caminos como el Sendero del Amor, entre sombra y piedra, hacia la poza y los miradores.",
    e3t: "Cueva y camping", e3p: "La cueva junto a la cascada es el rincón más buscado para acampar. Reserva el espacio y, si lo necesitas, el equipo.",
    e4t: "Tours de café y chocolate", e4p: "Recorridos en la reserva y la zona cafetalera. Horarios y contenido se confirman al reservar.",
    e5t: "Kayak y rappel", e5p: "Kayak en temporada y rappel en verano, según el caudal y el clima. Consulta disponibilidad.",
    e6t: "Camión desde Matagalpa", e6p: "Transporte de ida y vuelta desde la ciudad. Cupo, punto de salida y horario se confirman por WhatsApp.",
    consultar: "Consultar por WhatsApp",
    galKicker: "Galería", galTitle: "El agua, la cueva y la montaña", galLead: "Fotos reales del lugar, mejoradas solo en luz y nitidez, tomadas de su ficha de TripAdvisor, de prensa nicaragüense y de un reportaje de visita.",
    capCascada: "La cascada y la cueva, vistas desde el mirador Yasica",
    capBajo: "Caminar detrás de la caída",
    capCueva: "Desde dentro de la cueva",
    capSenderos: "Senderos del Amor",
    capLodge: "El lodge junto a la cascada",
    capEntrada: "Entrada del Eco-Lodge Cascada Blanca",
    capCamion: "El camión del lodge, en Matagalpa",
    capPlato: "Cocina del restaurante",
    hosKicker: "Hospedaje", hosTitle: "Cinco habitaciones y camping en la cueva",
    hosLead: "Es un eco-lodge rústico, no un hotel urbano. Las habitaciones son sencillas; lo que se oye de noche es el agua. Si te quedas a dormir, reserva también la cena: el servicio de restaurante cierra alrededor de las 17:00.",
    hosH3: "Habitaciones",
    hosP: "TripAdvisor registra 5 habitaciones. Hay también una habitación familiar, anunciada por el lodge. Lo que incluye cada una (comidas, ventilador, agua caliente) se confirma al reservar.",
    hosC3: "Camping",
    hosC: "Se puede acampar en la cueva, junto a la cascada. Pregunta si necesitan carpa o colchoneta.",
    resTitle: "Restaurante y café",
    resP: "Hay un café en la entrada y un restaurante más abajo, con vista a la cascada. Cocina nicaragüense e italiana, según han contado visitantes y la prensa. Carta y horarios de cocina: consultar por WhatsApp.",
    llKicker: "Cómo llegar", llTitle: "Kilómetro 147, carretera Matagalpa–El Tuma–La Dalia",
    llP: "Está al borde de la carretera, en la comunidad Santa Emilia, a unos 17 km (cerca de 30 minutos) al norte de Matagalpa. El bus a La Dalia para enfrente: pídele al conductor “Cascada Blanca”.",
    liBus: "Bus público desde la terminal norte de Matagalpa, rumbo a La Dalia.",
    liCamion: "Camión del lodge, con salida desde Matagalpa: reserva por WhatsApp.",
    liAuto: "Vehículo propio o taxi. Hay parqueo en la entrada.",
    horasTitle: "Horarios",
    horasP: "El horario más repetido para la visita de día es de 9:00 a 17:00. Los fines de semana suele abrir un poco más temprano (hacia las 8:00 u 8:30). En feriados el lodge lo anuncia en Facebook. Confirma el día que vas, sobre todo si llegas tarde o te hospedas.",
    mapTitle: "Mapa",
    qKicker: "Antes de ir", qTitle: "Preguntas frecuentes",
    f1q: "¿Qué debo llevar?", f1a: "Calzado con agarre (las piedras y las gradas se mojan), agua, repelente, una muda si vas a caminar detrás de la cascada — te vas a humedecer — y un impermeable ligero en época de lluvias.",
    f2q: "¿Cómo es el clima?", f2a: "Es zona de montaña: fresco, húmedo y verde. De mayo a noviembre llueve más y el caudal baja más fuerte; de diciembre a abril hay menos lluvia, pero el salto puede verse más delgado al final de la seca.",
    f3q: "¿Hay insectos? ¿Qué ropa llevar?", f3a: "Es un lodge rústico en el bosque. Lleva ropa cómoda de manga, repelente y calcetines. En las habitaciones conviene usar el mosquitero si lo hay. No es un hotel de ciudad.",
    f4q: "¿A qué hora atiende el personal si me quedo a dormir?", f4a: "El restaurante y la atención de day pass cierran alrededor de las 17:00. Varios huéspedes han contado que después solo queda vigilancia. Si te hospedas, pide la cena y el desayuno con anticipación.",
    f5q: "¿Se puede nadar?", f5a: "Hay que respetar las indicaciones del personal. La poza es profunda y el dueño ha advertido que hay remolino. Cerca de la caída el agua puede ser peligrosa. Pregunta al llegar qué zonas están habilitadas ese día.",
    f6q: "¿Cuánto cuesta la entrada, el hospedaje o el camión?", f6a: "Consulta por WhatsApp. Hay cifras distintas en internet y no las damos aquí para no desinformar. El lodge te confirma el precio vigente.",
    tKicker: "Lo que dicen quienes ya fueron", tTitle: "Testimonios",
    tNote: "Citas textuales de reseñas públicas. No son testimonios pagados.",
    t1: "“This place is special, very special. Need an escape for the hustle and bustle, plan an evening or three at Cascada Blanca… A special thank you to Don Victor who received me as if I were a long lost friend.”",
    t1c: "Corinne Cahuzac, TripAdvisor, diciembre de 2019",
    t2: "“The owner has created this with passion and it shows. You may get to the cave behind the waterfall which is quite large. Plan to spend some time — here there is no rush.”",
    t2c: "CLOSEBY, Matagalpa, TripAdvisor, enero de 2020",
    t3: "“Just tell the bus driver you're going to Cascada Blanca and they stop right in front… Would highly recommend.”",
    t3c: "janellef186, TripAdvisor, reseña de julio de 2016 (estadía en junio de 2016)",
    t4: "“A beautiful place, located just 18 km from the city of Matagalpa, can make you feel happy and forget stress immediately… Which you can pass under it and feel the breeze of the water that regenerates you.”",
    t4c: "Sightsee644725, TripAdvisor, febrero de 2024",
    rKicker: "Reservas", rTitle: "Escríbenos por WhatsApp, con todo en orden",
    rLead: "El formulario arma un mensaje claro, con un código de solicitud, y lo abre en el WhatsApp del lodge: +505 5846 9876. No se envía solo: tú lo revisas y lo mandas.",
    lTipo: "Tipo de reserva", lFecha: "Fecha", lPersonas: "Número de personas", lNombre: "Tu nombre", lIdioma: "Idioma de atención", lNotas: "Comentarios (opcional)",
    optTipo: "Elige una opción",
    optEntrada: "Entrada / day pass",
    optHab: "Habitación",
    optCamp: "Camping",
    optTour: "Tour de café y chocolate",
    optKayak: "Kayak",
    optCamion: "Camión desde Matagalpa",
    optEs: "Español", optEn: "English",
    submit: "Abrir WhatsApp",
    rHint: "Al pulsar, se abre WhatsApp con el mensaje listo. Si no se abre, usa el botón verde de la esquina.",
    ok: "Mensaje listo. Código de esta solicitud:",
    footerDir: "Km 147, carretera Matagalpa–El Tuma–La Dalia, comunidad Santa Emilia, Matagalpa, Nicaragua.",
    footerDemo: "Versión de muestra / Demo · Propuesta no oficial · Esta página no está indexada.",
    waLabel: "Escribir por WhatsApp",
    waFloat: "Hola, quiero consultar una visita a Eco-Lodge Cascada Blanca.",
    required: "Por favor completa el tipo de reserva, la fecha, el número de personas y tu nombre."
  },
  en: {
    langName: "English",
    docTitle: "Eco-Lodge Cascada Blanca — San Ramón, Matagalpa (demo)",
    navExperiencias: "Experiences",
    navGaleria: "Gallery",
    navHospedaje: "Stay",
    navLlegar: "Getting here",
    navReservas: "Book",
    ctaReservar: "Book",
    heroKicker: "Matagalpa, Nicaragua",
    heroTitle: "The only place in Nicaragua where you can walk beneath a river",
    heroLead: "A 17-metre waterfall, a cave, forest trails and a small eco-lodge by the water, 17 km from Matagalpa.",
    ctaVer: "See the grounds",
    award: "National Güegüense Award for Tourism Excellence · CANATUR, Tourism Innovation, 2018.",
    expKicker: "What we offer",
    expTitle: "A reserve for a day visit — or a night with the sound of the falls",
    expLead: "Everything is booked or confirmed on WhatsApp. We do not publish prices here: figures online disagree, and the lodge should confirm the current rate.",
    e1t: "Walk beneath the river", e1p: "The 17-metre fall and the cave behind it. The motto is literal: you can walk under the water.",
    e2t: "Trails", e2p: "Paths such as the Sendero del Amor, in shade and stone, down to the pool and lookouts.",
    e3t: "Cave and camping", e3p: "The cave beside the fall is the most sought-after place to camp. Book the spot — and gear, if you need it.",
    e4t: "Coffee and chocolate tours", e4p: "Walks on the reserve and in coffee country. Times and details are confirmed when you book.",
    e5t: "Kayaking and rappelling", e5p: "Kayaks in season and rappelling in the dry months, depending on the flow. Ask about availability.",
    e6t: "Shuttle from Matagalpa", e6p: "Round-trip transport from town. Seats, pick-up point and time are confirmed on WhatsApp.",
    consultar: "Ask on WhatsApp",
    galKicker: "Gallery", galTitle: "Water, cave and mountain", galLead: "Real photographs of the place, improved only in light and sharpness, from their Tripadvisor listing, Nicaraguan press, and a visitor feature.",
    capCascada: "The fall and cave from the Yasica lookout",
    capBajo: "Walking behind the curtain of water",
    capCueva: "From inside the cave",
    capSenderos: "Senderos del Amor",
    capLodge: "The lodge beside the waterfall",
    capEntrada: "Entrance to Eco-Lodge Cascada Blanca",
    capCamion: "The lodge shuttle, in Matagalpa",
    capPlato: "Food from the restaurant",
    hosKicker: "Stay", hosTitle: "Five rooms and camping in the cave",
    hosLead: "This is a rustic eco-lodge, not a city hotel. Rooms are simple; at night you hear the water. If you sleep here, book dinner too: restaurant service winds down around 5 p.m.",
    hosH3: "Rooms",
    hosP: "Tripadvisor lists 5 rooms. The lodge has also advertised a family room. What each stay includes (meals, fan, hot water) is confirmed when you book.",
    hosC3: "Camping",
    hosC: "You can camp in the cave, next to the fall. Ask whether you need a tent or mat.",
    resTitle: "Restaurant and café",
    resP: "There is a café at the entrance and a restaurant lower down, with a view of the fall. Guests and the press mention Nicaraguan and Italian cooking. The menu and kitchen hours: ask on WhatsApp.",
    llKicker: "Getting here", llTitle: "Kilometre 147, Matagalpa–El Tuma–La Dalia road",
    llP: "It sits right on the highway, in the community of Santa Emilia, about 17 km (roughly 30 minutes) north of Matagalpa. The bus to La Dalia stops in front — tell the driver “Cascada Blanca”.",
    liBus: "Public bus from Matagalpa’s northern terminal, toward La Dalia.",
    liCamion: "The lodge shuttle from Matagalpa: book on WhatsApp.",
    liAuto: "Your own car or a taxi. There is parking at the entrance.",
    horasTitle: "Hours",
    horasP: "The most commonly published day-visit hours are 9:00 a.m. to 5:00 p.m. Weekends often open a little earlier (around 8:00 or 8:30). Holiday hours are posted on Facebook. Please confirm the day you come, especially if you arrive late or stay overnight.",
    mapTitle: "Map",
    qKicker: "Before you go", qTitle: "Frequently asked questions",
    f1q: "What should I bring?", f1a: "Shoes with grip (stone steps get wet), water, insect repellent, a change of clothes if you walk behind the fall — you will get damp — and a light rain layer in the wet season.",
    f2q: "What is the weather like?", f2a: "This is mountain country: cool, humid and green. May to November is wetter and the fall runs harder; December to April is drier, and the curtain can look thinner by late dry season.",
    f3q: "Are there insects? What should I wear?", f3a: "It is a rustic lodge in the forest. Pack comfortable long sleeves, repellent and socks. Use a mosquito net in the room if one is provided. This is not a city hotel.",
    f4q: "What time does staff stay if I sleep there?", f4a: "The restaurant and day-pass desk wind down around 5 p.m. Overnight guests have written that only a guard remains after that. If you stay, order dinner and breakfast in advance.",
    f5q: "Can I swim?", f5a: "Follow the staff’s instructions. The pool is deep, and the owner has warned of a whirlpool. Water near the fall can be dangerous. Ask on arrival which areas are open that day.",
    f6q: "How much is entry, lodging or the shuttle?", f6a: "Please ask on WhatsApp. Figures online disagree, so we do not list prices here. The lodge will confirm the current rate.",
    tKicker: "From people who have been", tTitle: "Reviews",
    tNote: "Verbatim quotes from public reviews. These are not paid testimonials.",
    t1: "“This place is special, very special. Need an escape for the hustle and bustle, plan an evening or three at Cascada Blanca… A special thank you to Don Victor who received me as if I were a long lost friend.”",
    t1c: "Corinne Cahuzac, Tripadvisor, December 2019",
    t2: "“The owner has created this with passion and it shows. You may get to the cave behind the waterfall which is quite large. Plan to spend some time — here there is no rush.”",
    t2c: "CLOSEBY, Matagalpa, Tripadvisor, January 2020",
    t3: "“Just tell the bus driver you're going to Cascada Blanca and they stop right in front… Would highly recommend.”",
    t3c: "janellef186, Tripadvisor, review July 2016 (stay June 2016)",
    t4: "“A beautiful place, located just 18 km from the city of Matagalpa, can make you feel happy and forget stress immediately… Which you can pass under it and feel the breeze of the water that regenerates you.”",
    t4c: "Sightsee644725, Tripadvisor, February 2024",
    rKicker: "Booking", rTitle: "Write on WhatsApp, with everything in order",
    rLead: "This form builds a clear message, with a request code, and opens it in the lodge’s WhatsApp: +505 5846 9876. Nothing is sent by itself — you review it and send it.",
    lTipo: "Type of booking", lFecha: "Date", lPersonas: "Number of people", lNombre: "Your name", lIdioma: "Preferred language", lNotas: "Comments (optional)",
    optTipo: "Choose one",
    optEntrada: "Day pass / entry",
    optHab: "Room",
    optCamp: "Camping",
    optTour: "Coffee and chocolate tour",
    optKayak: "Kayaking",
    optCamion: "Shuttle from Matagalpa",
    optEs: "Spanish", optEn: "English",
    submit: "Open WhatsApp",
    rHint: "This opens WhatsApp with the message ready. If it does not open, use the green button in the corner.",
    ok: "Message ready. Request code:",
    footerDir: "Km 147, Matagalpa–El Tuma–La Dalia road, Santa Emilia, Matagalpa, Nicaragua.",
    footerDemo: "Sample version / Demo · Unofficial proposal · This page is not indexed.",
    waLabel: "Message on WhatsApp",
    waFloat: "Hello, I would like to ask about a visit to Eco-Lodge Cascada Blanca.",
    required: "Please fill in the booking type, date, number of people and your name."
  }
};

const TYPES = {
  entrada: { es: "Entrada / day pass", en: "Day pass / entry" },
  habitacion: { es: "Habitación", en: "Room" },
  camping: { es: "Camping", en: "Camping" },
  tour: { es: "Tour de café y chocolate", en: "Coffee and chocolate tour" },
  kayak: { es: "Kayak", en: "Kayaking" },
  camion: { es: "Camión desde Matagalpa", en: "Shuttle from Matagalpa" }
};

function currentLang() {
  return document.documentElement.lang === "en" ? "en" : "es";
}

function applyLang(lang) {
  const dict = I18N[lang] || I18N.es;
  document.documentElement.lang = lang;
  document.documentElement.dataset.lang = lang;
  document.title = dict.docTitle;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key] != null) el.textContent = dict[key];
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria");
    if (dict[key] != null) el.setAttribute("aria-label", dict[key]);
  });
  document.querySelectorAll(".lang button").forEach((b) => {
    b.setAttribute("aria-pressed", b.dataset.lang === lang ? "true" : "false");
  });
  const float = document.getElementById("waFloat");
  if (float) {
    const text = encodeURIComponent(dict.waFloat);
    float.href = `https://wa.me/${WA_NUMBER}?text=${text}`;
  }
  try { localStorage.setItem("cb-lang", lang); } catch (_) {}
}

function setupLang() {
  let lang = "es";
  try { lang = localStorage.getItem("cb-lang") || "es"; } catch (_) {}
  applyLang(lang === "en" ? "en" : "es");
  document.querySelectorAll(".lang button").forEach((b) => {
    b.addEventListener("click", () => applyLang(b.dataset.lang));
  });
}

function setupNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("menu");
  if (!toggle || !nav) return;
  const close = () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };
  toggle.addEventListener("click", () => {
    const open = !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
  const header = document.querySelector(".header");
  const onScroll = () => header && header.classList.toggle("is-scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function setupHero() {
  const video = document.getElementById("heroVideo");
  const poster = document.getElementById("heroPoster");
  if (!video) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const enabled = HERO_VIDEO_ENABLED || video.getAttribute("data-enabled") === "true";
  const clearSources = () => {
    video.querySelectorAll("source").forEach((s) => s.remove());
    video.removeAttribute("src");
    video.removeAttribute("autoplay");
    video.autoplay = false;
    try { video.load(); } catch (e) {}
  };
  if (!enabled || reduce) {
    clearSources();
    return;
  }
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const saveData = !!(conn && (conn.saveData || /2g/.test(conn.effectiveType || "")));
  const mobile = window.matchMedia("(max-width: 720px) and (orientation: portrait)").matches;
  const pack = mobile ? HERO_VIDEO.mobile : HERO_VIDEO.desktop;
  const media = mobile ? "(max-width: 720px) and (orientation: portrait)" : "";
  /* Reconstruimos las fuentes para que Safari (apoyo irregular de media en <source>) reciba el archivo correcto. */
  video.querySelectorAll("source").forEach((s) => s.remove());
  const add = (src, type) => {
    if (!src) return;
    if (type.indexOf("webm") !== -1) {
      const ok = video.canPlayType('video/webm; codecs="vp9"') || video.canPlayType("video/webm");
      if (!ok) return;
    }
    const source = document.createElement("source");
    source.src = src;
    source.type = type;
    if (media) source.media = media;
    video.appendChild(source);
  };
  add(pack.webm, "video/webm");
  add(pack.mp4, "video/mp4");
  video.classList.add("is-on");
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.loop = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("muted", "");
  video.setAttribute("loop", "");
  const fail = () => {
    video.classList.remove("is-on");
    video.removeAttribute("autoplay");
    if (poster) poster.classList.remove("is-hidden");
  };
  video.addEventListener("error", fail);
  video.addEventListener("playing", () => { if (poster) poster.classList.add("is-hidden"); });
  if (saveData) {
    video.preload = "none";
    video.removeAttribute("autoplay");
    video.autoplay = false;
  } else {
    video.preload = "metadata";
    video.autoplay = true;
    video.setAttribute("autoplay", "");
    video.load();
    video.play().catch(fail);
  }
}

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  const arr = new Uint8Array(4);
  (crypto.getRandomValues ? crypto.getRandomValues(arr) : arr.forEach((_, i) => arr[i] = Math.floor(Math.random() * 256)));
  for (let i = 0; i < 4; i++) s += chars[arr[i] % chars.length];
  return "CB-" + s;
}

function buildMessage(data) {
  const lang = data.idioma === "en" ? "en" : "es";
  const tipo = TYPES[data.tipo] ? TYPES[data.tipo][lang] : data.tipo;
  if (lang === "en") {
    return [
      `Hello, I would like to make a request at Eco-Lodge Cascada Blanca.`,
      `Code: ${data.code}`,
      `Type: ${tipo}`,
      `Date: ${data.fecha}`,
      `Number of people: ${data.personas}`,
      `Name: ${data.nombre}`,
      `Preferred language: English`,
      data.notas ? `Comments: ${data.notas}` : null,
      `Please confirm availability and the current rate (I saw the sample website).`
    ].filter(Boolean).join("\n");
  }
  return [
    `Hola, quiero hacer una solicitud en Eco-Lodge Cascada Blanca.`,
    `Código: ${data.code}`,
    `Tipo: ${tipo}`,
    `Fecha: ${data.fecha}`,
    `Número de personas: ${data.personas}`,
    `Nombre: ${data.nombre}`,
    `Idioma de atención: Español`,
    data.notas ? `Comentarios: ${data.notas}` : null,
    `Por favor confirmen disponibilidad y el precio vigente (vi la página de muestra).`
  ].filter(Boolean).join("\n");
}

function setupForm() {
  const form = document.getElementById("reserva-form");
  if (!form) return;
  const fecha = form.querySelector("[name=fecha]");
  if (fecha) {
    const t = new Date();
    const iso = t.toISOString().slice(0, 10);
    fecha.min = iso;
  }
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const data = {
      tipo: (fd.get("tipo") || "").toString().trim(),
      fecha: (fd.get("fecha") || "").toString().trim(),
      personas: (fd.get("personas") || "").toString().trim(),
      nombre: (fd.get("nombre") || "").toString().trim(),
      idioma: (fd.get("idioma") || currentLang()).toString(),
      notas: (fd.get("notas") || "").toString().trim()
    };
    if (!data.tipo || !data.fecha || !data.personas || !data.nombre) {
      alert(I18N[currentLang()].required);
      return;
    }
    data.code = makeCode();
    const text = buildMessage(data);
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
    form.dataset.waUrl = url;
    form.dataset.waCode = data.code;
    window.__lastWaUrl = url;
    const ok = document.getElementById("reserva-ok");
    const codeEl = document.getElementById("reserva-codigo");
    if (ok && codeEl) {
      ok.classList.add("is-on");
      codeEl.textContent = data.code;
    }
    const e2e = new URLSearchParams(location.search).has("e2e") || window.__E2E__;
    if (!e2e) {
      window.location.href = url;
    }
  });
}

setupLang();
setupNav();
setupHero();
setupForm();
