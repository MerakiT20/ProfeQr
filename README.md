# ProfeQr

Versión estable 8.8.

- Mantiene la clave `profeqr_v3_comercial` y normaliza datos heredados sin perder vínculos por `studentId`.
- Incluye asistencia QR/manual, trabajos, agenda, CTE, guardias, biblioteca, documentos, reportes y las rutas A/B/C/CIT de Bitácora.
- Funciona como PWA sin conexión con todas sus dependencias críticas almacenadas localmente.
- Los respaldos integrales incluyen documentos y se validan antes de reemplazar la información local.
- La licencia comercial sigue ligada a la instalación; no se incluye en respaldos exportados.

## Verificación

Con la aplicación servida en `http://127.0.0.1:4173`:

```bash
npm ci
npm test
```

La batería cubre sintaxis, arranque, PWA offline en raíz y subruta, alumnos e historial, asistencia, trabajos/Excel, PIN/licencia, respaldos/documentos, dictado, Centro de Atención y Bitácora A/B/C/CIT.
