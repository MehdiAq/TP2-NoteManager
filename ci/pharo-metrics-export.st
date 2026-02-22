"============================================================"
"  pharo-metrics-export.st — Export des métriques CK depuis Moose"
"  Stratégie : API native Moose en priorité, fallback calcul manuel"
"============================================================"

| modelFile model classes stream writer |

"--- 1. Localiser le fichier model.json ---"
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

"--- 2. Charger le modèle JSON dans Moose ---"
"FamixTypeScriptModel est la classe du métamodèle chargée via Metacello"
"(moose-config.ston). importFromJSONStream: lit le JSON et crée les"
"entités Famix en mémoire."
Transcript show: 'Loading model into Moose...'; cr.
modelFile readStreamDo: [ :readStream |
    model := FamixTypeScriptModel new importFromJSONStream: readStream.
    model install.
].
Transcript show: 'Model loaded.'; cr.

"--- 3. Extraire les métriques et écrire le CSV ---"
classes := model allModelClasses.
Transcript show: 'Classes found: ', classes size printString; cr.

stream := './export_metrics.csv' asFileReference writeStream.
writer := NeoCSVWriter on: stream.
writer separator: $;.

writer nextPut: #( 'Nom_Classe' 'Nb_Methodes' 'Nb_Attributs' 'Lignes_de_Code' 'WMC' 'DIT' 'CBO' 'LCOM' ).

classes do: [ :each |
    | loc wmc dit cbo lcom |

    "================================================================"
    "  LOC — Lignes de code source"
    "  Natif : #numberOfLinesOfCode (trait TClass, calculé par Moose"
    "          à partir du sourceAnchor)"
    "  Fallback 1 : lecture directe du fichier source via sourceAnchor"
    "  Fallback 2 : somme des LOC de chaque méthode"
    "================================================================"
    loc := [ | nativeLoc |
        nativeLoc := each numberOfLinesOfCode.
        (nativeLoc notNil and: [ nativeLoc > 0 ])
            ifTrue: [ nativeLoc ]
            ifFalse: [ 0 ]
    ] on: Error do: [ :e | 0 ].

    loc = 0 ifTrue: [
        "Fallback 1 : sourceAnchor → lire le fichier source"
        [ | anchor srcFile content snippet |
            anchor := each sourceAnchor.
            (anchor notNil and: [ anchor isKindOf: FamixTypeScriptIndexedFileAnchor ]) ifTrue: [
                srcFile := anchor fileName asFileReference.
                srcFile exists ifTrue: [
                    content := srcFile contents.
                    snippet := content copyFrom: anchor startPos to: (anchor endPos min: content size).
                    loc := snippet lineCount.
                ].
            ].
        ] on: Error do: [ :e | ].
    ].

    loc = 0 ifTrue: [
        "Fallback 2 : somme des LOC des méthodes"
        loc := each methods inject: 0 into: [ :sum :m | sum + (m numberOfLinesOfCode ifNil: [ 0 ]) ].
    ].

    "================================================================"
    "  WMC — Weighted Methods per Class"
    "  Définition CK : somme de la complexité cyclomatique de chaque"
    "  méthode de la classe (Chidamber & Kemerer, 1994)."
    "  Pas de message natif dans FamixTypeScript, donc calcul via"
    "  #cyclomaticComplexity sur chaque méthode (trait TMethod)."
    "  Fallback : si erreur, WMC = nombre de méthodes (CC=1 chacune)"
    "================================================================"
    wmc := [ each methods inject: 0 into: [ :sum :m |
        | cc |
        cc := [ m cyclomaticComplexity ] on: Error do: [ :e | 1 ].
        (cc isNil or: [ cc <= 0 ]) ifTrue: [ cc := 1 ].
        sum + cc.
    ] ] on: Error do: [ :e | each numberOfMethods ].

    "================================================================"
    "  DIT — Depth of Inheritance Tree"
    "  Définition CK : distance maximale entre la classe et la racine"
    "  de son arborescence d'héritage (Chidamber & Kemerer, 1994)."
    "  Pas de message natif dans FamixTypeScript, donc parcours"
    "  de la chaîne #superclass."
    "================================================================"
    dit := 0.
    [ | current |
        current := each.
        [ current superclass notNil ] whileTrue: [
            dit := dit + 1.
            current := current superclass.
        ].
    ] on: Error do: [ :e | dit := 0 ].

    "================================================================"
    "  CBO — Coupling Between Objects"
    "  Définition CK : nombre d'autres classes auxquelles la classe"
    "  est couplée, toutes directions confondues"
    "  (Chidamber & Kemerer, 1994)."
    "  Natif : #queryAllOutgoingInvocations atTypeScope (Moose Chef)"
    "          + #queryAllIncomingInvocations atTypeScope"
    "  Fallback : parcours manuel des invocations et accès"
    "================================================================"
    cbo := [
        | coupledClasses outgoing incoming |
        coupledClasses := Set new.

        "Dépendances sortantes via Moose Chef"
        outgoing := [ (each queryAllOutgoingInvocations atTypeScope) asSet ]
            on: Error do: [ :e | Set new ].
        outgoing do: [ :cls |
            (cls ~= each) ifTrue: [ coupledClasses add: cls ].
        ].

        "Dépendances entrantes via Moose Chef"
        incoming := [ (each queryAllIncomingInvocations atTypeScope) asSet ]
            on: Error do: [ :e | Set new ].
        incoming do: [ :cls |
            (cls ~= each) ifTrue: [ coupledClasses add: cls ].
        ].

        coupledClasses size
    ] on: Error do: [ :e |
        "Fallback : parcours manuel des invocations et accès aux attributs"
        [ | coupled |
            coupled := Set new.
            each methods do: [ :m |
                [ m outgoingInvocations do: [ :inv |
                    | target |
                    target := [ inv candidates ] on: Error do: [ :err | #() ].
                    target do: [ :t |
                        | owner |
                        owner := [ t parentType ] on: Error do: [ :err | nil ].
                        (owner notNil and: [ owner ~= each ]) ifTrue: [ coupled add: owner ].
                    ].
                ] ] on: Error do: [ :err | ].
                [ m incomingInvocations do: [ :inv |
                    | caller |
                    caller := [ inv sender parentType ] on: Error do: [ :err | nil ].
                    (caller notNil and: [ caller ~= each ]) ifTrue: [ coupled add: caller ].
                ] ] on: Error do: [ :err | ].
                [ m accesses do: [ :acc |
                    | attr owner |
                    attr := [ acc variable ] on: Error do: [ :err | nil ].
                    owner := (attr notNil)
                        ifTrue: [ [ attr parentType ] on: Error do: [ :err | nil ] ]
                        ifFalse: [ nil ].
                    (owner notNil and: [ owner ~= each ]) ifTrue: [ coupled add: owner ].
                ] ] on: Error do: [ :err | ].
            ].
            coupled size
        ] on: Error do: [ :err | 0 ]
    ].

    "================================================================"
    "  LCOM — Lack of Cohesion in Methods"
    "  Définition CK : max(0, |P| - |Q|) où P = paires de méthodes"
    "  sans attribut en commun, Q = paires avec attributs en commun"
    "  (Chidamber & Kemerer, 1994)."
    "  Natif : #lcom (trait TLCOMMetrics hérité par FamixTypeScriptClass)"
    "  Fallback : calcul CK manuel via les accès aux attributs"
    "================================================================"
    lcom := [ | nativeLcom |
        nativeLcom := each lcom.
        (nativeLcom notNil and: [ nativeLcom >= 0 ])
            ifTrue: [ nativeLcom ]
            ifFalse: [ 0 ]
    ] on: Error do: [ :e |
        "Fallback : calcul Chidamber-Kemerer manuel"
        [ | nonStubMethods P Q |
            nonStubMethods := each methods reject: [ :m |
                ([ m isStub ] on: Error do: [ :err | false ])
                or: [ ([ m name ] on: Error do: [ :err | '' ]) = 'constructor' ]
            ].
            P := 0.
            Q := 0.
            1 to: nonStubMethods size do: [ :i |
                | mi attrsI |
                mi := nonStubMethods at: i.
                attrsI := ([ mi accesses collect: [ :a |
                    [ a variable ] on: Error do: [ :err | nil ] ]
                ] on: Error do: [ :err | #() ]) reject: [ :x | x isNil ].
                i + 1 to: nonStubMethods size do: [ :j |
                    | mj attrsJ |
                    mj := nonStubMethods at: j.
                    attrsJ := ([ mj accesses collect: [ :a |
                        [ a variable ] on: Error do: [ :err | nil ] ]
                    ] on: Error do: [ :err | #() ]) reject: [ :x | x isNil ].
                    (attrsI intersection: attrsJ) isEmpty
                        ifTrue: [ P := P + 1 ]
                        ifFalse: [ Q := Q + 1 ].
                ].
            ].
            (P - Q) max: 0
        ] on: Error do: [ :err | 0 ]
    ].

    "--- Écriture dans le Transcript et le CSV ---"
    Transcript show: '  ', each name,
        ' loc:', loc printString,
        ' wmc:', wmc printString,
        ' dit:', dit printString,
        ' cbo:', cbo printString,
        ' lcom:', lcom printString; cr.

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
