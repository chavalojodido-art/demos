Fondo de video del hero (portada)
=================================

Archivos web (estos sí se publican):

  hero.mp4 / hero.webm             Escritorio 16:9, 1280×720, 7 s, sin audio
  hero-mobile.mp4 / hero-mobile.webm
                                   Móvil vertical 9:16, 720×1280, 7 s, sin audio

El loop tiene un fundido (crossfade) de ~0,8 s entre el final y el inicio
para que no se note el corte. El póster es el primer fotograma de ese loop
(assets/photos/hero-video-16x9-* y hero-video-9x16-*).

Para activar o desactivar: HERO_VIDEO_ENABLED en js/site.js, o data-enabled
en el <video id="heroVideo">.

Comportamiento:
  - autoplay, muted, loop, playsinline
  - <source media> sirve el recorte vertical en móvil (máx. 720 px y portrait)
  - En datos móviles (saveData o 2g) el preload es "none" y no se auto-reproduce
  - Si el video falla o hay prefers-reduced-motion, se queda el póster

NO subas ni publiques hero_flow_original.mp4 (el master de Veo/Flow).
El script publicar/sincronizar_cascada_blanca.sh lo excluye a propósito.
