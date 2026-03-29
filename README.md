# ci-results — Résultats du pipeline CI/CD

Cette branche est générée automatiquement par le pipeline GitHub Actions du projet NoteManager (TP2 MGL843). Elle ne contient aucun code source — uniquement les artefacts d'analyse produits pour `main` et pour les Pull Requests.

## Contenu

| Fichier | Description |
|---------|-------------|
| `generated/main/*` | Derniers résultats d'analyse pour la branche `main` |
| `generated/pr-<numero>/*` | Résultats d'analyse pour une Pull Request spécifique |

## Métriques collectées

| Métrique | Description | Référence cours |
|----------|-------------|-----------------|
| NOM | Nombre de méthodes par classe | — |
| NOA | Nombre d'attributs par classe | — |
| LOC | Lignes de code par classe | — |
| WMC | Weighted Methods per Class — somme des complexités cyclomatiques | Chidamber & Kemerer |
| DIT | Depth of Inheritance Tree — profondeur dans la hiérarchie d'héritage | Chidamber & Kemerer, §3.3 |
| CBO | Coupling Between Objects — couplage bidirectionnel entre classes | Chidamber & Kemerer |
| LCOM | Lack of Cohesion of Methods — manque de cohésion (formule CK) | Chidamber & Kemerer, §1.5 |

## Pipeline

Chaque exécution du pipeline déclenche le flux suivant :

```
Tests Jest → ts2famix → Pharo/Moose (export CSV) → Validation (4 niveaux) → Rapport PDF → ci-results
```

Les résultats sont ensuite poussés ici dans un sous-dossier dédié (`main` ou `pr-<numero>`). Le message de commit référence le SHA qui a déclenché la génération.

## Utilisation

- Pour `main` : consulter `generated/main/rapport_metriques.pdf`
- Pour une PR : consulter `generated/pr-<numero>/rapport_metriques.pdf`
- Données brutes : `generated/*/export_metrics.csv`
- Modèle Famix complet : `generated/*/model.json` (exploitable dans Moose)
- Graphiques PNG : `generated/*/graphs/`

> Ne pas modifier cette branche manuellement — elle est écrasée à chaque exécution du pipeline.
