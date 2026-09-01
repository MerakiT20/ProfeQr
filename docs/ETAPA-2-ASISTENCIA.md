# Etapa 2 — Inteligencia de asistencia

## Entrega

- Sincronización protegida por una clave propia de la escuela.
- Reportes con revisión y ausentes identificados por ID estable.
- Consulta histórica de 30 días desde Direkta.
- Historial individual por alumno.
- Alertas amarillo, naranja y rojo.
- Faltas consecutivas y acumuladas en 10/15 días reportados.
- Comparativo por grupo y cumplimiento de los seis reportes.

## Reglas iniciales

- Amarillo: 2 faltas consecutivas o 3 en los últimos 10 días reportados.
- Naranja: 3 consecutivas o 4–5 en los últimos 15 días reportados.
- Rojo: 4 consecutivas o 6 en los últimos 15 días reportados.

Las reglas usan únicamente días efectivamente reportados por cada grupo. Un día sin reporte nunca cuenta como asistencia ni como falta.

## Puesta en marcha

1. Crear el proyecto Supabase.
2. Cambiar el token de ejemplo en `supabase-attendance.sql` y ejecutar el script.
3. Configurar la misma URL, anon key, CCT y clave escolar en ProfeQR y Direkta.
4. Configurar en cada ProfeQR su grupo y docente.
5. Probar primero con un grupo y después habilitar los seis.

La integración documental automática con Bitácora queda fuera de esta entrega: no se crean expedientes sin confirmar la identidad del alumno.
