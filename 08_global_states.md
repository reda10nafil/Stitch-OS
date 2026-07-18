# FILE: 08_global_states.md
- **Stato Isolamento**: COMPLETO — Stati globali di interfaccia: caricamento, vuoto, eccezione/connessione e timeout.
- **System Prompt Blocco Allucinazioni**: Questo file contiene la specifica integrale degli stati globali. Gli Skeleton Loaders devono simulare la geometria esatta dei dati reali con ciclo di pulsazione 1.5 secondi. Nessuna schermata deve mai apparire priva di contenuti o bloccata senza spiegazione. Gli Empty States devono sempre includere un pulsante di azione primaria.

---

## Sezione 1: Specifiche di Backend e Logica dei Dati

### 1.1 Gestione delle Eccezioni (Backend)

Tutti i comandi IPC di Tauri devono essere wrappati in blocchi try-catch:

```typescript
// Pattern generale per comandi IPC
try {
    const result = await invoke('comando_backend', { params });
    return { success: true, data: result };
} catch (error) {
    console.error(`[ERRORE] comando_backend fallito:`, error);
    return {
        success: false,
        error: error.message || 'Errore sconosciuto',
        code: error.code || 'UNKNOWN_ERROR'
    };
}
```

Codici errore standard:
| Codice | Descrizione | Azione UI |
|---|---|---|
| `DB_ERROR` | Errore database (corruzione, lock) | Mostra messaggio con pulsante "Riprova" |
| `NETWORK_TIMEOUT` | Timeout connessione Ollama/API esterne | Mostra messaggio con opzione "Passa a Fallback Umano" |
| `FILE_PARSE_ERROR` | Errore parsing file importato | Mostra dettaglio errore con numero riga |
| `SLOT_COLLISION` | Conflitto orario appuntamenti | Animazione shake sul componente |

### 1.2 Timeout di Rete

Ogni richiesta a Ollama e API esterne ha un timeout di **30 secondi**. Trascorso il timeout:
1. La richiesta viene annullata
2. Il messaggio viene riaccodato nella FIFO con priorità normale
3. Sull'interfaccia viene mostrato un toast di errore
3. Se il timeout si ripete 3 volte consecutive per lo stesso messaggio, il sistema attiva il Fallback Umano automatico per quel cliente

### 1.3 Stato Offline

Se la connessione a Ollama viene persa (`localhost:11434` non risponde):
1. L'indicatore nella Status Bar diventa rosso
2. Il testo cambia in "AI Offline"
3. Tutte le richieste AI vengono messe in pausa
4. I messaggi in arrivo vengono accodati ma non processati
5. Alla riconnessione, la coda viene processata in ordine FIFO
6. L'operatore può comunque usare tutte le interfacce (CRUD manuali, fatturazione, dashboard)

---

## Sezione 2: Specifiche di Interfaccia Utente (UI/UX)

### 2.1 Skeleton Loaders (Caricamento)

Durante il caricamento dei dati dal database, l'interfaccia **non** mostra pagine bianche o spinner generici bloccanti. Utilizza invece gli **Skeleton Loaders** di Shadcn/ui.

Pattern di pulsazione:
- Blocchi rettangolari grigi opachi: `bg-slate-200`
- Animazione: pulsazione dell'opacità dal 30% al 100% in modo ciclico
- Durata ciclo: **1.5 secondi**
- Classe Tailwind: `animate-pulse`

Skeleton per tipo di contenuto:

| Tipo Contenuto | Scheletro |
|---|---|
| Tabella prodotti (Inventario) | Rettangoli per ogni riga: 32x32 (foto), 100px (SKU), 200px (nome), 80px (prezzo), 60px (stock) |
| Griglia calendario | Blocchi 100x40px per ogni slot orario, distanziati 4px |
| Lista contatti (CRM) | Rettangoli 250x60px impilati con gap 8px |
| Chat stream (CRM) | Bolle alternate: 60% larghezza (sinistra), 40% larghezza (destra) |
| KPI cards (Dashboard) | Tre rettangoli in linea 200x80px |
| Grafico a ciambella | Cerchio 200x200px con centro vuoto |

### 2.2 Empty States (Stato Vuoto)

Se una ricerca non produce risultati o una tabella è priva di record, l'applicazione mostra un layout centralizzato con:

1. **Icona illustrativa** grigia desaturata di grandi dimensioni (64x64px)
2. **Titolo in grassetto** che descrive la situazione
3. **Pulsante di azione primaria** focalizzato sulla risoluzione

| Schermata | Titolo | Pulsante Azione |
|---|---|---|
| Inventario (nessun prodotto) | *"Nessun prodotto trovato"* | "Aggiungi il tuo primo prodotto" |
| Ricerca inventario (nessun risultato) | *"Nessun risultato per la ricerca"* | "Ripristina i filtri di ricerca" |
| CRM (nessun contatto) | *"Nessun cliente registrato"* | — (attendi primo messaggio in arrivo) |
| Appuntamenti (nessuno) | *"Nessun appuntamento in agenda"* | "Crea il primo appuntamento" |
| Fatture (nessuna) | *"Nessuna fattura emessa"* | — (attendi primo ordine) |
| Dashboard (nessun dato) | *"Dati insufficienti per i grafici"* | "Vai all'inventario" |

L'icona è una SVG inline desaturata (`text-slate-300`), specifica per ogni contesto (carrello vuoto, calendario vuoto, grafico vuoto, ecc.).

### 2.3 Stati di Errore (Exception/Error States)

Quando un'operazione fallisce, viene mostrato:
1. **Icona di errore** rossa (triangolo warning o cerchio con X)
2. **Messaggio di errore** in testo normale (non tecnico, leggibile dall'utente)
3. **Pulsante "Riprova"** per tentare nuovamente l'operazione
4. Opzionalmente: **pulsante "Dettagli"** che mostra il messaggio tecnico in console/dialog

Stati di errore specifici:
- **Errore Database**: *"Impossibile caricare i dati. Verifica che il database non sia corrotto."* + pulsante "Riprova"
- **Errore Connessione AI**: *"Il server AI locale non risponde. Verifica che Ollama sia in esecuzione."* + pulsanti "Riprova" e "Passa a Fallback Umano"
- **Errore Importazione File**: *"Errore durante l'importazione del file. Verifica il formato alla riga X."* + pulsante "Riprova con altro file"

---

## Sezione 3: Stati d'Interazione e Logica degli Eventi

### 3.1 Ciclo di Vita del Caricamento

1. Utente naviga su un'interfaccia
2. `isLoading = true` → compaiono gli Skeleton Loaders specifici per quella schermata
3. La richiesta dati viene inviata al backend
4. **Caso successo**: `isLoading = false`, skeleton scompare, dati renderizzati
5. **Caso vuoto**: `isLoading = false`, skeleton scompare, Empty State centralizzato
6. **Caso errore**: `isLoading = false`, skeleton scompare, Error State con pulsante Riprova

### 3.2 Timeout Visivo

Se il caricamento dura più di 10 secondi:
1. Lo skeleton loader rimane visibile
2. Compare un indicatore aggiuntivo: *"L'operazione sta impiegando più tempo del previsto..."*
3. Dopo 30 secondi: scatta il timeout, lo skeleton viene sostituito dall'Error State

### 3.3 Riconnessione Automatica (Stato Offline)

Quando la connessione Ollama viene ripristinata:
1. L'indicatore nella Status Bar torna verde
2. Compare un toast: *"Connessione AI ripristinata"*
3. I messaggi in coda FIFO iniziano a essere processati automaticamente
4. Le interfacce che mostravano Error State per mancata connessione si ricaricano automaticamente

### 3.4 Transizioni tra Stati

Tutte le transizioni tra stati (loading → dati, loading → empty, loading → error, error → dati) devono avere una durata massima di 200ms per evitare lampeggiamenti. Usare `transition-opacity duration-200` per dissolvenza incrociata tra stati.
