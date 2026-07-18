mod commands;
mod db;

use std::sync::Mutex;
use commands::DbState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("failed to resolve app data dir");
            std::fs::create_dir_all(&app_data_dir).expect("failed to create app data dir");
            let conn = db::init_db(&app_data_dir).expect("failed to init database");
            conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;")
                .expect("failed to set pragmas");
            
            // Integrity check with auto-recovery
            let re_check: String = conn
                .query_row("PRAGMA integrity_check", [], |r| r.get(0))
                .unwrap_or_else(|_| "error".into());
            let conn = if re_check != "ok" {
                eprintln!("[WARN] Database integrity check failed: {}", re_check);
                // Try WAL checkpoint first
                let _ = conn.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);");
                // Re-check
                let final_check: String = conn
                    .query_row("PRAGMA integrity_check", [], |r| r.get(0))
                    .unwrap_or_else(|_| "error".into());
                if final_check != "ok" {
                    eprintln!("[ERROR] Database still corrupted after checkpoint. Attempting recovery...");
                    drop(conn);
                    db::recover_database(&app_data_dir).expect("failed to recover database")
                } else {
                    conn
                }
            } else {
                conn
            };
            app.manage(DbState(Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_products,
            commands::add_product,
            commands::save_product,
            commands::delete_product,
            commands::bulk_delete_products,
            commands::bulk_add_products,
            commands::update_stock,
            commands::search_products,
            commands::check_db_integrity,
            commands::reset_db,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
