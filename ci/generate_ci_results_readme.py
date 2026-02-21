#!/usr/bin/env python3
"""
Génère le README.md de la branche ci-results.
Ce script est exécuté depuis /tmp/ci-output/ lors du déploiement.
"""

readme = """\
# ci-results — Résultats du pipeline CI/CD

Cette branche est générée automatiquement par le pipeline GitHub Actions du projet \
NoteManager (TP2 MGL843). Elle ne contient aucun code source — uniquement les artefacts \
d'analyse produits à chaque commit sur main.

## Contenu

| Fichier | Description |
|---------|-------------|
| `generated/model.json` | Modèle Famix du projet, généré par ts2famix à partir du code TypeScript |
| `generated/export_metrics.csv` | Métriques par classe (NOM, NOA, LOC, WMC, DIT, CBO, LCOM), exportées par Pharo/Moose |
| `generated/rapport_metriques.pdf` | Rapport PDF (11 pages) avec graphiques et analyse des métriques |
| `generated/graphs/*.png` | Graphiques individuels exportés en PNG |

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

Chaque commit sur main déclenche le pipeline suivant :

```
Tests Jest → ts2famix → Pharo/Moose (export CSV) → Validation (4 niveaux) → Rapport PDF → ci-results
```

Les résultats sont ensuite poussés ici. Le message de commit référence le SHA du commit \
main qui a déclenché la génération.

## Utilisation

- Consulter le rapport : ouvrir `generated/rapport_metriques.pdf`
- Données brutes : télécharger `generated/export_metrics.csv`
- Modèle Famix complet : `generated/model.json` (exploitable dans Moose)
- Graphiques PNG : dossier `generated/graphs/`

> Ne pas modifier cette branche manuellement — elle est écrasée à chaque exécution du pipeline.
"""

output_path = 'README.md'
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(readme)

print(f"README.md généré : {output_path}")
