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
    Transcript show: 'model.json not found'; cr.
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

writer nextPut: #( 'Nom_Classe' 'Nb_Methodes' 'Nb_Attributs' 'Lignes_de_Code' 'WMC' 'DIT' 'CBO' 'LCOM' ).

classes do: [ :each |
    | loc anchor srcFile content snippet wmc dit cbo lcom |
    loc := 0.
    anchor := each sourceAnchor.
    (anchor notNil and: [ anchor isKindOf: FamixTypeScriptIndexedFileAnchor ]) ifTrue: [
        srcFile := anchor fileName asFileReference.
        srcFile exists ifTrue: [
            content := srcFile contents.
            snippet := content copyFrom: anchor startPos to: (anchor endPos min: content size).
            loc := snippet lineCount.
        ].
    ].
    loc = 0 ifTrue: [
        loc := each methods inject: 0 into: [ :sum :m | sum + (m numberOfLinesOfCode ifNil: [ 0 ]) ].
    ].

    "WMC: sum of cyclomatic complexity of each method"
    wmc := [ each methods inject: 0 into: [ :sum :m |
        | cc |
        cc := [ m cyclomaticComplexity ] on: Error do: [ :e | 1 ].
        (cc isNil or: [ cc <= 0 ]) ifTrue: [ cc := 1 ].
        sum + cc.
    ] ] on: Error do: [ :e | each numberOfMethods ].

    "DIT: depth of inheritance tree"
    dit := 0.
    [ | current |
        current := each.
        [ current superclass notNil ] whileTrue: [
            dit := dit + 1.
            current := current superclass.
        ].
    ] on: Error do: [ :e | dit := 0 ].

    "CBO: coupling between objects (bidirectional)"
    cbo := [ | coupled |
        coupled := Set new.
        each methods do: [ :m |
            [ m outgoingInvocations do: [ :inv |
                | target |
                target := [ inv candidates ] on: Error do: [ :e | #() ].
                target do: [ :t |
                    | owner |
                    owner := [ t parentType ] on: Error do: [ :e | nil ].
                    (owner notNil and: [ owner ~= each ]) ifTrue: [ coupled add: owner ].
                ].
            ] ] on: Error do: [ :e | ].
            [ m incomingInvocations do: [ :inv |
                | caller |
                caller := [ inv sender parentType ] on: Error do: [ :e | nil ].
                (caller notNil and: [ caller ~= each ]) ifTrue: [ coupled add: caller ].
            ] ] on: Error do: [ :e | ].
            [ m accesses do: [ :acc |
                | attr owner |
                attr := [ acc variable ] on: Error do: [ :e | nil ].
                owner := (attr notNil) ifTrue: [ [ attr parentType ] on: Error do: [ :e | nil ] ] ifFalse: [ nil ].
                (owner notNil and: [ owner ~= each ]) ifTrue: [ coupled add: owner ].
            ] ] on: Error do: [ :e | ].
        ].
        coupled size
    ] on: Error do: [ :e | 0 ].

    "LCOM: Chidamber-Kemerer — max(0, |P| - |Q|)"
    lcom := [ | nonStubMethods P Q |
        nonStubMethods := each methods reject: [ :m |
            ([ m isStub ] on: Error do: [ :e | false ])
            or: [ ([ m name ] on: Error do: [ :e | '' ]) = 'constructor' ]
        ].
        P := 0.
        Q := 0.
        1 to: nonStubMethods size do: [ :i |
            | mi attrsI |
            mi := nonStubMethods at: i.
            attrsI := ([ mi accesses collect: [ :a | [ a variable ] on: Error do: [ :e | nil ] ] ] on: Error do: [ :e | #() ]) reject: [ :x | x isNil ].
            i + 1 to: nonStubMethods size do: [ :j |
                | mj attrsJ |
                mj := nonStubMethods at: j.
                attrsJ := ([ mj accesses collect: [ :a | [ a variable ] on: Error do: [ :e | nil ] ] ] on: Error do: [ :e | #() ]) reject: [ :x | x isNil ].
                (attrsI intersection: attrsJ) isEmpty
                    ifTrue: [ P := P + 1 ]
                    ifFalse: [ Q := Q + 1 ].
            ].
        ].
        (P - Q) max: 0
    ] on: Error do: [ :e | 0 ].

    Transcript show: '  ', each name, ' loc:', loc printString,
        ' wmc:', wmc printString, ' dit:', dit printString,
        ' cbo:', cbo printString, ' lcom:', lcom printString; cr.
    writer nextPut: {
        each name.
        each numberOfMethods.
        each numberOfAttributes.
        loc.
        wmc.
        dit.
        cbo.
        lcom.
    }.
].

stream close.

Transcript show: 'Export complete - export_metrics.csv'; cr.
