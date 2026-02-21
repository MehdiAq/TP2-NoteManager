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

> *Les réponses à cette section seront complétées après l'analyse des résultats du pipeline CI.*

### Question 1 — Métriques choisies

*À compléter.*

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

### Annexe 2 — Dépôt GitHub du code Pharo (Moose)
*À compléter.*

### Annexe 3 — Détail des exigences FURPS
Voir le fichier [`Note-de-changement-FURPS.md`](../Note-de-changement-FURPS.md) pour la documentation complète des 3 exigences implémentées (architecture, utilisation, résultats de tests).