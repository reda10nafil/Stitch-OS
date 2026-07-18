use crate::db;
use tauri::State;
use tauri::Manager;
use std::sync::Mutex;
use rusqlite::Connection;

pub struct DbState(pub Mutex<Connection>);

#[tauri::command]
pub fn get_products(state: State<'_, DbState>) -> Result<Vec<db::Product>, String> {
    db::select_all_products(&state.0)
}

#[tauri::command]
pub fn add_product(state: State<'_, DbState>, product: db::Product) -> Result<(), String> {
    db::insert_product(&state.0, &product)
}

#[tauri::command]
pub fn save_product(state: State<'_, DbState>, product: db::Product) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let exists: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM prodotti WHERE sku = ?1",
            [&product.sku],
            |row| row.get::<_, i32>(0),
        )
        .map(|c| c > 0)
        .map_err(|e| e.to_string())?;
    drop(conn);
    if exists {
        db::update_product(&state.0, &product)
    } else {
        db::insert_product(&state.0, &product)
    }
}

#[tauri::command]
pub fn delete_product(state: State<'_, DbState>, sku: String) -> Result<usize, String> {
    db::delete_product(&state.0, &sku)
}

#[tauri::command]
pub fn bulk_delete_products(state: State<'_, DbState>, skus: Vec<String>) -> Result<usize, String> {
    db::bulk_delete_products(&state.0, &skus)
}

#[tauri::command]
pub fn bulk_add_products(state: State<'_, DbState>, products: Vec<db::Product>, mode: Option<String>) -> Result<usize, String> {
    let mode_str = mode.as_deref().unwrap_or("ignore");
    if mode_str == "replace" {
        db::bulk_upsert_products(&state.0, &products, mode_str)
    } else {
        db::bulk_insert_products(&state.0, &products)
    }
}

#[tauri::command]
pub fn update_stock(state: State<'_, DbState>, sku: String, quantita_stock: i32) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE prodotti SET quantita_stock = ?2, updated_at = CURRENT_TIMESTAMP WHERE sku = ?1",
        rusqlite::params![sku, quantita_stock],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn search_products(state: State<'_, DbState>, query: String, limit: Option<i32>) -> Result<Vec<db::Product>, String> {
    db::search_products(&state.0, &query, limit.unwrap_or(10))
}

#[tauri::command]
pub fn check_db_integrity(state: State<'_, DbState>) -> Result<serde_json::Value, String> {
    let healthy = db::db_integrity_check(&state.0)?;
    Ok(serde_json::json!({ "healthy": healthy }))
}

#[tauri::command]
pub fn reset_db(state: State<'_, DbState>, app_handle: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let app_data_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    db::reset_database(&state.0, &app_data_dir)?;
    Ok(serde_json::json!({ "reset": true, "message": "Database ricreato con successo" }))
}
