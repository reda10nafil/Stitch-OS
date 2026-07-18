# FILE: 01_shell_layout.md
- **Stato Isolamento**: COMPLETO — Application Shell, sistema di routing e pannelli fissi.
- **System Prompt Blocco Allucinazioni**: Questo file definisce l'architettura rigida dell'involucro desktop. Le dimensioni dei pannelli (64px sidebar, 100vh, h-6 status bar) sono valori immutabili. Il sistema di navigazione NAVIGATION_CHANGE è il solo metodo di transizione tra le interfacce. Non aggiungere routing lato React Router o sistemi di transizione alternativi.

---

## Sezione 1: Specifiche di Backend e Logica dei Dati

### 1.1 Sistema di Routing Interno TypeScript

L'applicazione non utilizza React Router tradizionale. Implementa invece un sistema di routing interno basato su eventi sintetici e un context di stato globale.

```typescript
// Tipi di interfaccia navigabili
type AppInterface = 'calendar' | 'inventory' | 'crm' | 'connectors' | 'billing' | 'dashboard';

// Stato del router
interface RouterState {
    currentInterface: AppInterface;
    previousInterface: AppInterface | null;
    isNavigating: boolean;
    hasUnsavedChanges: boolean;
}

// Evento sintetico di navigazione
interface NavigationEvent {
    type: 'NAVIGATION_CHANGE';
    payload: {
        target: AppInterface;
        source: 'sidebar' | 'keyboard' | 'programmatic';
        timestamp: number;
    };
}
```

### 1.2 Gestione Evento NAVIGATION_CHANGE

Il context di stato espone un metodo `dispatchNavigation(target: AppInterface)` che:
1. Verifica se ci sono operazioni critiche non salvate (`hasUnsavedChanges`)
2. Se `hasUnsavedChanges === true`, intercetta la navigazione e apre una modale di conferma bloccante
3. Se l'utente conferma o non ci sono modifiche in sospeso, aggiorna `currentInterface` e memorizza la precedente

### 1.3 Stati di Blocco della Navigazione

Sono considerate operazioni critiche non salvate:
- Modifica manuale del prezzo di un prodotto senza aver salvato
- Importazione CSV in corso (parser attivo)
- Modifica di un indirizzo di fatturazione senza conferma
- Drag-and-drop di un appuntamento non ancora rilasciato

In questi stati, il flag `hasUnsavedChanges` viene impostato a `true` e qualsiasi tentativo di navigazione apre una `AlertDialog` di Shadcn/ui con il messaggio: *"Sono presenti modifiche non salvate. Sei sicuro di voler lasciare questa pagina?"* con opzioni "Annulla" e "Esci senza salvare".

---

## Sezione 2: Specifiche di Interfaccia Utente (UI/UX)

### 2.1 Anatomia dello Schermo — Wireframe Geometrico

Il layout è un incastro fisso a 3 pannelli. `overflow: hidden` globale su `body`. Scroll indipendente solo nei moduli interni.

```
┌──────────────────────────────────────────────────────┐
│  ┌──────────┐  ┌────────────────────────────────┐   │
│  │          │  │                                │   │
│  │ SIDEBAR  │  │     AREA DI LAVORO             │   │
│  │  64px    │  │     PRINCIPALE (flexibile)      │   │
│  │  icone   │  │     bg-white overflow-hidden    │   │
│  │          │  │     p-6                         │   │
│  │  fissa   │  │                                │   │
│  │  sinistra│  │                                │   │
│  └──────────┘  └────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │  STATUS BAR (100% larghezza, h-6)            │   │
│  │  bg-slate-100 text-slate-500 border-t        │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

**Specifiche pannelli:**

| Pannello | Larghezza | Stile CSS / Tailwind | Contenuti |
|---|---|---|---|
| Sidebar Navigazione Sinistra | 64px (icon-only) | `bg-slate-900 text-white border-r border-slate-800` | Logo aziendale (top), 6 icone navigazione (centro), indicatore stato connessione Ollama (bottom) |
| Area di Lavoro Principale | Flessibile (calcolo dinamico) | `bg-white overflow-hidden p-6` | Contenitore dinamico attivato dal router interno |
| Barra di Stato Inferiore | 100% della larghezza, h-6 | `bg-slate-100 text-slate-500 border-t` | Contatore messaggi in coda FIFO, indicatore latenza AI, pulsante switch Fallback globale |

### 2.2 Sidebar di Navigazione (64px)

La sidebar è un contenitore verticale fisso con:
- **Logo aziendale**: In alto, 32x32px centrato, margine superiore 12px
- **6 icone di navigazione**: Al centro, impilate verticalmente con gap 8px. Ogni icona è 24x24px. Le icone rappresentano: Calendario, Inventario, CRM, Connettori, Fatturazione, Dashboard
- **Indicatore stato connessione**: In basso, un pallino colorato (verde = connesso, rosso = offline) con tooltip "Stato Ollama"

### 2.3 Indicatore Geometrico di Stato Attivo

L'icona attiva è segnalata da:
- Barra verticale blu di 3px di spessore sul bordo sinistro dell'icona (`bg-sky-500`)
- Sfondo icona: opacità 10% (`bg-white/10`)
- Transizione: `transition-all duration-150 ease-in-out`

### 2.4 Status Bar Inferiore (h-6)

Layout orizzontale con tre sezioni allineate:
- **Sinistra**: Contatore coda FIFO (`"Coda: 0"`)
- **Centro**: Indicatore latenza AI (`"AI: 230ms"` con pallino verde/rosso)
- **Destra**: Pulsante `"Switch Fallback Globale"` (testo piccolo, `text-xs`, hover `bg-slate-200`)

---

## Sezione 3: Stati d'Interazione e Logica degli Eventi

### 3.1 Navigazione Sidebar — Click

1. Utente clicca su icona sidebar
2. Sistema verifica `hasUnsavedChanges`
3. Se modifiche in sospeso: apre `AlertDialog` di conferma
   - "Annulla" → resta sull'interfaccia corrente
   - "Esci senza salvare" → procede con `dispatchNavigation()`
4. Se nessuna modifica: aggiorna immediatamente `currentInterface`
5. Il contenitore centrale esegue lo smontaggio del componente precedente e il montaggio del nuovo
6. Indicatore attivo si sposta sulla nuova icona

### 3.2 Navigazione da Tastiera — Ctrl+Tab

1. Sistema cattura l'evento `Ctrl+Tab` a livello finestra Tauri
2. Calcola il prossimo indice ciclico: `(currentIndex + 1) % 6`
3. Applica la stessa logica di `hasUnsavedChanges`
4. Transizione istantanea alla nuova interfaccia

### 3.3 Stato di Blocco Operazione Critica

Quando un pannello interno segnala `hasUnsavedChanges = true`:
- La sidebar NON mostra il cambio di stato attivo fino alla risoluzione
- Il pulsante di navigazione cliccato mostra brevemente un micro-shake (150ms) prima di aprire la modale
- La modale `AlertDialog` è bloccante (non si chiude cliccando fuori)

### 3.4 Ridimensionamento Finestra

La risoluzione minima è 1280x800px. Se la finestra scende sotto questa soglia:
- Un overlay avvisa: *"Risoluzione troppo bassa. Ridimensiona la finestra ad almeno 1280x800px"*
- I controlli interni rimangono funzionali ma possono apparire compressi
- La sidebar rimane sempre a 64px (non collassabile)
