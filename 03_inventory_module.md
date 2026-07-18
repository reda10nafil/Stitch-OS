# FILE: 03_inventory_module.md
- **Stato Isolamento**: COMPLETO — Modulo inventario, catalogo prodotti, importazione file, architettura RAG.
- **System Prompt Blocco Allucinazioni**: Questo file contiene la specifica integrale del modulo inventario. Il parser CSV/Excel deve supportare il mapping colonne utente. La colorazione dinamica dello stock (verde/arancione/rosso) è obbligatoria. Il sistema RAG deve essere implementato come descritto per ridurre il consumo token del 90%.

---

## Sezione 1: Specifiche di Backend e Logica dei Dati

### 1.1 Schema Tabella Prodotti

```sql
CREATE TABLE IF NOT EXISTS prodotti (
    sku TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    descrizione TEXT,
    prezzo_vendita REAL NOT NULL,
    costo_acquisto REAL NOT NULL,
    quantita_stock INTEGER NOT NULL CHECK(quantita_stock >= 0),
    link_foto_originale TEXT,
    link_foto_elaborata TEXT,
    foto_locali TEXT,
    video_url TEXT,
    categoria TEXT,
    taglia_variante TEXT
);
```

### 1.2 Parser CSV/Excel (Backend Rust)

Il parser opera nel thread di backend (Rust o JavaScript/TypeScript in webview) e analizza la struttura del file importato:

1. **Rilevamento formato**: Lettura intestazioni prime 5 righe per determinare delimitatore CSV (`,` `;` `\t`) o struttura XLSX
2. **Estrazione colonne**: Lettura della riga di intestazione per ricavare i nomi colonna
3. **Schermata di Mapping**: L'utente associa visivamente le colonne del file ai campi nativi del database:
   - Colonna file → SKU, Nome, Prezzo, Stock, Link Foto, Categoria, Taglia
4. **Validazione**: Controllo tipi (REAL per prezzi, INTEGER per stock, TEXT per SKU)
5. **Transazione atomica**: Inserimento bulk in una singola transazione SQL con rollback su errore

```sql
BEGIN TRANSACTION;
-- Per ogni riga validata:
INSERT OR REPLACE INTO prodotti (sku, nome, descrizione, prezzo_vendita, costo_acquisto, quantita_stock, link_foto_originale, foto_locali, video_url, categoria, taglia_variante)
VALUES (:sku, :nome, :descrizione, :prezzo_vendita, :costo_acquisto, :quantita_stock, :link_foto_originale, :foto_locali, :video_url, :categoria, :taglia_variante);
COMMIT;
```

### 1.3 Architettura RAG Locale

Per evitare di inserire centinaia di righe di prodotti nel prompt di Ollama (limiti contesto e GPU), il sistema implementa un RAG locale:

```
[Messaggio Cliente: "Avete una borsa rossa?"]
        │
        ▼
[Estrazione Keyword Semantica o Ricerca Full-Text nel DB locale]
        │
        ▼
[Query: SELECT * FROM prodotti WHERE descrizione LIKE '%borsa%' AND colore='rossa']
        │
        ▼
[Iniezione del solo risultato (es: 2 prodotti trovati) nel prompt dell'Agente AI]
```

Il meccanismo riduce l'utilizzo dei token del 90%, permettendo risposte istantanee anche su computer portatili non dedicati.

### 1.4 CRUD Manuali — Aggiunta Prodotto

Per inserimento manuale, una modale raccoglie i campi del prodotto. La validazione lato backend include:
- SKU: obbligatorio, UNIQUE, formato TEXT
- Nome: obbligatorio
- Prezzo vendita: REAL > 0
- Costo acquisto: REAL > 0
- Quantità stock: INTEGER >= 0

---

## Sezione 2: Specifiche di Interfaccia Utente (UI/UX)

### 2.1 Dropzone di Importazione File (Stati Visivi)

In cima alla pagina, area tratteggiata reattiva per importazione file `.csv`, `.xlsx` o link Google Drive.

| Stato | Aspetto | Descrizione |
|---|---|---|
| **Inattivo** | `border-dashed border-slate-300` + icona upload standard | Testo: *"Trascina qui il tuo file .csv o .xlsx o clicca per sfogliare i documenti"* |
| **Dragover** | `border-sky-500 bg-sky-50/50` bordo blu continuo | Icona si anima con movimento sussultorio verso l'alto (cattura file) |
| **Elaborazione** | Scomparsa testi, comparsa barra progresso lineare azzurra | Progresso determinato dalla percentuale di righe lette dal parser |

### 2.2 Data Table Prodotti

Tabella principale con intestazione fissa (sticky header) e paginazione a piè di pagina.

Struttura colonne:
```
┌────────┬──────────────┬───────────┬────────┬──────────┬──────────┐
│  Foto  │  SKU (Codice)│ Nome & Cat│ Prezzo │  Qtà     │  Azioni  │
│        │              │           │ Vendita│  Stock   │          │
├────────┼──────────────┼───────────┼────────┼──────────┼──────────┤
│  □□□□  │  SKU-001     │  Nome     │ €0,00  │  Badge   │  ...     │
│ 32x32  │  font-mono   │  grassetto│  destra│  colore  │  icona   │
│  round │              │  grigio   │        │  dinamic │          │
└────────┴──────────────┴───────────┴────────┴──────────┴──────────┘
```

Specifiche colonne:
- **Foto**: Miniatura quadrata 32x32px con bordi arrotondati
- **SKU**: `font-mono text-slate-500`, allineamento sinistra
- **Nome & Categoria**: Testo primario in grassetto, sotto testo grigio piccolo indicante la categoria merceologica
- **Prezzo Vendita**: Valore formattato in valuta locale (€ 0,00), allineamento destra
- **Quantità Stock**: Badge colorato dinamicamente in base al valore numerico
- **Azioni**: Pulsante icona con tre punti (`...`) per aprire il DropdownMenu

Paginazione a piè di pagina: controlli "Indietro", "Avanti", selettore righe per pagina (10, 25, 50, 100).

### 2.3 Colorazione Dinamica Stock

| Soglia | Colore Badge | Classe CSS |
|---|---|---|
| Stock > 10 (abbondante) | Verde | `bg-emerald-100 text-emerald-800` |
| Stock ≤ 5 (esaurimento) | Arancione | `bg-orange-100 text-orange-800` |
| Stock = 0 (esaurito) | Rosso lampeggiante | `bg-red-100 text-red-800 animate-pulse` |

### 2.4 Dropdown Menu Azioni

Clic sul pulsante `...` apre un `DropdownMenu` di Shadcn/ui con tre opzioni:

1. **Modifica Rapida Stock**: Trasforma la cella della quantità in un input numerico modificabile in linea
2. **Ottimizza Immagine con AI**: Disattiva la riga con spinner di caricamento, invia foto a API Higgsfield/Nanobanana, sostituisce immagine con variante elaborata
3. **Elimina Record**: Apre modale alert distruttiva con sfondo rosso per conferma rimozione definitiva

---

## Sezione 3: Stati d'Interazione e Logica degli Eventi

### 3.1 Importazione File — Flusso Completo

1. Utente trascina file sulla dropzone (o clicca per sfogliare)
2. Dropzone passa a stato Dragover con bordo blu e animazione icona
3. Al rilascio: stato Elaborazione con barra progresso
4. Parser analizza struttura e mostra schermata di Mapping Colonne (se necessario)
5. Utente conferma mapping → transazione bulk INSERT
6. Barra progresso raggiunge 100% → messaggio di successo: *"Importazione completata: X prodotti inseriti"*
7. Data Table si aggiorna automaticamente con i nuovi record

### 3.2 Modifica Rapida Stock Inline

1. Utente clicca "Modifica Rapida Stock" dal menu azioni
2. Cella quantità diventa un `<input type="number">` con focus automatico
3. Utente modifica valore e preme Enter
4. Backend esegue `UPDATE prodotti SET quantita_stock = :valore WHERE sku = :sku`
5. Input scompare, valore aggiornato visibile, toast verde: *"Stock aggiornato"*
6. Se valore = 0, il badge diventa rosso lampeggiante immediatamente

### 3.3 Ottimizzazione Immagine con AI

1. Utente clicca "Ottimizza Immagine con AI"
2. Riga prodotto si disabilita visivamente (opacità 50%) con spinner di caricamento
3. Backend invia `link_foto_originale` alle API esterne (Higgsfield AI Studio o Nanobanana Pro) con comando di trasformazione (Ghost Mannequin / On-Model Street Style)
4. Al ritorno: `UPDATE prodotti SET link_foto_elaborata = :nuovo_link WHERE sku = :sku`
5. La miniatura in tabella si aggiorna con la nuova immagine
6. Riga torna attiva

### 3.4 Eliminazione Record

1. Utente clicca "Elimina Record"
2. Modale distruttiva: sfondo rosso, icona warning, testo *"Sei sicuro di voler eliminare [nome prodotto]? Operazione irreversibile."*
3. Bottoni: "Annulla" (neutro) e "Elimina definitivamente" (red)
4. Conferma → `DELETE FROM prodotti WHERE sku = :sku`
5. Riga scompare con animazione fade-out (300ms)
6. Toast: *"Prodotto eliminato con successo"*
