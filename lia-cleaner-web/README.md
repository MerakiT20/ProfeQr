# LIA Cleaner Web

Prototipo web/PWA móvil de una app de limpieza guiada para Android.

## Incluye

- Dashboard de estado del teléfono.
- Apps sin usar ordenables por antigüedad o tamaño.
- Recomendaciones de limpieza guiada.
- Indicadores de espacio potencialmente recuperable.
- Navegación móvil inferior.
- Diseño responsive.
- Manifest y service worker para instalación como PWA.
- Datos demo y acciones simuladas.

## Ejecutar

Sirve esta carpeta con cualquier servidor estático. Por ejemplo:

```bash
python3 -m http.server 8080
```

Luego abre `http://localhost:8080/lia-cleaner-web/` si sirves desde la raíz del repositorio, o `http://localhost:8080/` si ejecutas el servidor dentro de esta carpeta.

## Limitación importante

Una PWA o sitio web normal no puede consultar libremente las aplicaciones instaladas de Android, sus estadísticas reales de uso, ni limpiar la caché privada de otras apps. La interfaz está preparada como prototipo y usa datos simulados.

Para convertirla en un producto real se recomienda mantener esta UI y añadir una capa Android nativa, por ejemplo mediante Capacitor con plugins Kotlin propios o una aplicación Android nativa completa. Las funciones nativas deberían cubrir como mínimo:

- UsageStatsManager para estadísticas de uso autorizadas por el usuario.
- PackageManager para información de paquetes dentro de las restricciones de visibilidad de Android.
- Intents del sistema para desinstalación confirmada por el usuario.
- Storage Access Framework / MediaStore para archivos accesibles y autorizados.
- Flujos del sistema para gestión de almacenamiento y caché donde Android lo permita.

No implementar un supuesto “RAM booster”: Android administra la memoria automáticamente y cerrar procesos indiscriminadamente puede empeorar la experiencia.
