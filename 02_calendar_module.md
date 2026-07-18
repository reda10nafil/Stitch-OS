# FILE: 02_calendar_module.md
- **Stato Isolamento**: COMPLETO — Modulo calendario, gestione slot orari, tool MCP.
- **System Prompt Blocco Allucinazioni**: Questo file contiene la specifica integrale del modulo calendario. I tool MCP `check_available_slots` e `create_appointment` devono essere implementati esattamente come descritto. I tre stati cromatici dei blocchi (verde, arancione, rosso) sono immutabili. L'animazione shake di collisione è obbligatoria.

---

## Sezione 1: Specifiche di Backend e Logica dei Dati

### 1.1 Schema Tabella Appuntamenti

```sql
CREATE TABLE IF NOT EXISTS appuntamenti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER,
    data_inizio TEXT NOT NULL,            -- Formato ISO8601 YYYY-MM-DD HH:MM:SS
    data_fine TEXT NOT NULL,              -- Formato ISO8601 YYYY-MM-DD HH:MM:SS
    stato TEXT CHECK(stato IN ('in_attesa', 'confermato', 'disdetto')) DEFAULT 'in_attesa',
    note_ai TEXT,
    FOREIGN KEY(cliente_id) REFERENCES clienti(id)
);
```

### 1.2 Tool MCP — check_available_slots(data_richiesta)

**Firma**: `check_available_slots(data: string) → JSON array`

Input: una data in formato `YYYY-MM-DD`.

Logica:
1. Query sulla tabella `appuntamenti` per la data specificata tra le `08:00:00` e le `19:00:00`
2. Sottrae gli slot occupati dalla griglia
3. Calcola i tempi di buffer tra gli slot (impostabile da interfaccia, default 15 minuti)
4. Restituisce un array JSON con gli slot liberi

```sql
-- Query interna per trovare slot occupati in una data
SELECT data_inizio, data_fine FROM appuntamenti
WHERE DATE(data_inizio) = :data
AND stato IN ('in_attesa', 'confermato')
ORDER BY data_inizio ASC;
```

Output esempio:
```json
[
    {"start": "09:00", "end": "09:30", "available": true},
    {"start": "09:45", "end": "10:15", "available": true},
    {"start": "10:30", "end": "11:00", "available": true}
]
```

### 1.3 Tool MCP — create_appointment(cliente_id, timestamp_inizio)

**Firma**: `create_appointment(cliente_id: integer, timestamp_inizio: string) → JSON object`

Logica:
1. Verifica atomica che lo slot non sia stato occupato da un'altra chat concorrente (controllo di atomicità della transazione SQL)
2. Calcola `data_fine` = `data_inizio` + durata predefinita (30 min) + buffer configurato
3. Inserisce il record con stato `'confermato'`
4. Restituisce conferma all'agente

Verifica atomicità:
```sql
BEGIN TRANSACTION;
SELECT COUNT(*) AS conflitti FROM appuntamenti
WHERE data_inizio < :data_fine AND data_fine > :data_inizio
AND stato IN ('in_attesa', 'confermato');
-- Se conflitti = 0, procedi con INSERT
INSERT INTO appuntamenti (cliente_id, data_inizio, data_fine, stato)
VALUES (:cliente_id, :data_inizio, :data_fine, 'confermato');
COMMIT;
```

---

## Sezione 2: Specifiche di Interfaccia Utente (UI/UX)

### 2.1 Layout Schermata Calendario

La schermata si divide in due sezioni macro:

```
┌───────────────────┬──────────────────────────────────────────────┐
│ PANNELLO REGOLE   │           GRIGLIA TEMPORALE                  │
│ (Sinistro)        │          (Centro)                            │
│                   │                                               │
│ ┌───────────────┐ │  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐│
│ │ Buffer: 15min │ │  │  Lun│  Mar│  Mer│  Gio│  Ven│  Sab│  Dom││
│ │ [10][15][30]  │ │  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤│
│ │               │ │  │08:00│     │     │     │     │     │     ││
│ │ Giorni lav.:  │ │  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤│
│ │ ☑ Lun-Ven     │ │  │08:30│     │     │     │     │     │     ││
│ │ ☐ Sab         │ │  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤│
│ │ ☐ Dom         │ │  │09:00│ ████│     │     │     │     │     ││
│ │               │ │  │     │ Mario│     │     │     │     │     ││
│ │ [Filtri]      │ │  │     │09:00│     │     │     │     │     ││
│ │ ☑ Confermati  │ │  │     ├─────┼─────┼─────┼─────┼─────┼─────┤│
│ │ ☑ In attesa   │ │  │09:30│     │     │     │     │     │     ││
│ │               │ │  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤│
│ │ [Fuso orario] │ │  │10:00│     │     │     │     │     │     ││
│ │ Europe/Rome ▼ │ │  └─────┴─────┴─────┴─────┴─────┴─────┴─────┘│
└───────────────────┴──────────────────────────────────────────────┘
```

### 2.2 Griglia Oraria Settimanale

- Base: fullcalendar o shadcn/ui calendar riscritta in TypeScript
- Periodo: Lunedì — Domenica
- Riga: intervallo da 30 minuti ciascuna
- Fascia oraria: 08:00 — 19:00
- Scroll verticale indipendente per la griglia (se il contenuto supera l'altezza)

### 2.3 Stati Cromatici dei Blocchi Appuntamento

I blocchi hanno bordo radius `rounded-md` (4px) e testo interno condensato (Nome Cliente + orario preciso):

| Stato | Classe CSS | Descrizione |
|---|---|---|
| Confermato | `bg-emerald-50 text-emerald-700 border-emerald-200` | Appuntamento confermato dal cliente |
| In attesa | `bg-orange-50 text-orange-700 border-orange-200` | Proposto dall'AI via chat, in attesa di conferma |
| Disdetto | `bg-red-50 text-red-700 border-red-200` | Appuntamento cancellato (opacità 60%) |

### 2.4 Pannello Regole (Sinistro)

Contiene:
- **Selettore buffer**: Pulsanti radio per 10, 15, 30 minuti (default: 15)
- **Checkbox giorni lavorativi**: Lunedì-Venerdì (default on), Sabato (default off), Domenica (default off)
- **Filtri visualizzazione**: "Visualizza solo confermati", "Solo in attesa" (checkbox)
- **Selezione fuso orario**: Dropdown con default "Europe/Rome"
- **Blocco giornata**: Pulsante per bloccare manualmente un'intera giornata (es. ferie)

---

## Sezione 3: Stati d'Interazione e Logica degli Eventi

### 3.1 Hover su Blocco Appuntamento

| Elemento | Trigger | Feedback Visivo |
|---|---|---|
| Blocco Appuntamento | Hover del mouse | Sollevamento visivo tramite ombra `shadow-md` + comparsa micro-icona cancellazione rapida (X) nell'angolo superiore destro |

### 3.2 Drag-and-Drop

| Stato | Trigger | Feedback Visivo |
|---|---|---|
| Trascinamento | Drag attivo (spostamento orario) | Opacità ridotta al 50%; la griglia sottostante evidenzia in grigio chiaro (`bg-slate-100`) gli slot compatibili con la durata del blocco |
| Rilascio (Drop) | Mouse Up su nuovo slot | Apertura immediata di un toast di notifica in basso a destra con indicatore di caricamento e testo: *"Aggiornamento in corso..."* |

### 3.3 Gestione Errore di Collisione — Animazione Shake

Se l'utente trascina manualmente un appuntamento sopra uno slot già occupato:

1. Il backend rifiuta la transazione SQL (controllo atomicità fallito)
2. L'interfaccia esegue un'animazione di sbalzo laterale (**shake animation**) sul blocco
3. Il blocco viene riportato nella posizione di partenza originale
4. Toast di errore rosso: *"Errore: Lo slot selezionato collide con un appuntamento preesistente."*

### 3.4 Creazione Appuntamento da Chat

| Azione Utente/AI | Stato Database | Effetto su UI |
|---|---|---|
| AI propone uno slot via chat | Nessuna modifica (stato volatile) | Indicatore "Slot in pre-analisi" sulla griglia (tratteggiato) |
| Cliente conferma orario | `INSERT INTO appuntamenti ... stato='confermato'` | Blocco orario appare istantaneamente sulla griglia in colore Verde |
| Spostamento manuale via UI | `UPDATE appuntamenti SET data_inizio=...` | Blocco si sposta + icona di notifica inviata lampeggia |

### 3.5 Notifica Cliente dopo Spostamento

Dopo uno spostamento manuale via drag-and-drop, il sistema invia automaticamente una notifica WhatsApp al cliente per informarlo della modifica del suo appuntamento. Un'icona a forma di campana lampeggia sul blocco spostato per 3 secondi a indicare "notifica inviata".
