# Instalación

Format Factory se publica **sin firma de código**. Los instaladores funcionan,
pero el sistema avisará la primera vez. Así se evita ese aviso:

## Windows

Descarga `Format-Factory_<versión>_windows-x64-setup.exe` y ejecútalo.

Si aparece **"Windows protegió tu PC"**:

1. Clic en **Más información**
2. **Ejecutar de todas formas**

También puedes usar el `.msi` si prefieres el instalador clásico.

> Requisito: WebView2 (viene preinstalado en Windows 10/11 actualizados).

## macOS (Apple Silicon)

Descarga `Format-Factory_<versión>_macos-arm64.dmg`, ábrelo y arrastra la app a
Aplicaciones.

La primera vez macOS dirá que la app **"está dañada"** o que proviene de un
desarrollador no identificado. Es el bloqueo normal de Gatekeeper para apps sin
notarizar:

1. Clic derecho sobre Format Factory → **Abrir** → **Abrir**
2. O desde Terminal:

```bash
xattr -cr "/Applications/Format Factory.app"
```

> Este build es arm64. En Macs Intel usa Rosetta o compila desde el código fuente.

## Linux

```bash
chmod +x Format-Factory_<versión>_linux-x64.AppImage
./Format-Factory_<versión>_linux-x64.AppImage
```

O instala el `.deb`:

```bash
sudo apt install ./Format-Factory_<versión>_linux-amd64.deb
```

> Requisito: `libwebkit2gtk-4.1` (viene en Ubuntu 22.04+).

## Verificar la descarga

Cada release incluye `SHA256SUMS.txt`:

```bash
sha256sum -c SHA256SUMS.txt        # Linux
shasum -a 256 -c SHA256SUMS.txt    # macOS
```

```powershell
Get-FileHash .\Format-Factory_*.exe -Algorithm SHA256   # Windows
```

## Compilar desde el código

```bash
pnpm install
pnpm setup:binaries
pnpm build:installer
```
