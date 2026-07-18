# FILE: 00_global_rules.md
- **Stato Isolamento**: COMPLETO — Regole globali e fondazioni di sistema.
- **System Prompt Blocco Allucinazioni**: Questo file contiene le specifiche esatte di setup infrastrutturale. Non alterare, riassumere o reinterpretare i comandi di inizializzazione, i valori cromatici, le scale tipografiche, le hotkey o le soglie di timeout qui definiti. Eventuali modifiche devono essere autorizzate esplicitamente dal prompt master.

---

## Sezione 1: Specifiche di Backend e Logica dei Dati

### 1.1 Setup Ambiente Tauri

L'applicazione usa il framework **Tauri Desktop** con:
- **Backend**: Rust Core + database SQLite locale
- **Frontend**: React con TypeScript e Tailwind CSS
- **Target Risoluzione Minima**: 1280x800px HD

Il backend Rust espone comandi IPC per ogni operazione CRUD. Il frontend React comunica tramite il bridge `@tauri-apps/api`.

### 1.2 Inizializzazione Database SQLite

Il database locale è un file SQLite opzionalmente cifrato. All'avvio dell'applicazione, eseguire il DDL completo abilitando i vincoli di Foreign Key:

```sql
PRAGMA foreign_keys = ON;

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
    categoria TEXT,
    taglia_variante TEXT
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
```

### 1.3 Connessione a Ollama Locale

Il sistema si connette all'endpoint Ollama locale su `localhost:11434`. Il modello predefinito è `Llama-3-8B-Instruct` o `Phi-3-Medium`. La connessione viene stabilita all'avvio dell'applicazione e mantiene un pool di richieste serializzate.

Parametri di connessione:
- Endpoint: `http://localhost:11434/api/generate`
- Modello: configurabile da interfaccia (default: `llama3:8b-instruct`)
- Timeout richiesta: 30 secondi
- Max token risposta: 2048

### 1.4 Coda FIFO dei Messaggi

Per prevenire la saturazione della VRAM/RAM dovuta a richieste concorrenti verso Ollama, il sistema implementa una coda **FIFO (First-In, First-Out)**:

```
[Messaggio in arrivo] → [Coda FIFO in memoria] → [Loop esecuzione]: estrae 1 messaggio → [Inferenza Ollama] → [Invia risposta] → [Prossimo messaggio]
```

Specifiche di implementazione:
- Struttura dati: Array/Queue in memoria (non persistente su DB)
- Loop esecuzione: `setInterval` o loop Rust asincrono che processa un messaggio alla volta
- Se la coda supera 50 messaggi, l'interfaccia mostra un warning di sovraccarico nella Status Bar
- Priorità: FIFO stretto (nessuna riorganizzazione)

---

## Sezione 2: Specifiche di Interfaccia Utente (UI/UX)

### 2.1 Design System Core — Palette Colori e Token Semantici

Scheme: Tailwind Slate/Blue desaturato per lunghe sessioni d'uso. Contrasto minimo 4.5:1.

| Token | HEX | Classe Tailwind | Utilizzo |
|---|---|---|---|
| Background Canvas | `#0f172a` | `bg-slate-900` | Intestazioni macro, barre navigazione, testi primari |
| Brand Primary | `#0284c7` | `bg-sky-600` | Bottoni attivi, stati selezionati, focus operativi |
| Success Token | `#10b981` | `bg-emerald-550` | Appuntamenti confermati, stock abbondante, ordini pagati |
| Warning Token | `#ea580c` | `bg-orange-600` | Stati in attesa, scorte sotto 5 unità |
| Destructive Token | `#ef4444` | `bg-red-500` | Fallback Umano, ordini annullati, alert bloccanti |
| Muted Surface | `#f8fafc` | `bg-slate-50` | Griglie dati, righe alternate tabelle, aree disabilitate |

### 2.2 Scala Tipografica Radicale (Font: Inter / Segoe UI)

Base: 10pt ottimizzato per 96 DPI.

| Token | Dimensione (pt / px) | Peso (Weight) | Contesto |
|---|---|---|---|
| `font-title-h1` | 17pt / 22.5px | Bold (700) | Titolo principale di schermata |
| `font-title-h2` | 12.5pt / 16.5px | SemiBold (600) | Sotto-sezioni, titoli modali, testate tabelle |
| `font-body` | 10pt / 13.3px | Regular (400) | Testi lettura, messaggi chat, descrizioni |
| `font-mono` | 8.5pt / 11.3px | Regular (400) | Codici SKU, stringhe DDL, timestamp ISO |

### 2.3 Focus Ring (Accessibilità WCAG 2.1 AA)

Ogni elemento interattivo deve mostrare un anello di focus visibile:
- Classe Tailwind: `focus:ring-2 focus:ring-sky-500 focus:ring-offset-1`
- Spessore: 2px
- Distacco dall'elemento: 1px
- Colore: `#0284c7` (Sky-600)
- Vietato sopprimere il focus ring senza alternativa visiva equivalente

### 2.4 Hotkeys Globali (Tastiera)

L'applicazione cattura eventi tastiera a livello di finestra Tauri:

| Scorciatoia | Azione |
|---|---|
| `Ctrl + N` | Apri modale nuovo prodotto/appuntamento (in base all'interfaccia attiva) |
| `Ctrl + F` | Focus sul campo di ricerca principale (CRM o Inventario) |
| `Ctrl + Tab` | Rotazione ciclica in avanti tra le 6 interfacce |
| `Esc` | Chiude modali, dropdown o menu contestuali aperti |

---

## Sezione 3: Stati d'Interazione e Logica degli Eventi

### 3.1 Stato Connessione Ollama

La Status Bar inferiore mostra l'indicatore di connessione a Ollama:
- **Connesso**: Icona verde + latenza in millisecondi (es. `"AI: 230ms"`)
- **Disconnesso**: Icona rossa + testo `"AI Offline — Fallback Umano Attivo"`
- **Timeout**: Se la richiesta supera 30 secondi, scatta il timeout e il messaggio viene riaccodato con priorità normale

### 3.2 Indicatore Coda FIFO

La Status Bar mostra un contatore dei messaggi in coda:
- `"Coda: 0"` (nessun messaggio in attesa)
- `"Coda: 3"` (messaggi in attesa di elaborazione)
- Se ≥ 50, background della status bar diventa `bg-orange-100` con testo `"Coda: 52 — Sovraccarico"`

### 3.3 Fallback Umano Globale

Nella Status Bar, un pulsante `"Switch Fallback Globale"` permette all'operatore di disattivare manualmente l'AI per tutti i canali contemporaneamente. Quando attivo:
- L'indicatore Ollama diventa rosso
- Tutti i messaggi in arrivo vengono inoltrati direttamente alla chat del CRM senza elaborazione AI
- L'operatore umano risponde manualmente
