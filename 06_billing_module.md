# FILE: 06_billing_module.md
- **Stato Isolamento**: COMPLETO — Modulo fatturazione, calcolo imponibile/IVA, anteprima di stampa, template termico 80mm.
- **System Prompt Blocco Allucinazioni**: Questo file contiene la specifica integrale del modulo di fatturazione. Le formule di calcolo dell'imponibile e IVA devono essere implementate esattamente come descritte. Il pulsante "Invia e Incolla in Chat" deve attivare la modale di sicurezza bloccante con attesa 3 secondi. I due template (A4 e 80mm termico) sono entrambi obbligatori.

---

## Sezione 1: Specifiche di Backend e Logica dei Dati

### 1.1 Tabelle Ordini e Dettaglio Articoli

```sql
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
```

### 1.2 Calcolo Matematico Imponibile/IVA

Il sistema calcola automaticamente:

**Imponibile** (per ogni riga dettaglio):
```
Imponibile_riga = quantita × prezzo_unitario
```

**Totale Imponibile**:
```
Totale_Imponibile = Σ(Imponibile_riga) per tutte le righe dell'ordine
```

**IVA** (aliquota standard 22%, modificabile da interfaccia):
```
IVA = Totale_Imponibile × 0.22
```

**Totale Complessivo**:
```
Totale_Ordine = Totale_Imponibile + IVA
```
(Eventuali sconti percentuali sul totale vengono applicati prima del calcolo IVA)

### 1.3 Tool MCP — generate_order_documents(ordine_id)

**Firma**: `generate_order_documents(ordine_id: integer) → JSON {fattura_url, packing_list_url}`

L'Agente Vendite chiama questo tool quando rileva che l'utente ha accettato l'acquisto. Il tool:
1. Raccoglie dati da `ordini`, `dettagli_ordine`, `clienti`
2. Genera due file PDF tramite motore di templating HTML-to-PDF offline
3. Salva i file localmente
4. Restituisce i percorsi dei file generati

### 1.4 Motore di Templating HTML-to-PDF

Motore operante interamente offline. Configurabile dalle impostazioni:
- **Logo aziendale**: Upload in alta definizione
- **Ragione sociale**, **Partita IVA**, **Note legali di chiusura fattura**
- **Numerazione progressiva**: Automatica annuale
- **Template**: A4 verticale e 80mm termico continuo

### 1.5 Tracciamento ID

Ogni fattura ha una numerazione progressiva automatica annuale (es. `FATT-2026-0001`). Un codice a barre o QR Code associato all'`ordine_id` viene stampato sulla packing list per la tracciabilità interna di magazzino.

---

## Sezione 2: Specifiche di Interfaccia Utente (UI/UX)

### 2.1 Vista Split-Screen

La schermata è divisa in due sezioni verticali simmetriche:
```
┌──────────────────────────────┬──────────────────────────────────────┐
│  EDITOR DATI (Sinistra)      │  ANTEPRIMA STAMPA (Destra)          │
│                              │                                      │
│  ┌────────────────────────┐ │  ┌────────────────────────────────┐  │
│  │ Ordine #FATT-2026-0001 │ │  │  [Toolbar Zoom/Download/Print] │  │
│  │                        │ │  │  ┌──────────────────────────┐  │  │
│  │ Articoli:              │ │  │  │                          │  │  │
│  │ SKU-001 x2 €20.00      │ │  │  │   FOGLIO A4 VIRTUALE     │  │  │
│  │ SKU-002 x1 €15.00      │ │  │  │   (bg-white shadow-2xl)  │  │  │
│  │                        │ │  │  │                          │  │  │
│  │ Aliquota IVA: [22% ▼]  │ │  │  │   [Logo Aziendale]       │  │  │
│  │ Sconto: [0%]           │ │  │  │   FATTURA                │  │  │
│  │                        │ │  │  │   ...                    │  │  │
│  │ Indirizzo fatturazione:│ │  │  │                          │  │  │
│  │ [___________________]  │ │  │  │                          │  │  │
│  │                        │ │  │  └──────────────────────────┘  │  │
│  │ [Invia e Incolla Chat] │ │  └────────────────────────────────┘  │
│  └────────────────────────┘ │                                      │
└──────────────────────────────┴──────────────────────────────────────┘
```

### 2.2 Toolbar Superiore Anteprima

- Altezza fissa: 40px
- Sfondo: nero opaco (`bg-slate-800`)
- Icone: bianche ad alto contrasto
- Pulsanti: Zoom In, Zoom Out, Download PDF Locale, menu selezione stampante di destinazione

### 2.3 Simulatore Carta Fattura (A4)

- Proporzioni fisse in formato A4 verticale
- Ombra perimetrale pronunciata (`shadow-2xl`)
- Mostra: carta intestata, tabella prezzi, sezione totali calcolati in tempo reale
- Sfondo contenitore: `bg-slate-800` per simulare l'ambiente di stampa

### 2.4 Simulatore Packing List (80mm Termico)

- Layout ridotto ottimizzato per strisce di carta continue da 80mm
- Nasconde dettagli economici (prezzi, IVA, totale)
- Evidenzia in caratteri cubitali neri i codici SKU e le quantità da prelevare dagli scaffali
- Stile: `font-mono text-black` su sfondo bianco, nessuna decorazione

---

## Sezione 3: Stati d'Interazione e Logica degli Eventi

### 3.1 Interruzione di Flusso — Modale di Sicurezza Emissione

Il pulsante "Invia e Incolla in Chat" attiva l'emissione fiscale definitiva. Per prevenire invii accidentali:

1. Clic su "Invia e Incolla in Chat"
2. Apertura modale di sicurezza **bloccante** (non si chiude cliccando fuori)
3. La modale richiede all'operatore di:
   - Digitare la scorciatoia da tastiera **CONFERMA**, oppure
   - Cliccare su un pulsante di convalida **temporizzato** (attivo solo dopo 3 secondi dall'apertura)
4. Trascorsi i 3 secondi il pulsante diventa cliccabile
5. Conferma → emissione effettiva + chiusura modale

### 3.2 Zoom Anteprima

- Zoom In: ingrandisce il rendering del foglio A4 virtuale (scala 100% → 125% → 150%)
- Zoom Out: riduce (scala 150% → 125% → 100%)
- Reset: doppio clic sul foglio ripristina 100%
- Lo zoom NON altera il PDF generato, solo la visualizzazione a schermo

### 3.3 Download PDF

1. Utente clicca "Download PDF Locale"
2. Sistema genera il PDF tramite motore HTML-to-PDF offline
3. Finestra di dialogo nativa di salvataggio file (Tauri dialog)
4. Il PDF viene salvato con nome `FATTURA-{numero_progressivo}.pdf`

### 3.4 Modifica Aliquota IVA e Sconti

1. L'operatore può modificare manualmente l'aliquota IVA dal dropdown (default: 22%)
2. Può applicare sconti percentuali sul totale (es. 10%)
3. Può inserire un indirizzo di fatturazione diverso da quello memorizzato nel CRM
4. L'anteprima destra si aggiorna in tempo reale ad ogni modifica
5. Il calcolo del totale viene ricalcolato istantaneamente
