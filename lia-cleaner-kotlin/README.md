# LIA Cleaner — Android nativo

Prototipo Android 100% Kotlin + Jetpack Compose.

## Objetivo

Construir un administrador inteligente de aplicaciones y almacenamiento que ayude al usuario a decidir qué conservar, revisar o desinstalar, sin promesas falsas de "RAM booster".

## Estado actual

- Interfaz Compose con tres secciones: Inicio, Apps y Limpieza.
- Datos demo para validar UX.
- Capa `AndroidSystemGateway` reservada para APIs nativas.
- GitHub Actions genera `app-debug.apk` en cada push a `agent/lia-cleaner-kotlin`.

## Próximas integraciones

1. `PackageManager`: inventario real de aplicaciones.
2. `UsageStatsManager`: último uso y tiempo de uso, con permiso del usuario.
3. Cálculo de tamaño/almacenamiento compatible con restricciones actuales de Android.
4. `ACTION_DELETE` / intents del sistema para desinstalación guiada.
5. Lista protegida y motor de recomendaciones.

## Permisos

`PACKAGE_USAGE_STATS` requiere que el usuario habilite Acceso de uso en Ajustes. `QUERY_ALL_PACKAGES` está declarado para el prototipo, pero su publicación en Google Play requiere justificar el caso de uso y cumplir la política de visibilidad de paquetes.

## Compilación en GitHub

El workflow `.github/workflows/android-build.yml` usa JDK 17 y Gradle 8.13 para ejecutar `:app:assembleDebug` y sube el APK como artefacto.
