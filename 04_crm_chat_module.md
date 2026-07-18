# FILE: 04_crm_chat_module.md
- **Stato Isolamento**: COMPLETO — Modulo CRM, chat conversazionale, memoria semantica a lungo termine, fact logs.
- **System Prompt Blocco Allucinazioni**: Questo file contiene la specifica integrale del modulo CRM. Il layout a 3 colonne è obbligatorio e deve essere implementato come una struttura a tabella fissa (non Flexbox per l'impaginazione macro). I badge di origine messaggio (AI/Operatore) con bordo colorato e il widget Fact Logs con chip rimovibili devono essere implementati esattamente come descritto.

---

## Sezione 1: Specifiche di Backend e Logica dei Dati

### 1.1 Tabella Clienti

```sql
CREATE TABLE IF NOT EXISTS clienti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    cognome TEXT,
    telefono TEXT UNIQUE NOT NULL,
    canale_provenienza TEXT CHECK(canale_provenienza IN ('whatsapp', 'telegram', 'manuale')),
    indirizzo_spedizione TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.2 Tabella Log Memoria (Memoria a Lungo Termine)

```sql
CREATE TABLE IF NOT EXISTS log_memoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER,
    chiave_preferenza TEXT NOT NULL,    -- Es: 'taglia_preferita', 'colore_odiato'
    valore_preferenza TEXT NOT NULL,
    data_aggiornamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(cliente_id) REFERENCES clienti(id)
);
```

### 1.3 Iniezione Memoria Continua nel Prompt AI

Quando l'Agente Vendite viene attivato per rispondere a un cliente, il backend esegue una query preliminare sulla tabella `log_memoria` per il `cliente_id` specifico:

```sql
SELECT chiave_preferenza, valore_preferenza FROM log_memoria
WHERE cliente_id = :cliente_id
ORDER BY data_aggiornamento DESC;
```

Se trova record, li organizza in un blocco di testo anteposto al prompt di sistema:

```
Sei l'Agente di Vendita dell'azienda. Stai parlando con il cliente che ha le seguenti
caratteristiche memorizzate:
- TAGLIA_PREFERITA: M
- COLORE_PREFERITO: Blu Navy
- NOTE_SPEDIZIONE: Citofonare Rossi se assente.

Usa queste informazioni se pertinenti alla discussione senza dire esplicitamente "Vedo nei
miei dati che ti piace il blu navy", ma orientando la proposta commerciale in modo naturale
verso queste varianti.
```

### 1.4 Gestione Flag Fallback Umano

Quando scatta il Fallback Umano (da trigger automatico o manuale):

```sql
-- Impostazione flag AI disabilitato per il cliente
UPDATE clienti SET ai_enabled = 0 WHERE telefono = :telefono;

-- Nota: il campo ai_enabled non è nel DDL originale,
-- va aggiunto come colonna opzionale: ai_enabled INTEGER DEFAULT 1
ALTER TABLE clienti ADD COLUMN ai_enabled INTEGER DEFAULT 1;
```

---

## Sezione 2: Specifiche di Interfaccia Utente (UI/UX)

### 2.1 Layout a Tre Colonne (Struttura a Tabella Fissa)

La schermata CRM è ingegnerizzata come una struttura a tabella fissa senza Flexbox a livello di impaginazione macro (per compatibilità WeasyPrint). Tre compartimenti stagni ad altezza definita:

```
┌─────────────────┬─────────────────────────────────┬──────────────────────┐
│  LISTA CONTATTI │  STREAM CONVERSAZIONE           │  ISPETTORE & MEMORIA │
│  (Larghezza fissa)│ (Centro, flessibile)           │  (Larghezza fissa)   │
├─────────────────┼─────────────────────────────────┼──────────────────────┤
│  ┌───────────┐  │  ┌───────────────────────────┐  │  Nome: [________]   │
│  │ Mario Rossi│  │  │           ┌──────────┐    │  │  Telefono: [______]│
│  │ "Va bene..."│  │  │           │ AI Bot   │    │  │  Indirizzo: [____] │
│  │ ● WhatsApp │  │  │           │ Ciao!    │    │  │                    │
│  ├───────────┤  │  │           └──────────┘    │  │  ─── Fact Logs ───  │
│  │ Anna Bianchi│  │  │  ┌──────────────────┐   │  │                     │
│  │ "Arrivo..." │  │  │  │ [Operatore]      │   │  │  [TAGLIA_PREF: M] x │
│  │ ● Telegram │  │  │  │ OK, procediamo    │   │  │  [COLORE_ODIATO:   │
│  ├───────────┤  │  │  └──────────────────┘   │  │  │   Giallo]        x │
│  │ ...        │  │  │                        │  │  │                     │
│  └───────────┘  │  │  [Input field..........│  │  │  [BRAND_FOCUS:     │
│                 │  │  [Invia >]              │  │  │   Nike]           x │
└─────────────────┴─────────────────────────────────┴──────────────────────┘
```

| Colonna | Larghezza | Descrizione |
|---|---|---|
| Lista Contatti | Fissa (es. 250px) | Schede clienti con nome, ultimo estratto messaggio, badge canale, badge stato |
| Stream Conversazione | Flessibile (resto larghezza) | Cronologia chat completa, input field in basso |
| Ispettore & Memoria | Fissa (es. 280px) | Metadati cliente editabili + widget Fact Logs |

### 2.2 Bolle di Testo — Marcatore Origine

| Mittente | Stile Bolla | Badge |
|---|---|---|
| Cliente (ricevuto) | Sfondo grigio chiaro (`bg-gray-100`), allineata a sinistra | Nessuno |
| AI Bot (sistema) | Sfondo bianco, bordo verde 2px (`border-green-500`), allineata a destra | Badge "AI Bot" verde, piccolo, lampeggiante |
| Operatore Umano | Sfondo bianco, bordo blu 2px (`border-blue-500`), allineata a destra | Badge "Operatore" blu |

### 2.3 Widget Fact Logs (Memoria)

Pannello nella colonna destra che mostra i fatti estratti dall'AI dalla tabella `log_memoria`. Ogni fatto è rappresentato come un chip/tag compatto:

```
[TAGLIA_PREFERITA: M] [×]
[COLORE_ODIATO: Giallo] [×]
[BRAND_FOCUS: Nike] [×]
```

- **Chiave**: grassetto
- **Valore**: testo normale editabile (click per modificare inline)
- **Icona cestino** (×): a destra di ogni chip per eliminare istantaneamente il fatto dal database
- In fondo: pulsante "+ Aggungi fatto" per inserimento manuale

---

## Sezione 3: Stati d'Interazione e Logica degli Eventi

### 3.1 Selezione Contatto

1. Utente clicca su una scheda contatto nella lista sinistra
2. La scheda si evidenzia con `bg-sky-50 border-l-4 border-sky-500`
3. La colonna centrale carica la cronologia chat di quel cliente
4. La colonna destra carica i metadati anagrafici e i Fact Logs
5. Se il contatto è in stato "Fallback Umano" (`ai_enabled = 0`), la riga è colorata di **Rosso Lampeggiante**

### 3.2 Invio Messaggio (Operatore Umano)

1. Operatore digita nel campo input in fondo alla colonna centrale
2. Preme Enter o clicca "Invia"
3. Messaggio appare come bolla con bordo blu e badge "Operatore"
4. Il messaggio viene salvato nel database (tabella messaggi interna) e inviato al cliente via Telegram/WhatsApp
5. Se il cliente è in Fallback Umano, l'AI non intercetta la risposta

### 3.3 Eliminazione Fact Log

1. Operatore clicca sull'icona cestino (×) di un chip Fact Log
2. Il chip scompare con animazione fade-out (200ms)
3. Backend esegue: `DELETE FROM log_memoria WHERE id = :id`
4. Il fatto non verrà più iniettato nei futuri prompt AI per quel cliente
5. Toast: *"Fatto rimosso dalla memoria AI"*

### 3.4 Modifica Campo Anagrafica

1. Operatore clicca su un campo editabile (nome, telefono, indirizzo)
2. Il campo diventa un input editabile con focus automatico
3. Premendo Enter o cliccando fuori, il valore viene salvato:
   `UPDATE clienti SET indirizzo_spedizione = :valore WHERE id = :id`
4. Toast di conferma: *"Anagrafica aggiornata"*

### 3.5 Ordinamento Lista Contatti

La lista contatti è ordinata cronologicamente per ultimo messaggio ricevuto (più recente in alto). Ogni scheda mostra:
- Nome cliente (bold)
- Estratto ultimo messaggio (max 50 caratteri, `text-sm text-slate-500`, troncato con `...`)
- Icona canale (WhatsApp o Telegram) + badge stato:
  - `"AI Attiva"` (verde) — gestione automatica in corso
  - `"In attesa risposta"` (giallo) — messaggio ricevuto, AI sta elaborando o in coda
  - `"Gestione Manuale"` (rosso lampeggiante) — Fallback Umano attivo
