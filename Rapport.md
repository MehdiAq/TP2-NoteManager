Rapport

3.1.0 - 

Pour cette partie, nous avons utilisé Claude afin de vibecoder le projet. Le prompt, disponible en Annexe, a été rédigé à partir de l'énoncé de TP en reprenant les éléments importants relatifs aux fonctionnalités et contraintes attendus. Dans un premier temps, nous avions généré un projet ne contenant qu'une seule classe, mais cela ne présentait pas d'intérêt pour la visualisation Roassal (pas de comparaisons entre classes possible), c'est pour cela que nous avons choisi de reprendre notre prompt en ajoutant la phrase suivante : 

"Il faut que le projet utilise un design orienté objet avec l’implication de plusieurs classes différentes."

Cela nous a permis d'obtenir un projet beaucoup disposant d'un design fortement orienté objet avec de multiples classes. Ce choix a également été réalisé en prévision du TP2, nous aurions dans tous les cas due regénérer un projet avec plusieurs classes sur les recommandations du professeur.

Ce processus de vibecoding nous a pris au total 30 minutes (20 minutes pour la première génération et 10 minutes pour la première génération).

3.1.3 -

1. Oui, dans le cadre d'un cours. Le projet était de réaliser une application android en vibecoding. Cette première expérience était concluante malgré beaucoup de difficultés : le projet demandait d'avoir plusieurs classes et c'était un vrai challenge de débugger lorsqu'il y avait des problèmes. Pour ce projet, Claude, DeepSeek ainsi que ChatGPT ont été utilisés.

2. Pour ce projet TypeScript, l'utilisation de l'IA a été très simple. Claude a pu nous donner une solution satisfaisante répondant aux critères de fonctionnalités en seulement un prompt (cf. Annexe). Un point positif est la création spontanée par Claude d'un fichier README expliquant clairement comment utiliser le logiciel généré. Aucune difficulté n'est à signaler pour la réalisation de ce projet en vibecoding.

3. Ce projet a pris 20minute : rédaction du prompt, création à la main des différents fichiers avec le code fourni par Claude à copier-coller, tests rapides avec les commandes fournies par le README, puis exécution des tests automatisés générés par Claude. Cela respecte largement le temps suggéré.


3.2 -

Nous avons pu, avec l'aide du professeur, utiliser la commande "npm update -g ts2famix" afin de générer notre modèle json pour qu'il puisse être compatible avec la visualisation Roassal dans Moose.

1. Le modèle généré par ts2famix permet, à partir du code source, de représenter la structure du code. Ce modèle permet donc d'avoir une idée claire de ce qui se passe dans le code source.

2. Modèle de classes TypeScript en UML : Visualisation des différentes classes du projet et de leurs interactions. Permet de comprendre rapidement la structure d'un projet sans rentrer dans les détails de la structure du code source. 
3. Modèle ts2famix : Permet de visualiser plus en détail ce qui se passe au sein même des classes (accès aux attributs, appel aux méthodes...)




Annexe -

Annexe 1. Dépôt Github du projet 

https://github.com/NahelMzg/TP1-NoteManager

Annexe 2. Visualisation Roassal des classes du projet

![Architecture diagram](images/classGraphRoassal.png)

Annexe 3. Prompt utilisé pour généré le projet TypeScript -

Tu es un codeur expérimenté et tu dois réaliser un petit logiciel simple de création de  notes en Typescript dont les spécifications te sont données ci-après. A partir de ces spécifications, prends les initiatives nécessaires pour réaliser ce logiciel, avec ou sans interface utilisateur, selon ce que tu penses être la meilleure solution. Il faut que le projet utilise un design orienté objet avec l’implication de plusieurs classes différentes.

Voici les fonctionnalités minimales du logiciel :
— Créer des notes
— Afficher (lister) des notes
— Associer des étiquettes (tags)
— Rechercher des notes
— Sauvegarder (exporter) les notes localement


Voici les spécifications du logiciel :
— Langage : TypeScript
— Environnement : Node.js
— Persistance locale (ex. fichier JSON, SQLite, etc.)
— Interface : CLI ou API REST simple
— Tests automatisés : tests de fonctionnalité avec Jest

Voici les contraintes sur les tests :
— Utiliser le framework de test Jest pour écrire les tests.
— Les tests doivent être des tests de fonctionnalité (end-to-end ou intégration légère).
— Aucun test unitaire n’est requis ni attendu.
— Cette contrainte est intentionnelle : en l’absence d’une conception modulaire explicite, l’écriture de
tests unitaires serait artificielle et peu représentative de la réalité du code généré.
— Les tests doivent couvrir les fonctionnalités minimales listées ci-dessus.
— Les tests doivent être exécutables via une commande npm (ex. npm test), idéalement dans une
action GitHub lors de chaque commit.
