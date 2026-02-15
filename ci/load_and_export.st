"========================================================
 CI Script: Load FamixTypeScript model and export CSV
 This script runs inside a Moose image after FamixTypeScript
 metamodel has been loaded by smalltalkCI.
========================================================"

| modelFile model classes stream writer |

"1. Locate the JSON model file"
modelFile := './model.json' asFileReference.
modelFile exists ifFalse: [
    "Try alternative path (GitHub Actions workspace)"
    modelFile := (Smalltalk os environment
        at: 'GITHUB_WORKSPACE'
        ifAbsent: [ '.' ]), '/model.json'.
    modelFile := modelFile asFileReference.
].

Transcript show: '=== CI Export Script ==='; cr.
Transcript show: 'Model file: ', modelFile fullName; cr.
Transcript show: 'Model exists: ', modelFile exists printString; cr.

modelFile exists ifFalse: [
    Transcript show: 'ERROR: model.json not found!'; cr.
    Transcript show: 'Working directory: ', FileSystem disk workingDirectory fullName; cr.
    Transcript show: 'Contents: '.
    '.' asFileReference children do: [ :f | 
        Transcript show: f basename, ' ' ].
    Transcript cr.
    Error signal: 'model.json not found'.
].

"2. Load the model into Moose"
Transcript show: 'Loading model...'; cr.
modelFile readStreamDo: [ :readStream |
    model := FamixTypeScriptModel new importFromJSONStream: readStream.
    model install.
].
Transcript show: 'Model loaded successfully.'; cr.

"3. Extract all classes"
classes := model allModelClasses.
Transcript show: 'Found ', classes size printString, ' classes.'; cr.

"4. Export to CSV using NeoCSV"
stream := './export_metrics.csv' asFileReference writeStream.
writer := NeoCSVWriter on: stream.
writer separator: $;.

"Header"
writer nextPut: #( 'Nom_Classe' 'Nb_Methodes' 'Nb_Attributs' 'Lignes_de_Code' ).

"Data"
classes do: [ :each |
    Transcript show: '  Exporting: ', each name, 
        ' (methods: ', each numberOfMethods printString, 
        ', attrs: ', each numberOfAttributes printString, 
        ', LOC: ', each numberOfLinesOfCode printString, ')'; cr.
    writer nextPut: {
        each name.
        each numberOfMethods.
        each numberOfAttributes.
        each numberOfLinesOfCode.
    }.
].

stream close.

Transcript show: '=== Export complete: export_metrics.csv ==='; cr.
