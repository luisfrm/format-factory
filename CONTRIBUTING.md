# Contribuir

Gracias por querer aportar. Este proyecto es abierto para usar y descargar, pero
**todos los cambios pasan por revisión del mantenedor** antes de entrar a
`master`.

## Antes de empezar

- Para bugs y propuestas: abre un issue con la plantilla correspondiente.
- Para cambios de código: abre un issue corto primero si es algo grande. Evita
  PRs gigantes sin contexto.
- Para vulnerabilidades: sigue [SECURITY.md](./SECURITY.md), **nunca** un issue público.

## Entorno

| Herramienta | Versión |
|---|---|
| Node.js | ≥ 20 (CI usa 24) |
| pnpm | ≥ 9 (CI usa 11) |
| Rust | ≥ 1.90 |
| FFmpeg | 6+ (lo provisiona `pnpm setup:binaries`) |

```bash
pnpm install
pnpm setup:binaries   # copia ffmpeg/ffprobe a src-tauri/binaries
pnpm dev              # app nativa con hot reload
```

Antes de abrir un PR:

```bash
pnpm check            # typecheck + tests TS + tests Rust
pnpm build            # verifica que el ejecutable compila
```

## Flujo de contribución

1. Haz fork del repositorio.
2. Crea una rama desde `master`: `feat/cola-arrastrable`, `fix/eta-negativa`.
3. Commit **siguiendo Conventional Commits**:

   ```
   feat(queue): permite reordenar arrastrando
   fix(ui): corrige el ETA cuando la duración es desconocida
   docs: aclara los requisitos de macOS
   chore(deps): actualiza motion a 14.8
   ```

   Tipos válidos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`,
   `ci`, `perf`, `build`.

4. Abre el PR contra `master` y rellena la plantilla.
5. CI compila Windows, Linux y macOS. Debe pasar entero.
6. El mantenedor revisa. Se pedirá al menos **una aprobación** y la conversación
   resuelta antes de mergear.

No hace falta firmar un CLA: al enviar un PR aceptas que tu aporte se publique
bajo la licencia del proyecto.

## Reglas de código

- TypeScript estricto. Nada de `any` sin justificar.
- Lógica reutilizable en `src/lib/`, no dentro de componentes.
- Componentes sin lógica de negocio; el estado vive en `src/store/`.
- Cada función pura nueva lleva su test en el mismo directorio.
- Las animaciones respetan `prefers-reduced-motion`.
- No se añaden dependencias nuevas sin explicar por qué en el PR.
- Nada de binarios, instaladores ni secretos en el repositorio.

## Diseño

Los tokens y el sistema visual están en `docs/` y `src/styles/globals.css`. Si tu
PR cambia la interfaz, adjunta capturas antes y después.

## Seguridad del CI

- Los workflows de PR se ejecutan sin secretos y con `contents: read`.
- Solo el job de publicación (en `master`) tiene permiso de escritura.
- Si tu PR toca `.github/workflows/`, se revisará con más detalle.
