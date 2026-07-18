# FILE: 07_dashboard_bi.md
- **Stato Isolamento**: COMPLETO — Dashboard Business Intelligence, formule analitiche, widget KPI, grafici SVG.
- **System Prompt Blocco Allucinazioni**: Questo file contiene la specifica integrale della dashboard BI. Le formule matematiche di Capitale Investito, Capitale Totale e Margine di Profitto sono immutabili e devono essere implementate fedelmente. I grafici devono essere implementati come componenti SVG puri (non canvas/WebGL) per garantire fluidità in Tauri. Il grafico a ciambella per i Lost Deals con raggio interno al 60% è obbligatorio.

---

## Sezione 1: Specifiche di Backend e Logica dei Dati

### 1.1 Query Aggregate di Magazzino e Vendite

**A. Capitale Investito (C_I)**
Costo totale sostenuto per la merce in magazzino:
```sql
SELECT SUM(quantita_stock * costo_acquisto) AS capitale_investito FROM prodotti;
```

**B. Capitale Totale Potenziale (C_T)**
Valore monetario complessivo dalla vendita a prezzo pieno di tutte le scorte:
```sql
SELECT SUM(quantita_stock * prezzo_vendita) AS capitale_potenziale FROM prodotti;
```

**C. Margine di Profitto Stimato (M)**
Guadagno netto potenziale in percentuale:
```sql
-- Calcolato lato applicazione
-- M = ((C_T - C_I) / C_T) * 100
SELECT
    SUM(quantita_stock * prezzo_vendita) AS C_T,
    SUM(quantita_stock * costo_acquisto) AS C_I
FROM prodotti;
```
Formula: $$M = \left( \frac{C_T - C_I}{C_T} \right) \times 100$$

### 1.2 Metriche di Latenza Hardware AI

Il sistema monitora le performance di Ollama:
```sql
-- Tabella log_latenze (opzionale, per storicità)
CREATE TABLE IF NOT EXISTS log_latenze (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    latenza_ms INTEGER NOT NULL,
    modello TEXT DEFAULT 'llama3:8b-instruct'
);
```

Metriche esposte in dashboard:
- **Tempo Medio di Risposta AI**: Media delle latenze delle ultime 10 richieste
- **Tasso di Risoluzione Autonoma**: Percentuale di messaggi gestiti senza Fallback Umano
- **Soglia di Allarme**: Se latenza > 3500ms, compare icona di rallentamento hardware

### 1.3 Andamento Storico Vendite

Query per grafico a linee (granularità selezionabile: giorno/settimana/mese):
```sql
-- Per granularità giornaliera
SELECT DATE(data_ordine) AS giorno, SUM(totale_ordine) AS fatturato
FROM ordini
WHERE stato_ordine = 'pagato'
  AND data_ordine >= DATE('now', '-30 days')
GROUP BY DATE(data_ordine)
ORDER BY giorno ASC;

-- Per granularità mensile
SELECT STRFTIME('%Y-%m', data_ordine) AS mese, SUM(totale_ordine) AS fatturato
FROM ordini
WHERE stato_ordine = 'pagato'
  AND data_ordine >= DATE('now', '-12 months')
GROUP BY STRFTIME('%Y-%m', data_ordine)
ORDER BY mese ASC;
```

### 1.4 Top 10 Prodotti Più Richiesti

```sql
SELECT d.sku_prodotto, p.nome, SUM(d.quantita) AS volumi_vendita
FROM dettagli_ordine d
JOIN prodotti p ON d.sku_prodotto = p.sku
JOIN ordini o ON d.ordine_id = o.id
WHERE o.stato_ordine IN ('pagato', 'spedito')
GROUP BY d.sku_prodotto
ORDER BY volumi_vendita DESC
LIMIT 10;
```

---

## Sezione 2: Specifiche di Interfaccia Utente (UI/UX)

### 2.1 Widget KPI Superiori (Carte Finanziarie)

Tre widget rettangolari in linea orizzontale in cima alla pagina:

```
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
│ CAPITALE INVESTITO │  │ VALORE POTENZIALE  │  │ MARGINE LORDO     │
│                   │  │                   │  │                   │
│   € 14.250,00     │  │   € 32.800,00     │  │   56.55 %         │
│                   │  │                   │  │                   │
│ ▲ +130% ricarico  │  │ Valore di acquisto│  │ Efficienza media  │
│   stimato         │  │   delle scorte     │  │   del catalogo    │
└───────────────────┘  └───────────────────┘  └───────────────────┘
```

Ogni card include:
- **Titolo**: testo piccolo `text-xs text-slate-500` in alto
- **Valore principale**: `text-3xl font-bold`
- **Trend/indicatore**: testo piccolo in basso con icona di trend (▲/▼)

### 2.2 Grafico a Ciambella — Lost Deals Analytics

Implementato come componente SVG puro (non canvas/WebGL) per fluidità in Tauri.

- Raggio interno: 60% del raggio totale (donut classico)
- Spicchi con colore dedicato del Design System:

| Categoria Perdita | Colore | HEX |
|---|---|---|
| Prezzo ritenuto troppo alto | Rosso | `#ef4444` |
| Mancanza di stock per taglia/variante | Arancione | `#f97316` |
| Incompatibilità orari appuntamenti | Grigio | `#64748b` |

- Al centro del donut: testo con percentuale totale di perdite
- Tooltip hover su ogni spicchio: mostra categoria e valore assoluto

### 2.3 Tabella Performance Agenti Conversazionali

Sotto l'area dei grafici, tabella di confronto:

| Metrica | Canale WhatsApp | Canale Telegram | Soglia di Allarme UI |
|---|---|---|---|
| Tasso di Risoluzione Autonoma (No Fallback) | 84.2% | 91.5% | Se sotto 70%, testo diventa Rosso Bold |
| Tempo Medio di Risposta (Inferenza Ollama) | 1.4 secondi | 0.9 secondi | Se sopra 3.5s, icona di rallentamento hardware |

### 2.4 Grafico Andamento Storico Vendite

- Tipo: Grafico a linee SVG
- Asse X: tempo (giorno/settimana/mese, selezionabile da dropdown)
- Asse Y: fatturato in Euro
- Linea: colore Sky-600 (`#0284c7`), spessore 2px
- Area sotto la linea: gradiente trasparente → sky-500 al 10%
- Hover sui punti dati: tooltip con data e valore esatto

### 2.5 Grafico Top 10 Prodotti

- Tipo: Grafico a barre verticali SVG
- Asse X: Nome prodotto
- Asse Y: Volumi di vendita
- Barre: colore Emerald-550 (`#10b981`), angoli arrotondati
- Ordinamento: decrescente per volumi di vendita
- Tooltip hover: mostra SKU, nome e quantità totale

---

## Sezione 3: Stati d'Interazione e Logica degli Eventi

### 3.1 Aggiornamento Dati

- I dati della dashboard vengono caricati all'apertura dell'interfaccia
- Pulsante "Aggiorna" (in alto a destra) per refresh manuale
- I KPI cards mostrano uno skeleton loader durante il caricamento

### 3.2 Stato Vuoto

Se non ci sono dati sufficienti per i grafici (es. appena installato):
- Il grafico a ciambella mostra un cerchio grigio pieno con testo: *"Nessun dato vendite disponibile"*
- La tabella performance mostra righe vuote con trattini (`—`)
- I KPI mostrano valore `€ 0,00` o `0 %`

### 3.3 Soglie di Allarme — Highlight Condizionale

| Metrica | Condizione | Effetto UI |
|---|---|---|
| Tasso Risoluzione Autonoma | < 70% | Testo diventa `text-red-500 font-bold` |
| Tempo Medio Risposta | > 3.5 secondi | Icona di rallentamento (tartaruga) accanto al valore, tooltip: *"Latenza AI elevata — Verifica risorse hardware Ollama"* |
| Stock Totale (da KPI Capitale Investito) | Qualsiasi prodotto con stock = 0 | Badge rosso su KPI con testo: *"X prodotti esauriti"* |
