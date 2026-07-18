use rusqlite::{Connection, Result as SqlResult};
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::Mutex;

pub const DB_FILE: &str = "stitchos_erp.db";

pub fn init_db(app_data_dir: &Path) -> SqlResult<Connection> {
    let db_path = app_data_dir.join(DB_FILE);
    
    // We no longer delete WAL files here. Deleting WAL files before opening 
    // the database discards uncheckpointed data and corrupts the database.
    // SQLite will automatically use the WAL file to recover the database.
    
    let conn = Connection::open(&db_path)?;
    conn.execute_batch("PRAGMA foreign_keys = ON;")?;
    conn.execute_batch(DDL)?;
    Ok(conn)
}

const DDL: &str = "
CREATE TABLE IF NOT EXISTS clienti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    cognome TEXT,
    telefono TEXT UNIQUE NOT NULL,
    canale_provenienza TEXT CHECK(canale_provenienza IN ('whatsapp', 'telegram', 'manuale')),
    indirizzo_spedizione TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prodotti (
    sku TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    descrizione TEXT,
    prezzo_vendita REAL NOT NULL,
    costo_acquisto REAL NOT NULL,
    quantita_stock INTEGER NOT NULL CHECK(quantita_stock >= 0),
    link_foto_originale TEXT,
    link_foto_elaborata TEXT,
    foto_locali TEXT DEFAULT '[]',
    video_url TEXT,
    categoria TEXT,
    taglia_variante TEXT,
    barcode TEXT,
    fornitore TEXT,
    note TEXT,
    custom_fields TEXT DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appuntamenti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER,
    data_inizio TEXT NOT NULL,
    data_fine TEXT NOT NULL,
    stato TEXT CHECK(stato IN ('in_attesa', 'confermato', 'disdetto')) DEFAULT 'in_attesa',
    note_ai TEXT,
    FOREIGN KEY(cliente_id) REFERENCES clienti(id)
);

CREATE TABLE IF NOT EXISTS ordini (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER,
    stato_ordine TEXT CHECK(stato_ordine IN ('in_attesa_pagamento', 'pagato', 'spedito', 'annullato')),
    totale_ordine REAL NOT NULL,
    link_pagamento_stripe TEXT,
    data_ordine TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(cliente_id) REFERENCES clienti(id)
);

CREATE TABLE IF NOT EXISTS dettagli_ordine (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ordine_id INTEGER,
    sku_prodotto TEXT,
    quantita INTEGER NOT NULL CHECK(quantita > 0),
    prezzo_unitario REAL NOT NULL,
    FOREIGN KEY(ordine_id) REFERENCES ordini(id),
    FOREIGN KEY(sku_prodotto) REFERENCES prodotti(sku)
);

CREATE TABLE IF NOT EXISTS log_memoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER,
    chiave_preferenza TEXT NOT NULL,
    valore_preferenza TEXT NOT NULL,
    data_aggiornamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(cliente_id) REFERENCES clienti(id)
);

CREATE VIRTUAL TABLE IF NOT EXISTS prodotti_fts USING fts5(
    sku,
    nome,
    descrizione,
    categoria,
    custom_fields,
    content=prodotti,
    content_rowid=rowid
);

CREATE TRIGGER IF NOT EXISTS prodotti_fts_ai AFTER INSERT ON prodotti BEGIN
    INSERT INTO prodotti_fts(rowid, sku, nome, descrizione, categoria, custom_fields)
    VALUES (new.rowid, new.sku, new.nome, COALESCE(new.descrizione, ''), COALESCE(new.categoria, ''), COALESCE(new.custom_fields, '{}'));
END;

CREATE TRIGGER IF NOT EXISTS prodotti_fts_ad AFTER DELETE ON prodotti BEGIN
    INSERT INTO prodotti_fts(prodotti_fts, rowid, sku, nome, descrizione, categoria, custom_fields)
    VALUES ('delete', old.rowid, old.sku, old.nome, COALESCE(old.descrizione, ''), COALESCE(old.categoria, ''), COALESCE(old.custom_fields, '{}'));
END;

CREATE TRIGGER IF NOT EXISTS prodotti_fts_au AFTER UPDATE ON prodotti BEGIN
    INSERT INTO prodotti_fts(prodotti_fts, rowid, sku, nome, descrizione, categoria, custom_fields)
    VALUES ('delete', old.rowid, old.sku, old.nome, COALESCE(old.descrizione, ''), COALESCE(old.categoria, ''), COALESCE(old.custom_fields, '{}'));
    INSERT INTO prodotti_fts(rowid, sku, nome, descrizione, categoria, custom_fields)
    VALUES (new.rowid, new.sku, new.nome, COALESCE(new.descrizione, ''), COALESCE(new.categoria, ''), COALESCE(new.custom_fields, '{}'));
END;
";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Product {
    pub sku: String,
    pub nome: String,
    pub descrizione: Option<String>,
    pub prezzo_vendita: f64,
    pub costo_acquisto: f64,
    pub quantita_stock: i32,
    pub link_foto_originale: Option<String>,
    pub link_foto_elaborata: Option<String>,
    pub foto_locali: String,
    pub video_url: Option<String>,
    pub categoria: Option<String>,
    pub taglia_variante: Option<String>,
    pub barcode: Option<String>,
    pub fornitore: Option<String>,
    pub note: Option<String>,
    pub custom_fields: String,
}

pub fn select_all_products(conn: &Mutex<Connection>) -> Result<Vec<Product>, String> {
    let conn = conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT sku, nome, descrizione, prezzo_vendita, costo_acquisto, quantita_stock,
                    link_foto_originale, link_foto_elaborata, foto_locali, video_url,
                    categoria, taglia_variante, barcode, fornitore, note, custom_fields
             FROM prodotti ORDER BY sku",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(Product {
                sku: row.get(0)?,
                nome: row.get(1)?,
                descrizione: row.get(2)?,
                prezzo_vendita: row.get(3)?,
                costo_acquisto: row.get(4)?,
                quantita_stock: row.get(5)?,
                link_foto_originale: row.get(6)?,
                link_foto_elaborata: row.get(7)?,
                foto_locali: row.get::<_, String>(8).unwrap_or_else(|_| "[]".to_string()),
                video_url: row.get(9)?,
                categoria: row.get(10)?,
                taglia_variante: row.get(11)?,
                barcode: row.get(12)?,
                fornitore: row.get(13)?,
                note: row.get(14)?,
                custom_fields: row.get::<_, String>(15).unwrap_or_else(|_| "{}".to_string()),
            })
        })
        .map_err(|e| e.to_string())?;
    let mut products = Vec::new();
    for row in rows {
        products.push(row.map_err(|e| e.to_string())?);
    }
    Ok(products)
}

pub fn insert_product(conn: &Mutex<Connection>, p: &Product) -> Result<(), String> {
    let conn = conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO prodotti (sku, nome, descrizione, prezzo_vendita, costo_acquisto, quantita_stock,
         link_foto_originale, link_foto_elaborata, foto_locali, video_url, categoria, taglia_variante,
         barcode, fornitore, note, custom_fields)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)",
        rusqlite::params![
            p.sku, p.nome, p.descrizione, p.prezzo_vendita, p.costo_acquisto, p.quantita_stock,
            p.link_foto_originale, p.link_foto_elaborata, p.foto_locali, p.video_url,
            p.categoria, p.taglia_variante, p.barcode, p.fornitore, p.note, p.custom_fields
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn update_product(conn: &Mutex<Connection>, p: &Product) -> Result<(), String> {
    let conn = conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE prodotti SET nome=?2, descrizione=?3, prezzo_vendita=?4, costo_acquisto=?5,
         quantita_stock=?6, link_foto_originale=?7, link_foto_elaborata=?8, foto_locali=?9,
         video_url=?10, categoria=?11, taglia_variante=?12, barcode=?13, fornitore=?14,
         note=?15, custom_fields=?16, updated_at=CURRENT_TIMESTAMP
         WHERE sku=?1",
        rusqlite::params![
            p.sku, p.nome, p.descrizione, p.prezzo_vendita, p.costo_acquisto, p.quantita_stock,
            p.link_foto_originale, p.link_foto_elaborata, p.foto_locali, p.video_url,
            p.categoria, p.taglia_variante, p.barcode, p.fornitore, p.note, p.custom_fields
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn delete_product(conn: &Mutex<Connection>, sku: &str) -> Result<usize, String> {
    let conn = conn.lock().map_err(|e| e.to_string())?;
    let rows = conn.execute("DELETE FROM prodotti WHERE sku=?1", [sku])
        .map_err(|e| e.to_string())?;
    Ok(rows)
}

pub fn bulk_delete_products(conn: &Mutex<Connection>, skus: &[String]) -> Result<usize, String> {
    let conn = conn.lock().map_err(|e| e.to_string())?;
    let mut deleted = 0usize;
    let tx = conn.unchecked_transaction().map_err(|e| e.to_string())?;
    for sku in skus {
        let res = tx.execute("DELETE FROM prodotti WHERE sku = ?1", [sku]);
        if let Ok(rows) = res {
            deleted += rows;
        }
    }
    tx.commit().map_err(|e| e.to_string())?;
    Ok(deleted)
}

pub fn bulk_upsert_products(conn: &Mutex<Connection>, products: &[Product], mode: &str) -> Result<usize, String> {
    let conn = conn.lock().map_err(|e| e.to_string())?;
    let sql = match mode {
        "replace" => "INSERT OR REPLACE INTO prodotti (sku, nome, descrizione, prezzo_vendita, costo_acquisto, quantita_stock, link_foto_originale, link_foto_elaborata, foto_locali, video_url, categoria, taglia_variante, barcode, fornitore, note, custom_fields) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)",
        _ => "INSERT OR IGNORE INTO prodotti (sku, nome, descrizione, prezzo_vendita, costo_acquisto, quantita_stock, link_foto_originale, link_foto_elaborata, foto_locali, video_url, categoria, taglia_variante, barcode, fornitore, note, custom_fields) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)",
    };
    let mut upserted = 0usize;
    let tx = conn.unchecked_transaction().map_err(|e| e.to_string())?;
    for p in products {
        let res = tx.execute(
            sql,
            rusqlite::params![
                p.sku, p.nome, p.descrizione, p.prezzo_vendita, p.costo_acquisto, p.quantita_stock,
                p.link_foto_originale, p.link_foto_elaborata, p.foto_locali, p.video_url,
                p.categoria, p.taglia_variante, p.barcode, p.fornitore, p.note, p.custom_fields
            ],
        );
        if let Ok(rows) = res {
            if rows > 0 {
                upserted += 1;
            }
        }
    }
    tx.commit().map_err(|e| e.to_string())?;
    Ok(upserted)
}

pub fn bulk_insert_products(conn: &Mutex<Connection>, products: &[Product]) -> Result<usize, String> {
    let conn = conn.lock().map_err(|e| e.to_string())?;
    let mut inserted = 0usize;
    let tx = conn.unchecked_transaction().map_err(|e| e.to_string())?;
    for p in products {
        let res = tx.execute(
            "INSERT OR IGNORE INTO prodotti (sku, nome, descrizione, prezzo_vendita, costo_acquisto, quantita_stock,
             link_foto_originale, link_foto_elaborata, foto_locali, video_url, categoria, taglia_variante,
             barcode, fornitore, note, custom_fields)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)",
            rusqlite::params![
                p.sku, p.nome, p.descrizione, p.prezzo_vendita, p.costo_acquisto, p.quantita_stock,
                p.link_foto_originale, p.link_foto_elaborata, p.foto_locali, p.video_url,
                p.categoria, p.taglia_variante, p.barcode, p.fornitore, p.note, p.custom_fields
            ],
        );
        if let Ok(rows) = res {
            if rows > 0 {
                inserted += 1;
            }
        }
    }
    tx.commit().map_err(|e| e.to_string())?;
    Ok(inserted)
}

pub fn db_integrity_check(conn: &Mutex<Connection>) -> Result<bool, String> {
    let conn = conn.lock().map_err(|e| e.to_string())?;
    let result: String = conn
        .query_row("PRAGMA integrity_check", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    Ok(result == "ok")
}

pub fn reset_database(conn: &Mutex<Connection>, app_data_dir: &Path) -> Result<(), String> {
    let db_path = app_data_dir.join(DB_FILE);
    
    // CRITICAL FIX: Actually close the file handle by swapping with an in-memory connection.
    // On Windows, you cannot delete a file while it's open.
    {
        let mut locked = conn.lock().map_err(|e| e.to_string())?;
        let in_memory = Connection::open_in_memory().map_err(|e| e.to_string())?;
        let old_conn = std::mem::replace(&mut *locked, in_memory);
        drop(old_conn); // This closes the file handle on stitchos_erp.db!
        drop(locked); // Release the lock so we can manipulate the file
    }
    
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }
    
    // Also delete WAL and SHM files to ensure a completely fresh start
    let wal_path = db_path.with_extension("db-wal");
    let shm_path = db_path.with_extension("db-shm");
    if wal_path.exists() {
        let _ = std::fs::remove_file(&wal_path);
    }
    if shm_path.exists() {
        let _ = std::fs::remove_file(&shm_path);
    }
    
    let new_conn = Connection::open(&db_path).map_err(|e| format!("Cannot create new DB: {}", e))?;
    new_conn.execute_batch("PRAGMA foreign_keys = ON;").map_err(|e| e.to_string())?;
    new_conn.execute_batch(DDL).map_err(|e| e.to_string())?;
    new_conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;").map_err(|e| e.to_string())?;
    
    let mut locked = conn.lock().map_err(|e| e.to_string())?;
    let _ = std::mem::replace(&mut *locked, new_conn);
    drop(locked);
    
    Ok(())
}

/// Recovers a corrupted database by attempting to dump and recreate it.
/// Falls back to creating a fresh database if dump fails.
pub fn recover_database(app_data_dir: &Path) -> Result<Connection, String> {
    use std::time::{SystemTime, UNIX_EPOCH};
    
    let db_path = app_data_dir.join(DB_FILE);
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    
    // Create backup of corrupted file
    let backup_path = app_data_dir.join(format!("stitchos_erp_backup_{}.db", timestamp));
    if db_path.exists() {
        std::fs::copy(&db_path, &backup_path)
            .map_err(|e| format!("Cannot backup corrupted DB: {}", e))?;
    }
    
    // Try to extract data from corrupted DB by opening with recovery pragmas
    let temp_conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    let _ = temp_conn.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);");
    let _ = temp_conn.execute_batch("PRAGMA recovery_mode = 1;");
    drop(temp_conn);
    
    // Re-check integrity
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    let healthy: String = conn
        .query_row("PRAGMA integrity_check", [], |row| row.get(0))
        .unwrap_or_else(|_| "error".into());
    
    if healthy == "ok" {
        conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;").map_err(|e| e.to_string())?;
        return Ok(conn);
    }
    
    // If still corrupted, create fresh database
    drop(conn);
    
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }
    let wal_path = db_path.with_extension("db-wal");
    let shm_path = db_path.with_extension("db-shm");
    if wal_path.exists() {
        let _ = std::fs::remove_file(&wal_path);
    }
    if shm_path.exists() {
        let _ = std::fs::remove_file(&shm_path);
    }
    
    let fresh_conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    fresh_conn.execute_batch("PRAGMA foreign_keys = ON;").map_err(|e| e.to_string())?;
    fresh_conn.execute_batch(DDL).map_err(|e| e.to_string())?;
    fresh_conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;").map_err(|e| e.to_string())?;
    
    Ok(fresh_conn)
}

pub fn search_products(conn: &Mutex<Connection>, query: &str, limit: i32) -> Result<Vec<Product>, String> {
    let conn = conn.lock().map_err(|e| e.to_string())?;
    let safe_limit = limit.clamp(1, 100);
    let fts_query = query
        .replace('"', "")
        .replace('\'', " ")
        .split_whitespace()
        .filter(|t| !t.is_empty())
        .map(|t| format!("{}*", t))
        .collect::<Vec<_>>()
        .join(" ");
    let fts_result: Result<Vec<Product>, String> = (|| {
        let mut stmt = conn
            .prepare(
                "SELECT p.sku, p.nome, p.descrizione, p.prezzo_vendita, p.costo_acquisto,
                        p.quantita_stock, p.link_foto_originale, p.link_foto_elaborata,
                        p.foto_locali, p.video_url, p.categoria, p.taglia_variante,
                        p.barcode, p.fornitore, p.note, p.custom_fields
                 FROM prodotti p
                 JOIN prodotti_fts fts ON p.rowid = fts.rowid
                 WHERE prodotti_fts MATCH ?1
                 ORDER BY rank
                 LIMIT ?2",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(rusqlite::params![fts_query, safe_limit], |row| {
                Ok(Product {
                    sku: row.get(0)?,
                    nome: row.get(1)?,
                    descrizione: row.get(2)?,
                    prezzo_vendita: row.get(3)?,
                    costo_acquisto: row.get(4)?,
                    quantita_stock: row.get(5)?,
                    link_foto_originale: row.get(6)?,
                    link_foto_elaborata: row.get(7)?,
                    foto_locali: row.get::<_, String>(8).unwrap_or_else(|_| "[]".to_string()),
                    video_url: row.get(9)?,
                    categoria: row.get(10)?,
                    taglia_variante: row.get(11)?,
                    barcode: row.get(12)?,
                    fornitore: row.get(13)?,
                    note: row.get(14)?,
                    custom_fields: row.get::<_, String>(15).unwrap_or_else(|_| "{}".to_string()),
                })
            })
            .map_err(|e| e.to_string())?;
        let mut products = Vec::new();
        for row in rows {
            products.push(row.map_err(|e| e.to_string())?);
        }
        Ok(products)
    })();
    if fts_result.is_ok() {
        return fts_result;
    }
    let pattern = format!("%{}%", query.replace('%', "").replace('_', ""));
    let mut stmt = conn
        .prepare(
            "SELECT sku, nome, descrizione, prezzo_vendita, costo_acquisto, quantita_stock,
                    link_foto_originale, link_foto_elaborata, foto_locali, video_url,
                    categoria, taglia_variante, barcode, fornitore, note, custom_fields
             FROM prodotti
             WHERE nome LIKE ?1
                OR descrizione LIKE ?1
                OR categoria LIKE ?1
                OR custom_fields LIKE ?1
                OR sku LIKE ?1
                OR fornitore LIKE ?1
             ORDER BY sku
             LIMIT ?2",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(rusqlite::params![pattern, safe_limit], |row| {
            Ok(Product {
                sku: row.get(0)?,
                nome: row.get(1)?,
                descrizione: row.get(2)?,
                prezzo_vendita: row.get(3)?,
                costo_acquisto: row.get(4)?,
                quantita_stock: row.get(5)?,
                link_foto_originale: row.get(6)?,
                link_foto_elaborata: row.get(7)?,
                foto_locali: row.get::<_, String>(8).unwrap_or_else(|_| "[]".to_string()),
                video_url: row.get(9)?,
                categoria: row.get(10)?,
                taglia_variante: row.get(11)?,
                barcode: row.get(12)?,
                fornitore: row.get(13)?,
                note: row.get(14)?,
                custom_fields: row.get::<_, String>(15).unwrap_or_else(|_| "{}".to_string()),
            })
        })
        .map_err(|e| e.to_string())?;
    let mut products = Vec::new();
    for row in rows {
        products.push(row.map_err(|e| e.to_string())?);
    }
    Ok(products)
}
