export const STATS = [
  { value: "100%", label: "local", detail: "Tus archivos no salen del equipo." },
  { value: "9", label: "destinos", detail: "Video y audio, sin plugins." },
  { value: "1", label: "proceso", detail: "Una cola serial, sin saturar la máquina." },
  { value: "0", label: "cuentas", detail: "Sin registro. Sin telemetría." },
] as const;

export const FEATURES = [
  {
    icon: "layers",
    title: "Lotes mixtos, una sola cola",
    body: "Video y audio en el mismo lote. Aplica un destino a todos o ajusta uno por uno sin perder lo que ya terminó.",
    span: "wide",
    visual: "mix",
  },
  {
    icon: "shield",
    title: "Nada sale de tu equipo",
    body: "FFmpeg corre en local. No hay subidas, ni límites de tamaño, ni una nube mirando tus archivos.",
    span: "wide",
    visual: "local",
  },
  {
    icon: "activity",
    title: "Progreso que no miente",
    body: "Porcentaje, velocidad y ETA reales, leídos del propio FFmpeg cada 140 ms.",
    span: "normal",
    visual: "progress",
  },
  {
    icon: "sliders",
    title: "Presets con criterio",
    body: "Alta, Balance o Compacta. Los tres cubren el 90% de los casos sin abrir una docena de ajustes.",
    span: "normal",
    visual: "presets",
  },
  {
    icon: "history",
    title: "Nunca pisa el original",
    body: "Si el destino coincide con el origen, añade «-convertido». Y guarda historial de lo convertido.",
    span: "normal",
    visual: "history",
  },
] as const;

export const STEPS = [
  {
    number: "01",
    title: "Arrastra",
    body: "Suelta video, audio o una mezcla. La app lee duración, códec y tamaño de cada archivo.",
  },
  {
    number: "02",
    title: "Elige",
    body: "Destino y calidad. Puedes aplicar el mismo preset al lote entero o cambiar una fila.",
  },
  {
    number: "03",
    title: "Convierte",
    body: "La cola avanza en orden, con progreso real. Al terminar, abre la carpeta de salida.",
  },
] as const;

export const VIDEO_FORMATS = ["MP4", "MKV", "WebM", "MOV"] as const;

export const AUDIO_FORMATS = ["MP3", "AAC", "M4A", "WAV", "FLAC"] as const;

export const INPUT_FORMATS = [
  "MP4",
  "MKV",
  "MOV",
  "AVI",
  "WebM",
  "WMV",
  "MP3",
  "WAV",
  "FLAC",
  "M4A",
  "AAC",
  "OGG",
] as const;

export const FAQ = [
  {
    question: "¿Sube mis archivos a algún servidor?",
    answer:
      "No. La conversión la hace FFmpeg dentro de tu equipo. La app no necesita internet para convertir y no envía archivos, nombres ni métricas a ningún sitio.",
  },
  {
    question: "¿Es realmente gratis?",
    answer:
      "Sí. Format Factory es open source bajo licencia MIT. No hay cuenta, suscripción ni límite de conversiones. Puedes usar, modificar y redistribuir el proyecto conservando el aviso de copyright.",
  },
  {
    question: "Windows muestra SmartScreen. ¿Es normal?",
    answer:
      "Sí. Los instaladores no están firmados con un certificado de código, así que Windows avisa la primera vez. Pulsa «Más información» y luego «Ejecutar de todas formas». En macOS, abre el .dmg, arrastra la app y usa clic derecho → Abrir la primera vez.",
  },
  {
    question: "¿Puedo convertir varios archivos a la vez?",
    answer:
      "Puedes añadir todos los que quieras al lote. La cola procesa un archivo cada vez para no saturar la máquina; el resto espera en orden. Cada fila muestra su propio progreso.",
  },
  {
    question: "¿Sobrescribe mis archivos originales?",
    answer:
      "No. Si el archivo de destino coincide con el de origen, se añade el sufijo «-convertido». Los originales se quedan donde están.",
  },
  {
    question: "¿Qué versiones de FFmpeg utiliza?",
    answer:
      "La app incluye FFmpeg y FFprobe 6.1.1 como sidecars. No hace falta instalar nada aparte ni tocar el PATH del sistema.",
  },
  {
    question: "¿Hay versión para Mac con Intel o Linux ARM?",
    answer:
      "Hoy se publican Windows x64, macOS arm64 (Apple Silicon) y Linux x64. Si necesitas otra arquitectura, abre un issue en GitHub y cuéntanos tu caso.",
  },
] as const;

export const DOWNLOAD_NOTES = [
  "Windows 10 u 11, 64 bits",
  "macOS 12 o superior, Apple Silicon",
  "Linux x64 con AppImage o paquete .deb",
] as const;
