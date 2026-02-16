# ci-results — Résultats du pipeline CI/CD

Cette branche est générée automatiquement par le pipeline GitHub Actions du projet NoteManager (TP2 MGL843). Elle ne contient aucun code source — uniquement les artefacts d analyse produits à chaque commit sur main.

## Contenu

| Fichier | Description |
|---------|-------------|
| generated/model.json | Modèle Famix du projet, généré par ts2famix à partir du code TypeScript |
| generated/export_metrics.csv | Métriques par classe (NOM, NOA, LOC), exportées par Pharo/Moose |
| generated/rapport_metriques.pdf | Rapport PDF avec graphiques et analyse des métriques |

## Pipeline

Chaque commit sur main déclenche le pipeline suivant :

Tests Jest → ts2famix → Pharo/Moose → Validation (4 niveaux) → Rapport PDF

Les résultats sont ensuite poussés ici. Le message de commit référence le SHA du commit main qui a déclenché la génération.

## Utilisation

- Consulter le rapport : ouvrir generated/rapport_metriques.pdf
- Données brutes : télécharger generated/export_metrics.csv
- Modèle Famix complet : generated/model.json (exploitable dans Moose)

> Ne pas modifier cette branche manuellement — elle est écrasée à chaque exécution du pipeline.
