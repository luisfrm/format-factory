mod engines;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![engines::engine_status])
        .setup(|_app| Ok(()))
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
