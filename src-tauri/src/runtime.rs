use serde::Serialize;

/// How the app was installed, which decides whether it can update itself.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeInfo {
    /// "windows" | "macos" | "linux"
    pub platform: &'static str,
    /// "nsis" | "msi" | "appimage" | "deb" | "dmg" | "unknown"
    pub install_kind: &'static str,
    /// Only NSIS and AppImage installs can replace themselves safely.
    pub updater_supported: bool,
}

#[cfg(target_os = "windows")]
fn detect() -> (&'static str, &'static str, bool) {
    let exe = std::env::current_exe()
        .map(|path| path.to_string_lossy().to_lowercase())
        .unwrap_or_default();

    // The MSI installs per-machine into Program Files; the NSIS installer is
    // per-user by default. Running the NSIS updater over an MSI install would
    // duplicate the app, so MSI users update manually.
    if exe.contains("program files") {
        ("windows", "msi", false)
    } else {
        ("windows", "nsis", true)
    }
}

#[cfg(target_os = "linux")]
fn detect() -> (&'static str, &'static str, bool) {
    // The AppImage runtime exports APPIMAGE with its own path.
    if std::env::var_os("APPIMAGE").is_some() {
        ("linux", "appimage", true)
    } else {
        ("linux", "deb", false)
    }
}

#[cfg(target_os = "macos")]
fn detect() -> (&'static str, &'static str, bool) {
    // Self-update works, but until the app is signed and notarized Gatekeeper
    // can refuse to open the replaced bundle. Manual downloads for now.
    ("macos", "dmg", false)
}

#[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
fn detect() -> (&'static str, &'static str, bool) {
    ("unknown", "unknown", false)
}

/// Tells the frontend which platform/install combination it is running on.
#[tauri::command]
pub fn runtime_info() -> RuntimeInfo {
    // Escape hatch for testing the flow on a build that is not installed.
    if std::env::var("FMT_FORCE_UPDATER").is_ok_and(|value| value == "1") {
        let (platform, install_kind, _) = detect();
        return RuntimeInfo {
            platform,
            install_kind,
            updater_supported: true,
        };
    }

    let (platform, install_kind, updater_supported) = detect();
    RuntimeInfo {
        platform,
        install_kind,
        updater_supported,
    }
}
