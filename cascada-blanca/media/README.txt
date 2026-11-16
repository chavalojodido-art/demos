Fondo de video del hero (portada)
=================================

Cuando esté listo el video corto de la cascada (Google Flow u otro):

1. Guarda el archivo aquí, con este nombre exacto:

   demos/cascada-blanca/media/hero.mp4

   (en el sitio publicado: /cascada-blanca/media/hero.mp4)

2. Activa el video de una de estas dos formas (basta con una):
   - En js/site.js, pon:  const HERO_VIDEO_ENABLED = true;
   - O en index.html, en el <video id="heroVideo">, cambia data-enabled="false" a data-enabled="true".

3. El <video> ya está preparado con: autoplay, muted, loop, playsinline.
   - Póster: foto fija mejorada (assets/photos/hero-16x9-1280.jpg).
   - En datos móviles (saveData o 2g) el preload es "none" y no se auto-reproduce.
   - En el resto, preload="metadata".
   - Si el video falla o el usuario tiene prefers-reduced-motion, se queda la foto.

Mejores fotos para animar en Flow (ya mejoradas, recortadas):

- Horizontal 16:9 (recomendada para escritorio y póster):
  assets/photos/masters/hero-16x9.jpg
  (origen: TripAdvisor, «vista del mirador Yasica», 1600×900)

- Vertical 9:16 (recomendada para móvil / Stories):
  assets/photos/masters/hero-9x16.jpg
  (origen: blog ILP 2022, desde el interior de la cueva, 1440×2560)
