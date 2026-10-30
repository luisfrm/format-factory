# Política de seguridad

## Versiones soportadas

Solo la **última versión publicada** recibe correcciones de seguridad.

| Versión | Soporte |
|---|---|
| Última release | ✅ |
| Anteriores | ❌ |

## Reportar una vulnerabilidad

**No abras un issue público.** Usa el reporte privado de GitHub:

👉 https://github.com/luisfrm/format-factory/security/advisories/new

Incluye, si puedes:

- Versión de Format Factory y sistema operativo.
- Pasos para reproducir el problema.
- Impacto que crees que tiene.
- Prueba de concepto (sin datos personales).

### Qué esperar

| Etapa | Plazo objetivo |
|---|---|
| Acuse de recibo | 48 h |
| Evaluación inicial | 7 días |
| Corrección publicada | según gravedad |

Si la vulnerabilidad se confirma, se publica un GitHub Security Advisory y se te
acredita en las notas del release, salvo que prefieras el anonimato.

## Alcance

Dentro del alcance:

- Ejecución de código o escape del sandbox del WebView.
- Path traversal o escritura arbitraria desde los comandos de Rust.
- Inyección de argumentos en `ffmpeg`/`ffprobe` a través de nombres de archivo.
- Suplantación de actualizaciones o artefactos de release.
- Robo o exposición de datos del usuario.

Fuera del alcance:

- Bloqueos de Gatekeeper o SmartScreen por falta de firma de código.
- Vulnerabilidades en binarios de FFmpeg no modificados (repórtalas aguas arriba).
- Ingeniería social o ataques que requieran acceso físico al equipo.
- Resultados de escáneres automáticos sin prueba de explotación.

## Modelo de seguridad de la aplicación

- La UI corre en un WebView sin acceso al sistema de archivos.
- Todo el I/O pasa por comandos explícitos de Rust, registrados en `lib.rs`.
- Los permisos de Tauri viven en `src-tauri/capabilities/default.json` y son mínimos.
- Ningún secreto se guarda en el repositorio ni en los logs.
- Las dependencias se actualizan con Dependabot y pasan revisión antes de mergear.
