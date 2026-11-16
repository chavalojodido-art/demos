Fondo de video del hero (portada)
=================================

Archivos web (estos sí se publican):

  hero-mobile.mp4 / hero-mobile.webm
      Móvil vertical 9:16, 720×1280, 7 s, sin audio. No cambiar salvo nueva toma.

  hero.mp4 / hero.webm
      Tablets y portátiles (min-width 768, densidad normal): 1280×720.

  hero-1080.mp4 / hero-1080.webm
      Escritorio grande (≥1440 px) o alta densidad (2x y min-width 768):
      1920×1080 nativo, mismo loop con crossfade de ~0,8 s.

El loop funde el final con el inicio. El póster es el primer fotograma de ese loop
(assets/photos/hero-video-16x9-* y hero-video-9x16-*).

No se publicó un 1440p: el original es 1080p y un simple upscale (lanczos/unsharp)
no añadió detalle real, solo halos. No hay modelo de upscaling (Real-ESRGAN) en
este entorno.

NO subas ni publiques hero_flow_original.mp4 (el master de Veo/Flow).
El script publicar/sincronizar_cascada_blanca.sh lo excluye a propósito.
