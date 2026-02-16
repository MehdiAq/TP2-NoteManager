| modelFile model classes stream writer |

modelFile := './model.json' asFileReference.

modelFile exists ifFalse: [
    modelFile := (Smalltalk os environment at: 'GITHUB_WORKSPACE' ifAbsent: [ '.' ]), '/model.json'.
    modelFile := modelFile asFileReference.
].

Transcript show: 'CI Export Script - Start'; cr.
Transcript show: 'Model file path: ', modelFile fullName; cr.
Transcript show: 'File exists: ', modelFile exists printString; cr.

modelFile exists ifFalse: [
    Transcript show: 'model.json not found - listing directory'; cr.
    '.' asFileReference children do: [ :f | Transcript show: f basename, ' ' ].
    Transcript cr.
    self error: 'model.json not found'.
].

Transcript show: 'Loading model into Moose...'; cr.
modelFile readStreamDo: [ :readStream |
    model := FamixTypeScriptModel new importFromJSONStream: readStream.
    model install.
].
Transcript show: 'Model loaded.'; cr.

classes := model allModelClasses.
Transcript show: 'Classes found: ', classes size printString; cr.

stream := './export_metrics.csv' asFileReference writeStream.
writer := NeoCSVWriter on: stream.
writer separator: $;.

writer nextPut: #( 'Nom_Classe' 'Nb_Methodes' 'Nb_Attributs' 'Lignes_de_Code' ).

classes do: [ :each |
    Transcript show: '  ', each name; cr.
    writer nextPut: {
        each name.
        each numberOfMethods.
        each numberOfAttributes.
        each numberOfLinesOfCode.
    }.
].

stream close.

Transcript show: 'Export complete - export_metrics.csv'; cr.
