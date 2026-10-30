mod engines;
mod media;
mod plan;
mod queue;
mod runtime;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            let manager = queue::JobManager::new(app.handle().clone());
            app.manage(manager);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            engines::engine_status,
            media::probe_files,
            queue::enqueue_job,
            queue::cancel_job,
            runtime::runtime_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
