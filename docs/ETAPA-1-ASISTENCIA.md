# Etapa 1 — Captura rápida y control local de asistencia

Objetivo: que el docente pueda registrar y confirmar la asistencia diaria en menos de 30 segundos cuando sólo necesita marcar ausentes, sin depender todavía de un servidor en línea.

## Flujo docente

1. Abrir Asistencia.
2. Pulsar **Pase rápido: todos presentes**.
3. En la vista manual, tocar únicamente a los alumnos ausentes.
4. Revisar el resumen de presentes, ausentes y total.
5. Pulsar **Confirmar reporte**.

## Estados del reporte

- **Pendiente de reportar**: todavía no se ha confirmado la asistencia del día.
- **Confirmado · guardado local**: el docente ya confirmó el reporte; puede utilizarse aunque la nube aún no esté configurada.
- **Reportado**: el reporte fue sincronizado con Dirección.
- **Cambios sin reenviar**: la lista fue modificada después de confirmar; el docente debe reenviar/corregir.

## Reglas

- Cero faltas no significa “sin reporte”. El reporte debe confirmarse explícitamente.
- Cada confirmación guarda hora, cantidades y lista de ausentes.
- Si se confirma nuevamente el mismo día, se registra como una revisión/corrección.
- Las correcciones no borran el historial local previo.
- Si no existe conexión o todavía no se configura el servidor, el reporte queda guardado en el dispositivo.
- La cola conserva sólo la versión más reciente del día para sincronización, pero el historial local conserva todas las revisiones.

## Recordatorios

- 14:40: aviso de asistencia pendiente.
- 15:00: aviso de reporte atrasado.
- Un reporte confirmado localmente ya no genera aviso.
- Si la asistencia cambia después de confirmar, vuelve a considerarse pendiente de corrección.

## Criterios de aceptación de Etapa 1

- [x] Pase por excepción: todos presentes y sólo marcar ausentes.
- [x] Diferenciar “sin reporte” de “cero faltas”.
- [x] Confirmación explícita del reporte diario.
- [x] Sello de hora de confirmación.
- [x] Historial local de revisiones.
- [x] Detección de cambios posteriores al reporte.
- [x] Reenvío/corrección explícita.
- [x] Recordatorios 14:40 y 15:00.
- [x] Funcionamiento sin servidor configurado.
- [x] Cola preparada para sincronización de Etapa 2.

## Fuera de alcance de esta etapa

- Base de datos escolar en línea.
- Panel multi-grupo en tiempo real.
- Push notifications con la app completamente cerrada.
- Motor directivo de alertas por ausentismo.
- Integración automática con Bitácora Escolar.
