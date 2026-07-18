# 09 — Riferimento Schermate Stitch (Design System Velocity Enterprise)

> **Attenzione**: Questo documento è il ponte tra i moduli Markdown (00–08) e gli asset visivi reali del progetto su Stitch MCP.  
> **Tutte le schermate, i token di design e i codici HTML generati** devono essere usati come **riferimento vincolante** per l'implementazione frontend (React/TypeScript su Tauri).

---

## Cartella Asset

Tutti i file scaricati da Stitch MCP risiedono in:

```
moduli/assets_stitch/
├── screenshots/          # Screenshot PNG di ogni schermata
│   ├── 77b22081_calendario_gestione_slot.png
│   ├── 65305208_inventario_data_table.png
│   ├── 0022017b_chat_crm_memory_explorer.png
│   ├── 77fba250_hub_connettori_pairing_qr.png
│   ├── 59f97aba_gestione_pagamenti_billing.png
│   ├── b2e7f9b5_fatturazione_anteprima_stampa.png
│   ├── 52cc8a51_dashboard_bi_analytics.png
│   ├── 8db55910_configurazione_agenti_ai.png
│   ├── 01fa68cd_impostazioni_sistema.png
│   ├── bb20fb64_configurazione_profilo_documenti.png
│   ├── 59c40b7e_inventario_nav_aggiornata.png
│   ├── 3ab012b1_dashboard_bi_nav_aggiornata.png
│   └── 00443046_chat_crm_nav_aggiornata.png
└── html/                # Codice HTML generato da Stitch AI
    ├── 77b22081_calendario_gestione_slot.html
    ├── 65305208_inventario_data_table.html
    ├── 0022017b_chat_crm_memory_explorer.html
    ├── 77fba250_hub_connettori_pairing_qr.html
    ├── 59f97aba_gestione_pagamenti_billing.html
    └── ... (ulteriori HTML disponibili con refresh credential)
```

---

## Mappatura Schermate ↔ Moduli

| ID Schermo | Nome Schermata | Modulo Collegato | File Asset |
|---|---|---|---|
| `77b22081` | Calendario Gestione Slot | `02_calendar_module.md` | calendario_gestione_slot.* |
| `65305208` | Inventario & Data Table | `03_inventory_module.md` | inventario_data_table.* |
| `59c40b7e` | Inventario (Nav Aggiornata) | `03_inventory_module.md` | inventario_nav_aggiornata.* |
| `0022017b` | Chat CRM & Memory Explorer | `04_crm_chat_module.md` | chat_crm_memory_explorer.* |
| `00443046` | Chat CRM (Nav Aggiornata) | `04_crm_chat_module.md` | chat_crm_nav_aggiornata.* |
| `77fba250` | Hub Connettori & Pairing QR | `05_connectors_hub.md` | hub_connettori_pairing_qr.* |
| `59f97aba` | Gestione Pagamenti & Billing | `06_billing_module.md` | gestione_pagamenti_billing.* |
| `b2e7f9b5` | Fatturazione & Anteprima Stampa | `06_billing_module.md` | fatturazione_anteprima_stampa.* |
| `52cc8a51` | Dashboard BI & Analytics AI | `07_dashboard_bi.md` | dashboard_bi_analytics.* |
| `3ab012b1` | Dashboard BI (Nav Aggiornata) | `07_dashboard_bi.md` | dashboard_bi_nav_aggiornata.* |
| `8db55910` | Configurazione Agenti AI | `00_global_rules.md` | configurazione_agenti_ai.* |
| `01fa68cd` | Impostazioni di Sistema | `00_global_rules.md` / `01_shell_layout.md` | impostazioni_sistema.* |
| `bb20fb64` | Configurazione Profilo & Documenti | `00_global_rules.md` | configurazione_profilo_documenti.* |

---

## Design System "Velocity Enterprise" (Asset `24e416e5`)

I token di design da applicare **obbligatoriamente** a ogni componente:

### Palette Colori
- **Slate-900** (#0F172A) — Sfondo sidebar, header, testi primari
- **Sky-600** (#0284C7) — Accent primario, hover, link, focus ring
- **Emerald-550** (#059669) — Accent secondario, successi, badge attivi
- Neutrals calibrati per sfondi card, bordi, divider

### Tipografia
- Font primario: **Inter** (UI)
- Fallback: **Segoe UI** (Windows)
- Scala: 12/14/16/18/24/32/48px

### Layout
- **Sidebar**: 240px espansa, collassabile a 64px (icon-only)
- **Header**: fisso, 56px
- **Contenuto**: area fluida con padding 24px
- **Status bar**: 24px in fondo

### Componenti Atomic Design
- Bottoni, input, toggle, chip, badge, card, modali, tooltip, dropdown, data table

---

## Regole di Integrazione nello Sviluppo

1. **Fedeltà visiva**: Ogni schermata implementata DEVE corrispondere pixel-for-pixel allo screenshot in `assets_stitch/screenshots/`. Scostamenti solo se specificati nei moduli 00–08.

2. **Codice HTML di riferimento**: I file in `assets_stitch/html/` contengono il markup generato da Stitch AI. Usali come **boilerplate** per la struttura dei componenti React, ma **adatta** a:
   - Componenti funzionali React con TypeScript
   - Styling Tailwind CSS allineato ai token del Design System
   - Binding dati reali (non mock) verso Tauri/Rust backend

3. **Design System first**: Tutti i token cromatici, spaziature, font e breakpoint sono definiti in `00_global_rules.md` e DEVONO corrispondere al Design System "Velocity Enterprise".

4. **Sidebar variant screens**: Per Inventario, Dashboard BI e Chat CRM esistono versioni "Nav Aggiornata" (sidebar 240px). Usa queste come riferimento per lo stato espanso del layout a 3 pannelli (`01_shell_layout.md`).

---

## Comandi Stitch MCP Rilevanti

```json
{
  "projectId": "17032772824832729842",
  "assetId": "24e416e5533449ffb8ee2f7e0c8074d7",
  "endpoint": "https://stitch.googleapis.com/mcp",
  "apiKey": "<MASKED>"
}
```

| Comando | Scopo |
|---|---|
| `list_screens` | Elenca tutte le 13 schermate del progetto |
| `get_screen` | Dettagli di una singola schermata (ID) |
| `list_design_systems` | Elenca design system disponibili |
| `get_project` | Dettagli progetto (⚠ fallisce su projectId diretto) |
| `apply_design_system` | Applica design system a schermate esistenti |
| `edit_screens` | Modifica batch di schermate |

---

## ⚠ Da Fare: Refresh Credentials per Schermate Mancanti

Alcuni screenshot (1555 byte, placeholder) e HTML (0 byte) non sono stati scaricati completamente perché il credential OAuth2 è scaduto tra una richiesta e l'altra.  
Per completare:

1. Rinnovare l'accesso Stitch MCP (nuovo OAuth token o API key)
2. Chiamare `list_screens` per ottenere URL fresh
3. Scaricare i file mancanti in `assets_stitch/screenshots/` e `assets_stitch/html/`

Schermate incomplete:
- `b2e7f9b5` — Fatturazione & Anteprima di Stampa
- `52cc8a51` — Dashboard BI & Analytics AI
- `8db55910` — Configurazione Agenti AI
- `01fa68cd` — Impostazioni di Sistema
- `bb20fb64` — Configurazione Profilo & Documenti
- `59c40b7e` — Inventario (Nav Aggiornata)
- `3ab012b1` — Dashboard BI (Nav Aggiornata)
- `00443046` — Chat CRM (Nav Aggiornata)

---

## Integrazione nei Moduli

Ogni modulo 02–07 contiene già riferimenti a:
- DDL SQLite (tabelle, indici, trigger)
- Tool MCP backend (slot check, CSV parser, RAG, FIFO cron)
- Logger strutturato (module_id, action, stato, timestamp)

**Ora ogni modulo DEVE essere RIALLINEATO** con:
- Lo screenshot corrispondente in `assets_stitch/screenshots/`
- Il markup HTML in `assets_stitch/html/`
- I token del Design System Velocity Enterprise

### Procedura di Allineamento Consigliata
1. Apri screenshot `.png` per il modulo target
2. Identifica scostamenti tra il mockup Stitch e il modulo Markdown
3. Apri HTML `.html` per estrarre struttura e classi CSS
4. Aggiorna il modulo Markdown per riflettere esattamente la UI della schermata
5. Verifica che i token colore, spaziatura e font corrispondano al Design System

---

*Documento generato il 17/06/2026 — da riallineare dopo refresh credential Stitch.*
