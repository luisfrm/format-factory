fn main() {
    // Expose the build target triple so the runtime can resolve sidecars named
    // like `ffmpeg-x86_64-pc-windows-msvc.exe` during development.
    if let Ok(target) = std::env::var("TARGET") {
        println!("cargo:rustc-env=FF_TARGET={target}");
    }

    tauri_build::build()
}
