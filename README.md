# ProfeQr

Versión modular estable basada en v8.6.

- Mantiene la clave de almacenamiento `profeqr_v3_comercial` para conservar datos existentes.
- Divide el antiguo `app.js` monolítico en módulos clásicos cargados en orden desde `index.html`.
- Corrige `today()` para usar la fecha local del dispositivo en lugar de UTC.
- Completa los cuatro iconos declarados por la PWA.
- El service worker exige que el núcleo local se almacene correctamente y trata las dependencias CDN como caché opcional.

La modularización es deliberadamente conservadora: no cambia el esquema de datos ni los flujos funcionales.
