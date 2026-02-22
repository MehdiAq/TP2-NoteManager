# Rapport TP2 — Évaluer la qualité d'un projet TypeScript

**Cours** : MGL843 — Sujets avancés en conception logicielle  
**Projet** : NoteManager (TypeScript / Node.js)  
**Dépôt** : [MehdiAq/TP2-NoteManager](https://github.com/MehdiAq/TP2-NoteManager)

---

## Table des matières

- [3.1 Ajouter des exigences au projet TypeScript](#31-ajouter-des-exigences-au-projet-typescript)
  - [Question 1 — Exigences ajoutées et justifications](#question-1--exigences-ajoutées-et-justifications)
  - [Question 2 — Impact sur la complexité et la conception](#question-2--impact-sur-la-complexité-et-la-conception)
- [3.2 Visualiser les métriques du projet TypeScript](#32-visualiser-les-métriques-du-projet-typescript)
  - [Question 1 — Métriques choisies](#question-1--métriques-choisies)
  - [Question 2 — Calcul des métriques supplémentaires](#question-2--calcul-des-métriques-supplémentaires)
  - [Question 3 — Éléments remarquables](#question-3--éléments-remarquables)
  - [Question 4 — Rôle des éléments remarquables](#question-4--rôle-des-éléments-remarquables)
  - [Question 5 — Qualité de la conception](#question-5--qualité-de-la-conception)
- [Annexes](#annexes)

---

## 3.1 Ajouter des exigences au projet TypeScript

### Question 1 — Exigences ajoutées et justifications

Trois nouvelles exigences FURPS ont été ajoutées au projet NoteManager :

**1. Fiabilité (Reliability) — Système de Backup Automatique**

Le système persiste les notes dans un fichier JSON local. Une corruption ou perte de ce fichier entraînerait la perte totale des données. Un mécanisme de backup automatique avec vérification d'intégrité SHA-256 répond à ce risque. Validé par 22 tests incluant l'injection d'erreurs (corruption, permissions, JSON invalide), conformément à la définition FURPS de la fiabilité qui exige une validation par introduction d'erreurs.

**2. Fonctionnalité (Functionality) — Support des Pièces Jointes**

La gestion de notes en texte seul est limitante. Associer des fichiers (PDF, images, code) aux notes enrichit le domaine fonctionnel et augmente la complexité structurelle du projet (nouvelles classes, interfaces, modèle). Validé par 38 tests couvrant le CRUD complet et la persistance.

**3. Performance — Recherche Optimisée (< 100ms pour 1000 notes)**

Sans optimisation, la recherche linéaire O(n) devient un goulot d'étranglement avec le volume de notes. L'ajout d'un index inversé et d'un cache LRU garantit une performance mesurable objectivement. Validé par 21 tests : résultat de 0.28ms pour 1000 notes (objectif < 100ms).

### Question 2 — Impact sur la complexité et la conception

Au TP1, le projet NoteManager avait une conception linéaire : une entité (`Note`), un service (`NoteService`), un contrôleur (`CLIController`) et des utilitaires (`NoteFactory`, `Tag`, `App`). Le flux était simple : CLI → Service → Persistance JSON. Le rapport TP1 identifiait déjà des problèmes de cohésion dans `CLIController` (135 LOC, 9 méthodes) et une entité `Note` surchargée (18 méthodes, 6 attributs).

**Les trois exigences du TP2 augmentent la complexité sur deux axes :**

**1. Complexité structurelle** — Le projet passe de 15 à 24 fichiers sources, de ~800 à ~2500 LOC et de 39 à 120 tests. Cinq nouvelles classes/interfaces apparaissent (`BackupService`, `AttachmentService`, `Attachment`, `IBackupService`, `IAttachmentService`), augmentant le nombre d'entités dans le modèle Famix et les interactions entre elles.

| Métrique | TP1 | TP2 | Augmentation |
|----------|-----|-----|--------------|
| Fichiers sources | 15 | 24 | +60% |
| Lignes de code | ~800 | ~2500 | +210% |
| Tests | 39 | 120 | +208% |

**2. Complexité de conception** — Par rapport au flux linéaire du TP1, le `NoteService` devient un orchestrateur de trois sous-systèmes (backup, attachements, recherche), ce qui augmente son couplage (CBO). Chaque exigence introduit une complexité propre absente au TP1 :

- **Backup** : gestion d'intégrité (SHA-256), politique de rétention et restauration — des responsabilités transversales inexistantes dans le TP1.
- **Pièces jointes** : nouveau modèle de données (`Attachment`) avec son propre cycle de vie et sa persistance séparée, là où le TP1 ne gérait qu'une seule entité (`Note`).
- **Recherche optimisée** : remplacement de la recherche linéaire du TP1 par des structures de données avancées (index inversé, HashMap, cache LRU), augmentant la complexité cyclomatique du `SearchEngine`.

Cependant, l'utilisation d'interfaces (`IBackupService`, `IAttachmentService`) et de l'injection de dépendances limite la propagation du couplage, contrairement au TP1 où le `CLIController` concentrait toute la logique.

---

## 3.2 Visualiser les métriques du projet TypeScript

### Question 1 — Métriques choisies

Nous avons sélectionné **7 métriques primaires** couvrant les dimensions fondamentales de la qualité de conception : la taille, la complexité, le couplage et la cohésion.

| Métrique | Définition | Pourquoi elle est importante |
|----------|-----------|------------------------------|
| **LOC** (Lines of Code) | Nombre de lignes de code source par classe | Métrique la plus simple mais empiriquement la plus fiable pour prédire la prédisposition aux fautes. Plus une classe est volumineuse, plus la probabilité de bogues augmente. |
| **NOM** (Number of Methods) | Nombre de méthodes d'une classe | Indicateur de la taille comportementale. Un NOM élevé peut signaler une classe avec trop de responsabilités, en violation du principe de responsabilité unique (SRP). |
| **NOA** (Number of Attributes) | Nombre d'attributs d'une classe | Indicateur de la taille structurelle. Combiné avec LCOM, il permet de détecter les classes qui stockent des données sans les exploiter de manière cohésive. |
| **WMC** (Weighted Methods per Class) | Somme des complexités cyclomatiques de chaque méthode (Chidamber et Kemerer, 1994) | Deuxième meilleure métrique pour prédire les fautes selon les études empiriques. Un WMC élevé indique une classe complexe, difficile à tester et à maintenir. La revue systématique d'Isong et Obeten (2013) confirme que WMC est une des métriques les moins controversées à travers 29 études empiriques. |
| **DIT** (Depth of Inheritance Tree) | Profondeur maximale dans la hiérarchie d'héritage (Chidamber et Kemerer, 1994) | Un DIT élevé complique la compréhension car les comportements hérités sont répartis sur plusieurs niveaux. L'heuristique « Favoriser la composition plutôt que l'héritage » suggère de limiter cette profondeur. |
| **CBO** (Coupling Between Objects) | Nombre de classes distinctes auxquelles une classe est couplée, de manière bidirectionnelle (Chidamber et Kemerer, 1994) | Selon la revue d'Isong et Obeten, CBO est la métrique la moins controversée pour prédire les fautes. Un CBO élevé fragilise la maintenabilité car un changement dans une classe couplée peut se propager (heuristique GRASP Faible Couplage). |
| **LCOM** (Lack of Cohesion of Methods) | Nombre de paires de méthodes sans attributs communs moins le nombre de paires partageant des attributs, formule CK : max(0, \|P\| − \|Q\|) (Chidamber et Kemerer, 1994) | Mesure la cohésion syntaxique d'une classe. Un LCOM élevé révèle des méthodes qui n'opèrent pas sur les mêmes données, ce qui peut indiquer que la classe regroupe des responsabilités distinctes (violation du SRP). Cependant, comme souligné dans le cours, la cohésion syntaxique diffère de la cohésion sémantique — un LCOM=0 n'implique pas forcément une bonne conception. |

**Justification du choix global :**

Ce jeu de métriques couvre les trois dimensions fondamentales de la qualité de conception identifiées dans le cours : la **taille** (LOC, NOM, NOA), la **complexité** (WMC), le **couplage** (CBO) et la **cohésion** (LCOM). Ces dimensions correspondent directement aux métriques qui, selon les études empiriques, sont les plus significatives pour prédire la prédisposition aux fautes : CBO, WMC et SLOC.

**Choix des seuils :**

Les seuils utilisés pour la classification vert/orange/rouge sont basés sur les recommandations de la littérature :
- **WMC** : vert ≤ 10, orange ≤ 20, rouge > 20
- **CBO** : vert ≤ 4, orange ≤ 8, rouge > 8
- **LCOM** : vert = 0, orange ≤ 3, rouge > 3
- **DIT** : vert ≤ 2, orange ≤ 4, rouge > 4

### Question 2 — Calcul des métriques supplémentaires

*À compléter.*

### Question 3 — Éléments remarquables

*À compléter.*

### Question 4 — Rôle des éléments remarquables

*À compléter.*

### Question 5 — Qualité de la conception

*À compléter.*

---

## Annexes

### Annexe 1 — Dépôt GitHub du projet TypeScript
https://github.com/MehdiAq/TP2-NoteManager

### Annexe 2 — Code Pharo / Moose (export des métriques)
Le script Smalltalk utilisé pour exporter les métriques depuis Moose se trouve dans le même dépôt, dans le fichier [`ci/pharo-metrics-export.st`](https://github.com/MehdiAq/TP2-NoteManager/blob/main/ci/pharo-metrics-export.st). Ce script charge le modèle FamixTypeScript généré par ts2famix, calcule 7 métriques par classe (NOM, NOA, LOC, WMC, DIT, CBO, LCOM) et exporte les résultats en CSV via NeoCSV. Il est exécuté automatiquement par le pipeline CI/CD GitHub Actions.

### Annexe 3 — Détail des exigences FURPS
Voir le fichier [`Note-de-changement-FURPS.md`](../Note-de-changement-FURPS.md) pour la documentation complète des 3 exigences implémentées (architecture, utilisation, résultats de tests).