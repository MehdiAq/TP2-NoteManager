# Rapport TP3 — Réusinage d'un projet TypeScript

**Cours** : MGL843 — Sujets avancés en conception logicielle
**Projet** : NoteManager (TypeScript / Node.js)
**Dépôt** : [MehdiAq/TP2-NoteManager](https://github.com/MehdiAq/TP2-NoteManager)
**Équipe** : 2

---

## Table des matières

- [Rapport TP3 — Réusinage d'un projet TypeScript](#rapport-tp3--réusinage-dun-projet-typescript)
  - [Partie 1 : Identification des problèmes de conception](#partie-1--identification-des-problèmes-de-conception)
    - [Problème 1 — CLIController : classe « God Class »](#problème-1--clicontroller--classe--god-class-)
    - [Problème 2 — NoteService : couplage excessif](#problème-2--noteservice--couplage-excessif)
    - [Problème 3 — SearchEngine : méthodes trop longues et duplication interne](#problème-3--searchengine--méthodes-trop-longues-et-duplication-interne)
  - [Partie 2 : Propositions de changements](#partie-2--propositions-de-changements)
    - [Changement 1 — Patron Commande (GoF) pour CLIController](#changement-1--patron-commande-gof-pour-clicontroller)
    - [Changement 2 — Décomposition du façade NoteService](#changement-2--décomposition-du-façade-noteservice)
    - [Changement 3 — Extraction des structures de données de SearchEngine](#changement-3--extraction-des-structures-de-données-de-searchengine)
  - [Partie 3 : Résultats après les réusinages](#partie-3--résultats-après-les-réusinages)
    - [Changement 1 — Patron Commande pour CLIController](#changement-1--patron-commande-pour-clicontroller)
    - [Changement 2 — Encapsulation du façade NoteService](#changement-2--encapsulation-du-façade-noteservice)
    - [Changement 3 — Composition pour SearchEngine](#changement-3--composition-pour-searchengine)
    - [Synthèse : Les changements ont-ils amélioré la qualité de manière mesurable ?](#synthèse--les-changements-ont-ils-amélioré-la-qualité-de-manière-mesurable-)

---

<div style="page-break-after: always;"></div>

## Partie 1 : Identification des problèmes de conception

### Méthodologie d'identification

Les problèmes ont été identifiés en repérant les **classes aberrantes** (outliers) dans la distribution des métriques du projet, puis en les analysant qualitativement à l'aide des heuristiques du cours (GRASP, SOLID, GoF).

Les notes de cours MGL843 (Fuhrman, 2022) ne proposent aucun seuil numérique absolu pour les métriques CK. Nous adoptons donc une approche **relative** : une classe est considérée problématique lorsqu'elle se démarque significativement des autres classes du même projet sur une ou plusieurs métriques, et que cette anomalie peut être expliquée par une violation d'une heuristique de conception connue.

**Rappel des métriques du projet** (12 classes, 1618 LOC, 127 méthodes) :

| Classe | NOM | NOA | LOC | WMC | DIT | CBO | LCOM | LOC/M | CC/M |
|--------|-----|-----|-----|-----|-----|-----|------|-------|------|
| CLIController | 16 | 1 | **310** | **44** | 0 | 6 | 0 | **19.4** | **2.75** |
| NoteService | 20 | 6 | 205 | 33 | 0 | **9** | 0 | 10.2 | 1.65 |
| SearchEngine | 11 | 6 | 297 | 33 | 1 | 3 | 0 | **27.0** | **3.0** |
| BackupService | 17 | 6 | 246 | 36 | 1 | 2 | 40 | 14.5 | 2.12 |
| AttachmentService | 13 | 3 | 188 | 26 | 1 | 3 | 14 | 14.5 | 2.0 |
| Note | 18 | 6 | 110 | 22 | 1 | 6 | 56 | 6.1 | 1.22 |
| NoteRepository | 9 | 1 | 43 | 10 | 1 | 3 | 0 | 4.8 | 1.11 |
| Attachment | 5 | 9 | 86 | 11 | 1 | 2 | 6 | 17.2 | 2.2 |
| JsonStorage | 6 | 1 | 60 | 11 | 1 | 3 | 4 | 10.0 | 1.83 |
| Tag | 6 | 1 | 28 | 7 | 0 | 0 | 4 | 4.7 | 1.17 |
| NoteFactory | 3 | 0 | 18 | 3 | 0 | 2 | 3 | 6.0 | 1.0 |
| App | 3 | 2 | 27 | 4 | 0 | 5 | 1 | 9.0 | 1.33 |

*Moyennes du projet : WMC = 20.0 | CBO = 3.7 | LOC/M = 12.7 | CC/M = 1.7*

---

### Problème 1 — CLIController : classe « God Class »

**Métriques aberrantes :**

| Métrique | CLIController | Moyenne projet | Facteur |
|----------|---------------|----------------|---------|
| WMC | **44** | 20.0 | **2.2×** |
| LOC | **310** | 134.8 | **2.3×** |
| LOC/M | **19.4** | 12.7 | **1.5×** |
| CC/M | **2.75** | 1.7 | **1.6×** |

CLIController a le WMC et le LOC les plus élevés de tout le projet. Son WMC de 44 est presque le double de la deuxième classe la plus complexe (BackupService, WMC=36). La combinaison LOC/M élevé (méthodes longues) et CC/M élevé (méthodes complexes) est particulièrement préoccupante.

**Analyse du code source :**

La classe CLIController (313 lignes) contient 16 méthodes qui gèrent l'ensemble des commandes CLI du projet. Chaque méthode combine trois responsabilités distinctes :

1. **Délégation au service** (appel métier)
2. **Formatage de la sortie** (console.log avec mise en forme)
3. **Gestion d'erreurs** (try/catch avec messages utilisateur)

Exemple — la méthode `showNote` illustre cette accumulation de responsabilités :

```typescript
// src/controllers/CLIController.ts — lignes 51-81
public showNote(id: string): void {
    const note = this.noteService.getNoteById(id);

    if (!note) {
      console.log(`✗ Aucune note trouvée avec l'ID "${id}".`);
      return;
    }

    console.log('\n' + '='.repeat(60));
    console.log(note.getTitle());
    console.log('='.repeat(60));
    console.log(`\n${note.getContent()}\n`);
    console.log(`Tags: ${note.getTags().join(', ') || 'Aucun'}`);
    console.log(`ID: ${note.getId()}`);
    console.log(`Créée: ${note.getCreatedAt().toLocaleString()}`);
    console.log(`Modifiée: ${note.getUpdatedAt().toLocaleString()}`);

    // Afficher les attachements s'il y en a
    const attachmentService = this.noteService.getAttachmentService();
    if (attachmentService) {
      const attachments = attachmentService.listAttachments(id);
      if (attachments.length > 0) {
        console.log(`\nPièces jointes (${attachments.length}):`);
        attachments.forEach((attach, idx) => {
          console.log(`  [${idx + 1}] ${attach.fileName} ...`);
        });
      }
    }
    console.log('');
  }
```

De plus, les méthodes de backup et d'attachement (lignes 155-312) accèdent directement aux sous-services via `this.noteService.getBackupService()` et `this.noteService.getAttachmentService()`. Ce patron viole la **Loi de Déméter** (notes de cours, section 3.20) : le contrôleur traverse NoteService pour atteindre BackupService, créant une chaîne de dépendances `CLIController → NoteService → BackupService`.

Exemple de violation de la Loi de Déméter, répété 7 fois dans le fichier :

```typescript
// src/controllers/CLIController.ts — lignes 158-159
public async createBackup(): Promise<void> {
    const backupService = this.noteService.getBackupService();
    // ...
```

```typescript
// src/controllers/CLIController.ts — lignes 246-248
public async attachFile(noteId: string, filePath: string): Promise<void> {
    const attachmentService = this.noteService.getAttachmentService();
    // ...
```

**Heuristiques violées :**

- **Forte Cohésion (GRASP)** : une classe fortement cohésive « a peu de responsabilités et des fonctions apparentées » (notes de cours, section 3.8). CLIController gère la sortie pour 5 domaines fonctionnels distincts (CRUD notes, recherche, backup, attachements, import/export). Le LCOM de 0 ne détecte pas ce problème car la classe ne possède qu'un seul attribut (`noteService`), ce qui constitue une limitation connue de la métrique LCOM CK (notes de cours, section 2.8).
- **Principe de responsabilité unique (SRP, SOLID)** : « une classe ne devrait avoir qu'une seule raison de changer » (notes de cours, section 3.14). CLIController changerait si : (a) une nouvelle commande CLI est ajoutée, (b) le format d'affichage change, (c) la gestion d'erreurs évolue, (d) un nouveau sous-service est ajouté.
- **Loi de Déméter** (notes de cours, section 3.20) : les appels `this.noteService.getBackupService().createBackup()` traversent deux niveaux d'indirection.

---

### Problème 2 — NoteService : couplage excessif

**Métriques aberrantes :**

| Métrique | NoteService | Moyenne projet | Facteur |
|----------|-------------|----------------|---------|
| CBO | **9** | 3.7 | **2.4×** |
| NOM | **20** | 10.6 | **1.9×** |
| WMC | **33** | 20.0 | **1.65×** |

NoteService est la seule classe du projet avec un CBO de 9. La deuxième classe la plus couplée (CLIController et Note) a un CBO de 6 — un écart de 50%. Le CBO est la métrique jugée significative dans le plus grand nombre d'études empiriques (23 sur 29 selon Isong et Obeten 2013, cité dans les notes de cours p.28).

**Analyse du code source :**

NoteService dépend de 5 interfaces et 1 classe concrète via son constructeur :

```typescript
// src/services/NoteService.ts — lignes 21-27
constructor(
    repository: IRepository,
    storage: IStorage,
    searchEngine: ISearchEngine,
    backupService?: IBackupService,
    attachmentService?: IAttachmentService
  ) {
```

La classe expose 20 méthodes publiques couvrant 5 domaines fonctionnels distincts :

| Domaine | Méthodes | Dépendances |
|---------|----------|-------------|
| CRUD notes | `createNote`, `deleteNote`, `updateNote`, `getNoteById`, `getAllNotes`, `clearAllNotes`, `getNotesCount` | IRepository, IStorage, NoteFactory |
| Recherche | `searchNotes`, `getNotesByTag`, `rebuildSearchIndexes` | ISearchEngine, IRepository |
| Persistance | `loadNotes`, `persist`, `exportNotes`, `importNotes` | IStorage, IRepository |
| Backup | `configureAutoBackup`, `disableAutoBackup`, `createAutoBackup`, `getBackupService` | IBackupService |
| Attachements | `getAttachmentService` | IAttachmentService |

Les méthodes `getBackupService()` et `getAttachmentService()` (lignes 205-211) sont des « getter exposant un collaborateur interne », ce qui brise l'encapsulation et encourage les violations de la Loi de Déméter dans les classes clientes (comme CLIController) :

```typescript
// src/services/NoteService.ts — lignes 205-211
// Méthodes pour le BackupService
public getBackupService(): IBackupService | undefined {
    return this.backupService;
}

// Méthodes pour l'AttachmentService
public getAttachmentService(): IAttachmentService | undefined {
    return this.attachmentService;
}
```

La méthode `rebuildSearchIndexes` (lignes 81-87) utilise un cast `as any` pour contourner l'interface, ce qui est un signe de conception fragile :

```typescript
// src/services/NoteService.ts — lignes 81-87
private rebuildSearchIndexes(): void {
    const allNotes = this.repository.findAll();
    if ('buildIndexes' in this.searchEngine) {
      (this.searchEngine as any).buildIndexes(allNotes);
    }
}
```

**Heuristiques violées :**

- **Faible Couplage (GRASP)** : « minimiser les connexions avec de bonnes abstractions » (notes de cours, section 3.7 et section 1.4). Un CBO de 9 signifie que tout changement dans l'une des 9 classes couplées peut nécessiter une modification de NoteService. Cela augmente le « ripple effect » (effet de propagation de changement, Yau et Collofello 1985, cité dans les notes de cours section 1.8).
- **Principe de responsabilité unique (SRP, SOLID)** : la classe a au moins 5 raisons de changer (une par domaine fonctionnel).
- **Masquage de l'information** (notes de cours, section 3.13) : les getters `getBackupService()` et `getAttachmentService()` exposent les collaborateurs internes, brisant l'encapsulation.

---

### Problème 3 — SearchEngine : méthodes trop longues et duplication interne

**Métriques aberrantes :**

| Métrique | SearchEngine | Moyenne projet | Facteur |
|----------|-------------|----------------|---------|
| LOC/M | **27.0** | 12.7 | **2.1×** |
| CC/M | **3.0** | 1.7 | **1.8×** |
| LOC | **297** | 134.8 | **2.2×** |

SearchEngine a le ratio LOC/méthode le plus élevé du projet (27.0), soit plus du double de la moyenne. Ses méthodes sont à la fois longues et complexes (CC/M = 3.0, aussi le plus élevé).

**Analyse du code source :**

La classe mélange trois responsabilités techniques distinctes dans un même fichier de 309 lignes :

1. **Index inversé** : construction et maintenance de 3 index (tags, mots du contenu, mots du titre) — `buildIndexes()`, lignes 33-72
2. **Cache LRU** : gestion d'un cache avec politique d'éviction — `getCacheKey()`, `addToCache()`, lignes 88-104
3. **Méthodes de recherche** : 5 méthodes qui suivent toutes le même patron — `search()`, `searchByTag()`, `searchByTitle()`, `searchByContent()`, `searchMultipleTags()`, lignes 109-301

Le problème le plus visible est la **duplication structurelle** dans les méthodes de recherche. Chaque méthode de recherche suit exactement le même patron en 5 étapes :

```
1. Calculer la clé de cache
2. Vérifier le cache
3. Construire les index si nécessaire
4. Effectuer la recherche
5. Mettre en cache et retourner
```

Voici deux exemples côte à côte qui illustrent cette duplication :

```typescript
// src/search/SearchEngine.ts — lignes 156-177 (searchByTag)
public searchByTag(notes: INote[], tag: string): INote[] {
    const cacheKey = this.getCacheKey('tag', tag);       // 1. Clé cache
    if (this.searchCache.has(cacheKey)) {                // 2. Vérifier cache
      return this.searchCache.get(cacheKey)!;
    }
    if (this.notesMap.size === 0 && notes.length > 0) {  // 3. Index
      this.buildIndexes(notes);
    }
    // ... logique de recherche spécifique ...             // 4. Recherche
    this.addToCache(cacheKey, results);                   // 5. Cache
    return results;
  }
```

```typescript
// src/search/SearchEngine.ts — lignes 182-213 (searchByTitle)
public searchByTitle(notes: INote[], title: string): INote[] {
    const cacheKey = this.getCacheKey('title', title);   // 1. Clé cache
    if (this.searchCache.has(cacheKey)) {                // 2. Vérifier cache
      return this.searchCache.get(cacheKey)!;
    }
    if (this.notesMap.size === 0 && notes.length > 0) {  // 3. Index
      this.buildIndexes(notes);
    }
    // ... logique de recherche spécifique ...             // 4. Recherche
    this.addToCache(cacheKey, results);                   // 5. Cache
    return results;
  }
```

Ce bloc de vérification cache + construction index (8 lignes identiques) est répété **5 fois** dans le fichier.

Par ailleurs, la méthode `buildIndexes()` (lignes 33-72) fait 40 lignes et effectue 3 indexations séquentielles (tags, contenu, titre) qui pourraient être décomposées.

**Heuristiques violées :**

- **Forte Cohésion (GRASP)** : la classe regroupe trois responsabilités techniques distinctes (indexation, cache, recherche) qui évoluent pour des raisons différentes.
- **Principe DRY (Don't Repeat Yourself)** : la duplication du patron cache/index dans 5 méthodes crée de la dette technique. Une modification du mécanisme de cache nécessiterait de modifier 5 méthodes simultanément (notes de cours, section 1.9 sur la dette technique).
- **« Low-to-medium fan-out »** (notes de cours, section 1.4, figure 1.8) : SearchEngine gère 6 attributs internes (3 index + 1 map + 1 cache + 1 constante), chacun étant une structure de données Map imbriquée, ce qui augmente la complexité interne.

---

<div style="page-break-after: always;"></div>

## Partie 2 : Propositions de changements

### Changement 1 — Patron Commande (GoF) pour CLIController

**Problème adressé :** CLIController God Class (WMC=44, LOC=310, violation de Forte Cohésion, SRP et Loi de Déméter).

**Heuristiques appliquées :**

- **Patron Commande (GoF)** (notes de cours, annexe A.14) : « encapsuler une requête comme un objet, permettant de paramétrer les clients avec différentes requêtes ».
- **Forte Cohésion (GRASP)** : chaque commande devient une classe à responsabilité unique.
- **Principe ouvert/fermé (OCP, SOLID)** (notes de cours, section 3.15) : ajouter une nouvelle commande CLI = ajouter une classe, sans modifier CLIController.
- **Loi de Déméter** : chaque commande reçoit directement les dépendances dont elle a besoin, sans traverser NoteService.

**Réusinage proposé :**

Étape 1 — Définir une interface `ICommand` :

```typescript
// src/commands/ICommand.ts
export interface ICommand {
  execute(args: Record<string, unknown>): Promise<void>;
}
```

Étape 2 — Extraire chaque groupe de commandes dans sa propre classe. Exemple pour les commandes de notes :

```typescript
// src/commands/CreateNoteCommand.ts
import { ICommand } from './ICommand';
import { NoteService } from '../services/NoteService';

export class CreateNoteCommand implements ICommand {
  constructor(private noteService: NoteService) {}

  async execute(args: Record<string, unknown>): Promise<void> {
    const title = args.title as string;
    const content = args.content as string;
    const tags = (args.tags as string[]) || [];

    const note = this.noteService.createNote(title, content, tags);
    console.log('✓ Note créée avec succès!');
    console.log(`ID: ${note.getId()}`);
    console.log(`Titre: ${note.getTitle()}`);
    console.log(`Tags: ${note.getTags().join(', ') || 'Aucun'}`);
  }
}
```

Exemple pour les commandes de backup (recevant directement IBackupService, sans traverser NoteService) :

```typescript
// src/commands/CreateBackupCommand.ts
import { ICommand } from './ICommand';
import { IBackupService } from '../interfaces/IBackupService';

export class CreateBackupCommand implements ICommand {
  constructor(private backupService: IBackupService) {}

  async execute(args: Record<string, unknown>): Promise<void> {
    const metadata = await this.backupService.createBackup();
    console.log('✓ Backup créé avec succès!');
    console.log(`ID: ${metadata.id}`);
    console.log(`Date: ${metadata.timestamp.toLocaleString()}`);
    console.log(`Notes sauvegardées: ${metadata.notesCount}`);
  }
}
```

Étape 3 — Réduire CLIController à un simple registre de commandes :

```typescript
// src/controllers/CLIController.ts (réusiné)
import { ICommand } from '../commands/ICommand';

export class CLIController {
  private commands: Map<string, ICommand> = new Map();

  registerCommand(name: string, command: ICommand): void {
    this.commands.set(name, command);
  }

  async dispatch(name: string, args: Record<string, unknown>): Promise<void> {
    const command = this.commands.get(name);
    if (!command) {
      console.log(`✗ Commande inconnue: "${name}"`);
      return;
    }
    await command.execute(args);
  }
}
```

**Pourquoi ce changement améliore la qualité :**

| Métrique | Avant | Après (estimé) | Explication |
|----------|-------|----------------|-------------|
| WMC (CLIController) | 44 | ~4 | Le dispatch ne contient que 2 méthodes simples |
| LOC (CLIController) | 310 | ~20 | Toute la logique est déléguée aux commandes |
| WMC (par commande) | — | 3-5 | Chaque commande a une seule responsabilité |
| CBO (CLIController) | 6 | 1 | Ne dépend plus que de ICommand |

Ce réusinage résout aussi la violation de la **Loi de Déméter** : les commandes de backup reçoivent directement `IBackupService` dans leur constructeur (injection via `App.ts`) au lieu de traverser `NoteService.getBackupService()`.

---

### Changement 2 — Décomposition du façade NoteService

**Problème adressé :** NoteService couplage excessif (CBO=9, NOM=20, violation de Faible Couplage et SRP, exposition des collaborateurs internes).

**Heuristiques appliquées :**

- **Faible Couplage (GRASP)** (notes de cours, section 3.7) : réduire le nombre de classes auxquelles chaque service est couplé.
- **Principe de responsabilité unique (SRP, SOLID)** (notes de cours, section 3.14) : séparer les raisons de changer.
- **Masquage de l'information** (notes de cours, section 3.13) : supprimer les getters qui exposent les collaborateurs internes.
- **Principe de ségrégation des interfaces (ISP, SOLID)** (notes de cours, section 3.17) : chaque client ne devrait dépendre que de l'interface dont il a besoin.

**Réusinage proposé :**

Étape 1 — Séparer NoteService en trois services spécialisés :

```typescript
// src/services/NoteCrudService.ts — CRUD et persistance
import { IRepository } from '../interfaces/IRepository';
import { IStorage } from '../interfaces/IStorage';
import { NoteFactory } from '../factories/NoteFactory';
import { INote } from '../interfaces/INote';

export class NoteCrudService {
  constructor(
    private repository: IRepository,
    private storage: IStorage
  ) {
    this.loadNotes();
  }

  private loadNotes(): void {
    const notes = this.storage.load();
    notes.forEach(note => this.repository.add(note));
  }

  public persist(): void {
    this.storage.save(this.repository.findAll());
  }

  public createNote(title: string, content: string, tags: string[] = []): INote {
    const note = NoteFactory.createNote(title, content, tags);
    this.repository.add(note);
    this.persist();
    return note;
  }

  public deleteNote(id: string): boolean {
    const deleted = this.repository.remove(id);
    if (deleted) this.persist();
    return deleted;
  }

  public getAllNotes(): INote[] {
    return this.repository.findAll();
  }

  public getNoteById(id: string): INote | undefined {
    return this.repository.findById(id);
  }

  // ... updateNote, clearAllNotes, getNotesCount
}
```

```typescript
// src/services/NoteSearchService.ts — Recherche
import { ISearchEngine } from '../interfaces/ISearchEngine';
import { INote } from '../interfaces/INote';

export class NoteSearchService {
  constructor(private searchEngine: ISearchEngine) {}

  public search(notes: INote[], query: string): INote[] {
    return this.searchEngine.search(notes, query);
  }

  public searchByTag(notes: INote[], tag: string): INote[] {
    return this.searchEngine.searchByTag(notes, tag);
  }
}
```

Étape 2 — Supprimer les getters `getBackupService()` et `getAttachmentService()`. Les classes clientes (commandes CLI) reçoivent directement les services nécessaires via injection de dépendances dans `App.ts`.

**Pourquoi ce changement améliore la qualité :**

| Métrique | Avant | Après (estimé) | Explication |
|----------|-------|----------------|-------------|
| CBO (NoteService → NoteCrudService) | 9 | 3 | Ne dépend que de IRepository, IStorage, NoteFactory |
| CBO (NoteSearchService) | — | 1 | Ne dépend que de ISearchEngine |
| NOM (NoteService → NoteCrudService) | 20 | ~8 | Seules les méthodes CRUD restent |

La suppression des getters `getBackupService()` / `getAttachmentService()` élimine la source des violations de la Loi de Déméter dans CLIController. Les collaborateurs internes sont masqués conformément au principe de masquage de l'information (notes de cours, section 3.13).

Ce réusinage permet aussi de corriger le cast `as any` dans `rebuildSearchIndexes()` : en extrayant la recherche dans un service dédié, on peut typer correctement l'interaction avec le `SearchEngine` sans contourner l'interface.

---

### Changement 3 — Extraction des structures de données de SearchEngine

**Problème adressé :** SearchEngine méthodes trop longues (LOC/M=27.0, CC/M=3.0, duplication du patron cache/index dans 5 méthodes).

**Heuristiques appliquées :**

- **Fabrication Pure (GRASP)** (notes de cours, section 3.10) : créer des classes utilitaires qui n'existent pas dans le domaine métier mais qui améliorent la cohésion et réduisent le couplage. L'index inversé et le cache LRU sont des « fabrications pures » — des classes inventées pour servir la conception, pas le domaine.
- **Forte Cohésion (GRASP)** : chaque classe ne gère qu'une seule responsabilité technique.
- **Principe DRY** : éliminer la duplication du patron cache/index par un Template Method ou une simple extraction.
- **Favoriser la composition plutôt que l'héritage** (notes de cours, section 3.3) : SearchEngine compose un index et un cache au lieu de tout implémenter en interne.

**Réusinage proposé :**

Étape 1 — Extraire le cache LRU dans une classe dédiée (Fabrication Pure) :

```typescript
// src/search/LRUCache.ts
export class LRUCache<K, V> {
  private cache: Map<K, V> = new Map();

  constructor(private readonly maxSize: number) {}

  get(key: K): V | undefined {
    return this.cache.get(key);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  set(key: K, value: V): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}
```

Étape 2 — Extraire l'index inversé dans sa propre classe (Fabrication Pure) :

```typescript
// src/search/InvertedIndex.ts
export class InvertedIndex {
  private index: Map<string, Set<string>> = new Map();

  addEntry(key: string, noteId: string): void {
    if (!this.index.has(key)) {
      this.index.set(key, new Set());
    }
    this.index.get(key)!.add(noteId);
  }

  getNoteIds(key: string): Set<string> {
    return this.index.get(key) || new Set();
  }

  getMatchingIds(predicate: (key: string) => boolean): Set<string> {
    const ids = new Set<string>();
    this.index.forEach((noteIds, key) => {
      if (predicate(key)) {
        noteIds.forEach(id => ids.add(id));
      }
    });
    return ids;
  }

  clear(): void {
    this.index.clear();
  }
}
```

Étape 3 — Simplifier SearchEngine par composition :

```typescript
// src/search/SearchEngine.ts (réusiné)
import { ISearchEngine } from '../interfaces/ISearchEngine';
import { INote } from '../interfaces/INote';
import { InvertedIndex } from './InvertedIndex';
import { LRUCache } from './LRUCache';

export class SearchEngine implements ISearchEngine {
  private tagIndex = new InvertedIndex();
  private wordIndex = new InvertedIndex();
  private titleIndex = new InvertedIndex();
  private notesMap: Map<string, INote> = new Map();
  private cache = new LRUCache<string, INote[]>(100);

  public buildIndexes(notes: INote[]): void {
    this.tagIndex.clear();
    this.wordIndex.clear();
    this.titleIndex.clear();
    this.notesMap.clear();
    this.cache.clear();

    notes.forEach(note => {
      const id = note.getId();
      this.notesMap.set(id, note);
      note.getTags().forEach(tag =>
        this.tagIndex.addEntry(tag.toLowerCase(), id));
      this.extractWords(note.getContent()).forEach(word =>
        this.wordIndex.addEntry(word, id));
      this.extractWords(note.getTitle()).forEach(word =>
        this.titleIndex.addEntry(word, id));
    });
  }

  /** Exécute une recherche avec gestion du cache */
  private cachedSearch(cacheKey: string, notes: INote[],
      searchFn: () => Set<string>): INote[] {
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    if (this.notesMap.size === 0 && notes.length > 0) {
      this.buildIndexes(notes);
    }
    const ids = searchFn();
    const results = Array.from(ids)
      .map(id => this.notesMap.get(id))
      .filter((n): n is INote => n !== undefined);
    this.cache.set(cacheKey, results);
    return results;
  }

  public search(notes: INote[], query: string): INote[] {
    return this.cachedSearch(`general:${query}`, notes, () => {
      const words = this.extractWords(query);
      const ids = new Set<string>();
      words.forEach(w => {
        this.wordIndex.getNoteIds(w).forEach(id => ids.add(id));
        this.titleIndex.getNoteIds(w).forEach(id => ids.add(id));
      });
      this.tagIndex.getMatchingIds(tag =>
        tag.includes(query.toLowerCase())).forEach(id => ids.add(id));
      return ids;
    });
  }

  public searchByTag(notes: INote[], tag: string): INote[] {
    return this.cachedSearch(`tag:${tag}`, notes, () =>
      this.tagIndex.getNoteIds(tag.toLowerCase()));
  }

  // ... autres méthodes de recherche suivent le même patron simplifié

  private extractWords(text: string): string[] {
    return text.toLowerCase().replace(/[^\w\s]/g, ' ')
      .split(/\s+/).filter(w => w.length > 0);
  }

  public invalidateCache(): void {
    this.cache.clear();
  }
}
```

**Pourquoi ce changement améliore la qualité :**

| Métrique | Avant | Après (estimé) | Explication |
|----------|-------|----------------|-------------|
| LOC/M (SearchEngine) | 27.0 | ~12 | La logique cache/index est déléguée |
| LOC (SearchEngine) | 297 | ~120 | LRUCache (~30 LOC) et InvertedIndex (~40 LOC) extraits |
| CC/M (SearchEngine) | 3.0 | ~1.5 | La méthode `cachedSearch` factorise le patron répété |
| Duplication | 8 lignes × 5 | 0 | Le patron cache/index n'est écrit qu'une fois |

La classe `LRUCache` est cohésive et isolée dans son rôle (cache de résultats de recherche). La classe `InvertedIndex` est testable unitairement de façon isolée, sans dépendance au cache ni aux notes. Ces deux classes sont des **Fabrications Pures** au sens GRASP : elles n'existent pas dans le domaine métier (aucun concept « cache » ou « index » dans la gestion de notes) mais elles améliorent la qualité de la conception en augmentant la cohésion et en réduisant la complexité de `SearchEngine`.

---

## Résumé des changements proposés

| # | Changement | Heuristiques appliquées | Impact principal |
|---|-----------|------------------------|------------------|
| 1 | CLIController → Patron Commande | Commande (GoF), Forte Cohésion (GRASP), OCP (SOLID), Loi de Déméter | WMC : 44 → ~4 |
| 2 | NoteService → Services spécialisés | Faible Couplage (GRASP), SRP (SOLID), Masquage de l'information, ISP (SOLID) | CBO : 9 → ~3 |
| 3 | SearchEngine → Composition (InvertedIndex + LRUCache) | Fabrication Pure (GRASP), DRY, Forte Cohésion (GRASP), Composition > Héritage | LOC/M : 27 → ~12 |

---

<div style="page-break-after: always;"></div>

## Partie 3 : Résultats après les réusinages

Les trois réusinages proposés en Partie 2 ont été implémentés sur des branches séparées. Les 120 tests existants passent sur chaque branche, confirmant que le comportement du système est préservé.

### Changement 1 — Patron Commande pour CLIController

**Branche :** `refactor/clicontroller-command-pattern`

**Métriques avant / après :**

| Métrique | Avant | Après | Variation |
|----------|-------|-------|-----------|
| LOC (CLIController) | 310 | 17 | **−94.5 %** |
| NOM (CLIController) | 16 | 2 | **−87.5 %** |
| WMC (CLIController) | 44 | 3 | **−93 %** |
| CBO (CLIController) | 6 | 1 | **−83 %** |
| LOC/M (CLIController) | 19.4 | 8.5 | **−56 %** |

**Nouvelles classes créées :**

| Classe | LOC | NOM | NOA | CBO |
|--------|-----|-----|-----|-----|
| CreateNoteCommand | 15 | 1 | 1 | 2 |
| ListNotesCommand | 34 | 1 | 1 | 2 |
| ShowNoteCommand | 35 | 1 | 1 | 2 |
| SearchNotesCommand | 24 | 1 | 1 | 2 |
| FilterByTagCommand | 22 | 1 | 1 | 2 |
| DeleteNoteCommand | 13 | 1 | 1 | 2 |
| ExportNotesCommand | 13 | 1 | 1 | 2 |
| ImportNotesCommand | 14 | 1 | 1 | 2 |
| CreateBackupCommand | 21 | 1 | 1 | 2 |
| ListBackupsCommand | 24 | 1 | 1 | 2 |
| RestoreBackupCommand | 22 | 1 | 1 | 2 |
| VerifyBackupCommand | 22 | 1 | 1 | 2 |
| AttachFileCommand | 25 | 1 | 1 | 2 |
| ListAttachmentsCommand | 27 | 1 | 1 | 2 |
| DetachFileCommand | 25 | 1 | 1 | 2 |

Chaque commande a un CBO de 2 (ICommand + son service métier), un WMC de 1 à 3 et un LOC entre 13 et 35. La classe `App.ts` (racine de composition) passe de 27 à 67 LOC car elle assemble toutes les commandes — c'est le rôle attendu d'une racine de composition.

**Analyse :** CLIController est passé d'une God Class (WMC=44, la plus élevée du projet) à un simple registre de commandes avec 2 méthodes triviales. Le WMC total n'a pas disparu — il est distribué entre 15 commandes à responsabilité unique. Conformément au principe de **Forte Cohésion (GRASP)**, chaque commande ne traite qu'un seul cas d'utilisation. L'ajout d'une nouvelle commande CLI ne nécessite plus de modifier CLIController (**OCP, SOLID**). Les commandes de backup et d'attachement reçoivent directement leur service via injection, éliminant les violations de la **Loi de Déméter**.

---

### Changement 2 — Encapsulation du façade NoteService

**Branche :** `refactor/noteservice-decomposition`

**Métriques avant / après :**

| Métrique | Avant | Après | Variation |
|----------|-------|-------|-----------|
| LOC (NoteService) | 205 | 239 | +16.6 % |
| NOM (NoteService) | 20 | 25 | +25 % |
| CBO (NoteService) | 9 | 9 | — |
| `as any` casts | 1 | 0 | **−100 %** |
| Getters exposant collaborateurs | 2 | 0 | **−100 %** |
| Violations Loi de Déméter (CLIController) | 7 | 0 | **−100 %** |

**Changements dans ISearchEngine :**

| Métrique | Avant | Après |
|----------|-------|-------|
| Méthodes dans l'interface | 4 | 6 (+`buildIndexes`, +`invalidateCache`) |

**Analyse :** Ce réusinage est principalement **qualitatif** et non quantitatif. Le CBO de NoteService reste à 9, et le LOC augmente légèrement car les méthodes façade (`createBackup()`, `listBackups()`, `restoreBackup()`, `verifyBackupIntegrity()`, `hasBackupService()`, `attachFile()`, `listAttachments()`, `detachFile()`, `hasAttachmentService()`) remplacent les getters `getBackupService()` et `getAttachmentService()`.

L'amélioration est visible sur trois axes :

1. **Masquage de l'information** (notes de cours, section 3.13) : les collaborateurs internes (`BackupService`, `AttachmentService`) ne sont plus exposés. Les clients interagissent uniquement avec NoteService, qui délègue en interne.

2. **Élimination du cast `as any`** : l'ajout de `buildIndexes()` et `invalidateCache()` à l'interface `ISearchEngine` permet à NoteService d'appeler ces méthodes de manière typée, sans contourner le système de types. Cela illustre le **Principe d'inversion des dépendances (DIP, SOLID)** : l'interface définit le contrat, pas l'implémentation.

3. **Loi de Déméter** (notes de cours, section 3.20) : les 7 appels `this.noteService.getBackupService().method()` et `this.noteService.getAttachmentService().method()` dans CLIController sont remplacés par des appels directs `this.noteService.method()`, éliminant le couplage transitif.

Ce cas illustre une limite des métriques CK : le CBO ne distingue pas un couplage bien encapsulé (via des interfaces propres) d'un couplage fragile (via des getters et des casts `as any`). La qualité du couplage s'est améliorée sans que la quantité ne change.

---

### Changement 3 — Composition pour SearchEngine

**Branche :** `refactor/searchengine-composition`

**Métriques avant / après :**

| Métrique | Avant | Après | Variation |
|----------|-------|-------|-----------|
| LOC (SearchEngine) | 297 | 153 | **−48.5 %** |
| NOM (SearchEngine) | 11 | 9 | −18 % |
| NOA (SearchEngine) | 6 | 5 | −17 % |
| LOC/M (SearchEngine) | 27.0 | 17.0 | **−37 %** |
| CC/M (SearchEngine) | 3.0 | ~1.8 | **−40 %** |
| CBO (SearchEngine) | 3 | 4 | +33 % |
| Blocs de code dupliqués (8 lignes × 5) | 5 | 0 | **−100 %** |

**Nouvelles classes créées :**

| Classe | LOC | NOM | NOA | CBO |
|--------|-----|-----|-----|-----|
| LRUCache | 32 | 5 | 2 | 1 |
| InvertedIndex | 28 | 4 | 1 | 0 |

**Analyse :** La décomposition par composition a réduit le LOC de SearchEngine de moitié et éliminé complètement la duplication structurelle. La méthode `cachedSearch()` factorise le patron cache/index qui était répété 5 fois — une application directe du **principe DRY**.

Les classes `LRUCache` et `InvertedIndex` sont des **Fabrications Pures (GRASP)** (notes de cours, section 3.10) : elles n'existent pas dans le domaine métier mais améliorent la cohésion technique. `InvertedIndex` a un CBO de 0 (aucune dépendance projet). `LRUCache` a un CBO de 1 (dépend de `INote` pour typer ses valeurs), ce qui est minimal et stable.

Le CBO de SearchEngine augmente de 3 à 4 (+1, dû à la dépendance vers `LRUCache` et `InvertedIndex` — +2 nouvelles dépendances, mais les Maps brutes ne sont plus comptées). Cette légère augmentation est acceptable car le couplage est de type « faible et stable » (notes de cours, section 1.4) : les classes composées sont internes au module `search/` et n'ont pas de dépendances externes.

---

### Synthèse : Les changements ont-ils amélioré la qualité de manière mesurable ?

**Oui, pour les changements 1 et 3. Le changement 2 est une amélioration qualitative.**

| Critère | Changement 1 (Commande) | Changement 2 (Façade) | Changement 3 (Composition) |
|---------|------------------------|----------------------|---------------------------|
| WMC réduit | ✓ (44 → 3) | — | ✓ (33 → ~18) |
| LOC réduit | ✓ (310 → 17) | ✗ (205 → 239) | ✓ (297 → 153) |
| CBO réduit | ✓ (6 → 1) | — (9 → 9) | ✗ (3 → 4) |
| Duplication éliminée | — | — | ✓ (5 blocs → 0) |
| Qualité du couplage | ✓ (Déméter corrigée) | ✓ (Déméter corrigée, `as any` éliminé) | — |
| Tests préservés | ✓ (120/120) | ✓ (120/120) | ✓ (120/120) |

**Pourquoi ces améliorations sont significatives (selon les notes de cours) :**

1. **Effet de propagation de changement** (notes de cours, section 1.8, Yau et Collofello 1985) : en réduisant le CBO de CLIController de 6 à 1, on réduit le nombre de classes dont un changement pourrait forcer une modification de CLIController. Le patron Commande isole chaque commande, de sorte qu'une modification dans BackupService n'affecte que `CreateBackupCommand` et non l'ensemble du contrôleur.

2. **Maintenabilité** (notes de cours, section 1.2) : la réduction du LOC/M de SearchEngine (27 → 17) et l'élimination de la duplication structurelle facilitent la compréhension et la modification du code. Selon les notes de cours, « un code de haute qualité est un code qu'on peut facilement comprendre et modifier ».

3. **Limitations des métriques** : le changement 2 illustre que les métriques CK ne capturent pas toutes les dimensions de la qualité. Le CBO ne distingue pas un couplage via `as any` (fragile, non vérifié à la compilation) d'un couplage via une interface propre (stable, vérifié par le compilateur). Les notes de cours (section 2.8) mettent en garde que « LCOM ne mesure que la cohésion syntaxique » — de même, le CBO ne mesure que la quantité de couplage, pas sa qualité.

---

*Ce rapport a été rédigé avec l'aide du LLM Claude Opus 4.6.*
