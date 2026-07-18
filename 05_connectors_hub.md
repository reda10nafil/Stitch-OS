# FILE: 05_connectors_hub.md
- **Stato Isolamento**: COMPLETO — Hub connettori, integrazione canali chat, modale QR Code WhatsApp.
- **System Prompt Blocco Allucinazioni**: Questo file contiene la specifica integrale dell'Hub Connettori. Il flusso modale QR Code a 3 fasi (Inizializzazione → QR → Sincronizzazione) con contatore 60 secondi è obbligatorio. I toggle switch devono essere implementati come descritto. La mascheramento del token Telegram è obbligatorio.

---

## Sezione 1: Specifiche di Backend e Logica dei Dati

### 1.1 Architettura a Plugin di Connessione

L'applicazione non implementa codice rigido per interfacciarsi con i social/servizi web. Usa un'architettura a **Plugin di Connessione** configurabili singolarmente dall'interfaccia Hub Connettori. Ogni connettore è un modulo indipendente che può essere attivato/disattivato senza influenzare gli altri.

### 1.2 Connettore Telegram Bot

- **API**: Integrazione con API Telegram tramite token BotFather
- **Polling**: Avvio di un processo di polling locale o attivazione di un webhook interno per intercettare messaggi in tempo reale
- **Input**: API Token stringa (es. `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)
- **Stati**: Non configurato → In attesa di verifica → Attivo (polling running) → Errore

### 1.3 Connettore WhatsApp (OpenWA)

- **Libreria**: Integrazione OpenWA (WhatsApp headless)
- **Browser**: Avvio in background di un'istanza invisibile di Chromium tramite Puppeteer
- **Sessione**: Generazione di un QR Code dinamico per l'accoppiamento con lo smartphone aziendale
- **Validità QR**: 60 secondi, con rigenerazione automatica alla scadenza
- **Stati**: Disconnesso → In attesa QR → QR valido → Connesso → Errore

### 1.4 WebSocket Locali

Il sistema apre canali WebSocket locali per la comunicazione in tempo reale tra il backend e il frontend React. Questi WebSocket trasportano:
- Notifiche di nuovi messaggi in arrivo
- Aggiornamenti di stato dei connettori (online/offline)
- Eventi di coda FIFO (nuovo messaggio in attesa, elaborazione completata)

### 1.5 Integrazione Moduli Generativi Immagine

Nella sezione di configurazione MCP dell'Hub, l'utente inserisce le proprie **chiavi API** dei servizi di IA generativa (Higgsfield AI Studio o Nanobanana Pro). Queste chiavi vengono memorizzate in una tabella di configurazione interna e utilizzate dal modulo Inventario per l'ottimizzazione delle immagini prodotto.

---

## Sezione 2: Specifiche di Interfaccia Utente (UI/UX)

### 2.1 Griglia di Card dei Canali

L'interfaccia si presenta come una griglia simmetrica di schede (Card di Shadcn/ui), una per ogni canale:

```
┌──────────────────────┐  ┌──────────────────────────────────────────┐
│  Telegram Bot        │  │  WhatsApp (OpenWA)                       │
│                      │  │                                          │
│  Token: [••••••••]   │  │  Stato: [Disconnesso]                    │
│                      │  │  [⚫ Connetti WhatsApp]                   │
│  [✓ Verifica e       │  │                                          │
│   Attiva Connettore] │  │                                          │
│                      │  │                                          │
│  [● In esecuzione -  │  │                                          │
│   Polling attivo]    │  │                                          │
└──────────────────────┘  └──────────────────────────────────────────┘

┌──────────────────────┐  ┌──────────────────────────────────────────┐
│  AI Generativa       │  │  Altri Connettori (estendibile)         │
│                      │  │                                          │
│  Higgsfield API Key  │  │  [Placeholder per futuri plugin]         │
│  [••••••••••••••]    │  │                                          │
│  Nanobanana API Key  │  │                                          │
│  [••••••••••••••]    │  │                                          │
└──────────────────────┘  └──────────────────────────────────────────┘
```

### 2.2 Card Telegram Bot

- Campo di testo per API Token con **mascheramento caratteri** (type="password")
- Pulsante "Verifica e Attiva Connettore"
- Quando il token è valido: indicatore verde con testo *"In esecuzione — Polling attivo"*
- Quando il token non è valido: indicatore rosso con testo *"Errore di connessione — Verifica il token"*

### 2.3 Card WhatsApp (OpenWA)

- **Interruttore principale** (Toggle Switch) per attivare/disattivare
- Quando l'interruttore viene attivato:
  1. Il sistema avvia in background l'istanza invisibile di Chromium
  2. Apre una finestra modale interna dedicata al flusso di sincronizzazione
- Stato "Connesso": indicatore verde con testo *"Connesso — Operativo"*
- Stato "Disconnesso": indicatore grigio con pulsante "Connetti WhatsApp"

---

## Sezione 3: Stati d'Interazione e Logica degli Eventi

### 3.1 La Modale di Accoppiamento WhatsApp (3 Fasi)

#### Fase 1: Inizializzazione della Sessione
- Spinner di caricamento circolare centrale
- Testo: *"Avvio del server di connessione locale in corso... Attendi."*
- Tutti i pulsanti esterni sono disabilitati
- Durata: tipicamente 2-5 secondi (attesa avvio Chromium)

#### Fase 2: Rendering del Codice QR
- Spinner scompare
- Box quadrato perfetto 250x250px al centro con il QR Code dinamico di OpenWA
- A destra del QR: istruzioni testuali numerate:
  1. *"Apri WhatsApp sul telefono"*
  2. *"Vai in Dispositivi Connessi"*
  3. *"Inquadra lo schermo"*
- **Contatore alla rovescia** (Progress Circle) indica il tempo residuo di validità del QR (60 secondi)
- Allo scadere dei 60 secondi: il QR si rigenera automaticamente e il contatore riparte

#### Fase 3: Sincronizzazione Riuscita
- Al rilevamento dell'accoppiamento dal backend:
- Il QR Code scompare
- Icona di spunta verde gigante animata al centro
- La modale si chiude automaticamente dopo 2 secondi
- La Card principale si aggiorna in "Connesso — Operativo"

### 3.2 Gestione Errori Connettori

| Errore | Comportamento |
|---|---|
| Token Telegram non valido | Card mostra errore rosso, testo: *"Errore di connessione — Verifica il token"* |
| Timeout connessione OpenWA | Card mostra errore: *"Connessione scaduta. Riprova."* |
| QR scaduto (60s) | Rigenerazione automatica del QR, contatore riparte da 60 |
| Chromium crash | Card mostra errore: *"Browser headless non disponibile. Riavvia l'applicazione."* |
| Disconnessione improvvisa | Card passa a "Disconnesso", notifica desktop all'operatore |

### 3.3 Attivazione/Disattivazione Canale

1. Utente clicca sul Toggle Switch di un canale
2. Se attivazione: sistema avvia connessione / polling
3. Se disattivazione: sistema termina connessione / polling in modo pulito
4. I messaggi in arrivo sul canale disattivato vengono accodati ma non processati
5. Alla riattivazione, i messaggi in coda vengono processati in ordine FIFO
