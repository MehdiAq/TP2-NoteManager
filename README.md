# Gestionnaire de Notes - Architecture Orientée Objet

Un gestionnaire de notes professionnel en TypeScript avec une architecture orientée objet complète, suivant les principes SOLID et les design patterns.

## 📑 Table des matières

- [Architecture](#%EF%B8%8F-architecture)
- [Classes et Responsabilités](#-classes-et-responsabilités)
- [Installation](#-installation)
- [Utilisation](#-utilisation)
- [Tests](#-tests)
- [Rapports CI/CD](#-rapports-cicd)
- [Principes SOLID](#-principes-solid-appliqués)
- [Extensibilité](#-extensibilité)
- [Diagramme de classes](#-diagramme-de-classes-simplifié)
- [Points d'apprentissage](#-points-dapprentissage)
- [Rapports de TP](#-rapports-de-tp)
- [Licence](#-licence)
- [Auteur](#-auteur)

## 🏗️ Architecture

### Principes de conception

- **Séparation des préoccupations** : Chaque classe a une responsabilité unique
- **Injection de dépendances** : Les dépendances sont injectées via les constructeurs
- **Interfaces** : Contrats clairs entre les composants
- **Factory Pattern** : Création centralisée des objets Note
- **Repository Pattern** : Abstraction de la couche de données
- **Service Layer** : Logique métier isolée
- **MVC Pattern** : Contrôleur CLI pour gérer les interactions utilisateur
- **Singleton Pattern** : Instance unique de l'application

### Structure du projet

```
notes-manager-oo/
├── src/
│   ├── interfaces/           # Contrats et interfaces
│   │   ├── INote.ts         # Interface pour les notes
│   │   ├── IStorage.ts      # Interface pour le stockage
│   │   ├── IRepository.ts   # Interface pour le repository
│   │   └── ISearchEngine.ts # Interface pour la recherche
│   │
│   ├── models/              # Modèles de domaine
│   │   ├── Note.ts          # Classe Note avec logique métier
│   │   └── Tag.ts           # Classe Tag
│   │
│   ├── repositories/        # Couche d'accès aux données
│   │   └── NoteRepository.ts
│   │
│   ├── storage/             # Implémentations de stockage
│   │   └── JsonStorage.ts
│   │
│   ├── search/              # Moteur de recherche
│   │   └── SearchEngine.ts
│   │
│   ├── services/            # Logique métier
│   │   └── NoteService.ts
│   │
│   ├── factories/           # Factory pour création d'objets
│   │   └── NoteFactory.ts
│   │
│   ├── controllers/         # Contrôleurs
│   │   └── CLIController.ts
│   │
│   ├── App.ts               # Point d'entrée de l'application (Singleton)
│   └── index.ts             # CLI principal
│
├── tests/
│   └── notes.test.ts        # Tests fonctionnels complets
│
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## 📦 Classes et Responsabilités

### Interfaces

- **INote** : Définit le contrat pour une note
- **IStorage** : Définit les opérations de stockage/récupération
- **IRepository** : Définit les opérations CRUD
- **ISearchEngine** : Définit les opérations de recherche

### Modèles

- **Note** : Représente une note avec toute sa logique métier (getters, setters, validation)
- **Tag** : Représente une étiquette avec comparaison insensible à la casse

### Couche Données

- **NoteRepository** : Gère la collection de notes en mémoire (utilise une Map)
- **JsonStorage** : Implémentation du stockage en JSON

### Couche Métier

- **SearchEngine** : Moteur de recherche avec différents critères
- **NoteService** : Orchestration de la logique métier (CRUD + recherche + persistance)
- **NoteFactory** : Fabrique pour créer des instances de Note

### Couche Présentation

- **CLIController** : Gère les interactions avec l'utilisateur via CLI
- **App** : Singleton qui configure et initialise l'application

## 🚀 Installation

```bash
# Créer la structure
mkdir notes-manager-oo
cd notes-manager-oo

# Créer les dossiers
mkdir -p src/{interfaces,models,repositories,storage,search,services,factories,controllers}
mkdir tests
mkdir -p .github/workflows

# Copier tous les fichiers depuis les artifacts

# Installer les dépendances
npm install

# Compiler
npm run build

# Exécuter les tests
npm test
```

## 💻 Utilisation

### Créer une note

```bash
npm run dev -- create -t "Réunion équipe" -c "Préparer présentation" -g "travail,urgent"
```

### Lister toutes les notes

```bash
# Liste simple
npm run dev -- list

# Liste détaillée
npm run dev -- list -v
```

### Afficher une note

```bash
npm run dev -- show -i <note-id>
```

### Rechercher

```bash
npm run dev -- search -q "projet"
```

### Filtrer par tag

```bash
npm run dev -- tag -t "travail"
```

### Supprimer

```bash
npm run dev -- delete -i <note-id>
```

### Export/Import

```bash
# Exporter
npm run dev -- export -o ./backup.json

# Importer (remplace tout)
npm run dev -- import -i ./backup.json

# Importer (fusion)
npm run dev -- import -i ./backup.json -m
```

## 🧪 Tests

Le projet inclut des tests fonctionnels complets (28 tests) qui couvrent :

- Toutes les fonctionnalités principales
- Les classes individuelles
- Les scénarios d'utilisation complets
- La persistance des données

```bash
# Exécuter tous les tests
npm test

# Mode watch
npm run test:watch
```

## 📈 Rapports CI/CD

Les rapports de métriques sont générés automatiquement par le workflow GitHub Actions **CI - Tests, Analyse & Métriques** :

- sur `push` vers `main`/`master` → publication dans `ci-results/generated/main/`
- sur `pull_request` vers `main`/`master` → publication dans `ci-results/generated/pr-<numéro>/`

### Générer les rapports après les dernières modifications

1. Pousser les changements sur `main` (ou merger une PR dans `main`) pour déclencher le pipeline de `main`.
2. Mettre à jour la PR concernée (ex. **PR #4**) pour déclencher son pipeline PR.
3. Vérifier les runs dans l'onglet **Actions**.

### Consulter les rapports générés

- Branche de résultats : `ci-results`
- Rapport `main` : `generated/main/rapport_metriques.pdf`
- Rapport PR #4 : `generated/pr-4/rapport_metriques.pdf`
- Données associées : `export_metrics.csv`, `model.json`, `graphs/*.png`

Liens directs :

- `https://github.com/MehdiAq/TP2-NoteManager/tree/ci-results/generated/main`
- `https://github.com/MehdiAq/TP2-NoteManager/tree/ci-results/generated/pr-4`

## 🎯 Principes SOLID Appliqués

### Single Responsibility Principle (SRP)
Chaque classe a une seule raison de changer :
- `Note` : Gérer les données d'une note
- `NoteRepository` : Gérer la collection de notes
- `JsonStorage` : Gérer la persistance JSON
- `SearchEngine` : Gérer la recherche
- `NoteService` : Orchestrer la logique métier
- `CLIController` : Gérer l'interface CLI

### Open/Closed Principle (OCP)
Le système est ouvert à l'extension mais fermé à la modification :
- On peut ajouter de nouveaux types de stockage en implémentant `IStorage`
- On peut ajouter de nouveaux moteurs de recherche en implémentant `ISearchEngine`

### Liskov Substitution Principle (LSP)
Les implémentations peuvent être substituées par leurs interfaces :
- `JsonStorage` peut être remplacé par n'importe quelle implémentation de `IStorage`
- `SearchEngine` peut être remplacé par n'importe quelle implémentation de `ISearchEngine`

### Interface Segregation Principle (ISP)
Les interfaces sont spécifiques et ciblées :
- `INote` : Opérations sur une note
- `IStorage` : Opérations de stockage
- `IRepository` : Opérations CRUD
- `ISearchEngine` : Opérations de recherche

### Dependency Inversion Principle (DIP)
Les classes dépendent d'abstractions, pas d'implémentations concrètes :
- `NoteService` dépend de `IRepository`, `IStorage` et `ISearchEngine`
- Les implémentations concrètes sont injectées via le constructeur

## 🔧 Extensibilité

### Ajouter un nouveau type de stockage

```typescript
// Créer une nouvelle classe qui implémente IStorage
export class SQLiteStorage implements IStorage {
  load(): INote[] { /* ... */ }
  save(notes: INote[]): void { /* ... */ }
  export(path: string, notes: INote[]): void { /* ... */ }
  import(path: string): INote[] { /* ... */ }
}

// L'utiliser dans App.ts
const storage = new SQLiteStorage('notes.db');
const noteService = new NoteService(repository, storage, searchEngine);
```

### Ajouter une nouvelle fonctionnalité de recherche

```typescript
// Étendre SearchEngine ou créer une nouvelle implémentation
export class AdvancedSearchEngine implements ISearchEngine {
  // Implémenter les méthodes requises
  // Ajouter de nouvelles méthodes
  searchByDateRange(notes: INote[], start: Date, end: Date): INote[] {
    // Logique personnalisée
  }
}
```

## 📊 Diagramme de classes (simplifié)

```
┌─────────────┐
│     App     │ (Singleton)
└──────┬──────┘
       │
       ├──────────────────┐
       │                  │
┌──────▼──────┐    ┌──────▼──────────┐
│ NoteService │────│ CLIController   │
└──────┬──────┘    └─────────────────┘
       │
       ├─────────────┬──────────────┬────────────────┐
       │             │              │                │
┌──────▼──────┐ ┌───▼────┐  ┌──────▼────┐   ┌──────▼─────────┐
│ Repository  │ │Storage │  │SearchEngine│   │  NoteFactory   │
└──────┬──────┘ └───┬────┘  └──────┬────┘   └────────────────┘
       │            │               │
       │            │               │
┌──────▼──────┐ ┌──▼───────┐ ┌─────▼──────┐
│  IRepository│ │ IStorage │ │ISearchEngine│
└─────────────┘ └──────────┘ └────────────┘
       │            │               │
┌──────▼──────┐    │               │
│    Note     │◄───┴───────────────┘
└──────┬──────┘
       │
┌──────▼──────┐
│    INote    │
└─────────────┘
```

## 🎓 Points d'apprentissage

Ce projet démontre :

1. **Architecture en couches** : Séparation claire entre présentation, logique métier et données
2. **Inversion de contrôle** : Les dépendances sont injectées
3. **Programmation par contrat** : Utilisation intensive d'interfaces
4. **Encapsulation** : Les données sont privées, accessibles via des méthodes publiques
5. **Composition over inheritance** : Utilisation de la composition plutôt que l'héritage
6. **Design patterns** : Singleton, Factory, Repository, Service Layer
7. **Testabilité** : Architecture facilitant les tests unitaires et fonctionnels

## 📄 Rapports de TP

| TP | Rapport | Description |
|----|---------|-------------|
| TP1 | [Rapport TP1](rapports/rapport_TP1.md) | Création du projet TypeScript avec l'IA, modélisation avec Moose/Roassal |
| TP2 | *(à venir)* | |

## 📝 Licence

MIT

## 👨‍💻 Auteur

Développé avec TypeScript en suivant les meilleures pratiques d'architecture logicielle.
