# Etapa 3 — Sistema escolar de comunicación

## ProfeQR

- Recibe avisos dirigidos a todos, a un grupo o a un docente.
- Registra confirmación de lectura.
- Envía incidencias o solicitudes estructuradas.
- Conserva una cola offline y reintenta al recuperar conexión.
- Consulta el estado y la respuesta de Dirección.
- Solicita permiso para notificaciones locales.

## Direkta

- Publica avisos por destinatario y prioridad.
- Muestra cuántos docentes han leído cada aviso.
- Recibe incidencias y solicitudes en una bandeja única.
- Cambia su estado: nueva, recibida, en proceso, resuelta o no procede.
- Responde al docente sin crear un chat general.
- Conserva auditoría de altas y cambios.

## Seguridad

Cada dispositivo usa un token individual asociado con escuela, actor, rol y grupo. El docente sólo puede registrar asistencia de su grupo, leer avisos dirigidos a él y consultar sus propios mensajes. Dirección puede consultar la escuela completa, publicar avisos y gestionar la bandeja.

## Push

El service worker ya puede recibir y mostrar eventos Web Push. El envío con la aplicación completamente cerrada requiere desplegar un emisor seguro —por ejemplo, una Edge Function— y configurar VAPID. Hasta entonces funcionan la actualización periódica y las notificaciones locales cuando la PWA está activa.

## Criterio de cierre

La etapa debe probarse con un token de Dirección y al menos dos tokens docentes distintos, incluyendo pruebas negativas: un docente no debe ver mensajes de otro ni reportar un grupo ajeno.
