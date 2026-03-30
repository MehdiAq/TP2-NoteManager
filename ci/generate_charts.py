#!/usr/bin/env python3
"""
Génération d'un rapport PDF unique contenant les visualisations
des métriques de qualité du projet NoteManager (TP2 MGL843).
"""

import sys
import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib
from matplotlib.backends.backend_pdf import PdfPages
from datetime import datetime

matplotlib.use('Agg')

# ============================================================
# Seuils centralisés
# ============================================================

SEUILS = {
    'LOC_METHODE': {'vert': 8, 'orange': 12},
    'WMC':         {'vert': 10, 'orange': 20},
    'CBO':         {'vert': 4, 'orange': 8},
    'LCOM':        {'vert': 0, 'orange': 3},
    'DIT':         {'vert': 2, 'orange': 4},
}

METRIC_COLUMNS = ['Nb_Methodes', 'Nb_Attributs', 'Lignes_de_Code', 'WMC', 'DIT', 'CBO', 'LCOM']


def couleur_seuil(value, metric_key):
    """Return green/orange/red colour based on thresholds."""
    s = SEUILS[metric_key]
    if value <= s['vert']:
        return '#2ecc71'
    elif value <= s['orange']:
        return '#f39c12'
    else:
        return '#e74c3c'


def save_graph(fig, filename, graphs_dir='graphs'):
    """Save a figure as PNG in graphs_dir."""
    os.makedirs(graphs_dir, exist_ok=True)
    path = os.path.join(graphs_dir, filename)
    fig.savefig(path, dpi=150, bbox_inches='tight')


# ============================================================
# Chargement des données
# ============================================================

def load_csv(csv_path):
    df = pd.read_csv(csv_path, sep=';', quotechar='"')
    for col in ['Nb_Methodes', 'Nb_Attributs', 'Lignes_de_Code', 'WMC', 'DIT', 'CBO', 'LCOM']:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype(int)
    return df


# ============================================================
# Page titre
# ============================================================

def page_titre(pdf):
    fig = plt.figure(figsize=(11, 8.5))
    fig.patch.set_facecolor('#fdfdfd')

    fig.text(0.5, 0.65, 'Rapport de Métriques de Qualité',
             ha='center', va='center', fontsize=28, fontweight='bold', color='#2c3e50')
    fig.text(0.5, 0.55, 'Projet NoteManager — TP2 MGL843',
             ha='center', va='center', fontsize=18, color='#34495e')
    fig.text(0.5, 0.42, 'Analyse automatisée par pipeline CI/CD',
             ha='center', va='center', fontsize=13, color='#7f8c8d')
    fig.text(0.5, 0.37, f'Généré le {datetime.now().strftime("%Y-%m-%d à %H:%M")}',
             ha='center', va='center', fontsize=11, color='#95a5a6')

    ax = fig.add_axes([0.2, 0.48, 0.6, 0.002])
    ax.set_facecolor('#3498db')
    ax.set_xticks([])
    ax.set_yticks([])

    pdf.savefig(fig)
    save_graph(fig, '00_titre.png')
    plt.close(fig)


# ============================================================
# Graphique 1 : Histogramme groupé
# ============================================================

def page_histogramme(pdf, df):
    fig = plt.figure(figsize=(11, 8.5))

    fig.text(0.5, 0.95, '1. Histogramme des métriques par classe',
             ha='center', fontsize=16, fontweight='bold', color='#2c3e50')

    ax = fig.add_axes([0.08, 0.35, 0.88, 0.55])

    x = range(len(df))
    width = 0.25

    bars1 = ax.bar([i - width for i in x], df['Lignes_de_Code'], width,
                   label='Lignes de Code (LOC)', color='#e74c3c', alpha=0.85)
    bars2 = ax.bar(x, df['Nb_Methodes'], width,
                   label='Nb Méthodes (NOM)', color='#3498db', alpha=0.85)
    bars3 = ax.bar([i + width for i in x], df['Nb_Attributs'], width,
                   label='Nb Attributs (NOA)', color='#2ecc71', alpha=0.85)

    ax.set_xlabel('Classes', fontsize=11)
    ax.set_ylabel('Valeur', fontsize=11)
    ax.set_xticks(x)
    ax.set_xticklabels(df['Nom_Classe'], rotation=45, ha='right', fontsize=9)
    ax.legend(fontsize=9, loc='upper right')
    ax.grid(axis='y', alpha=0.3)

    for bar in bars1:
        h = bar.get_height()
        if h > 0:
            ax.annotate(f'{int(h)}', xy=(bar.get_x() + bar.get_width()/2, h),
                       xytext=(0, 3), textcoords="offset points", ha='center', fontsize=7)
    for bar in bars2:
        h = bar.get_height()
        if h > 0:
            ax.annotate(f'{int(h)}', xy=(bar.get_x() + bar.get_width()/2, h),
                       xytext=(0, 3), textcoords="offset points", ha='center', fontsize=7)

    top_loc = df.loc[df['Lignes_de_Code'].idxmax()]
    top_nom = df.loc[df['Nb_Methodes'].idxmax()]

    description = (
        f"Ce graphique compare les trois métriques principales (LOC, NOM, NOA) pour chaque classe "
        f"du projet NoteManager.\n\n"
        f"La classe {top_loc['Nom_Classe']} domine en termes de lignes de code ({int(top_loc['Lignes_de_Code'])} LOC), "
        f"tandis que {top_nom['Nom_Classe']} possède le plus grand nombre de méthodes ({int(top_nom['Nb_Methodes'])}). "
        f"Un déséquilibre entre LOC et NOM peut indiquer des méthodes trop longues ou un manque de "
        f"décomposition fonctionnelle."
    )

    ax_desc = fig.add_axes([0.06, 0.02, 0.88, 0.22])
    ax_desc.axis('off')
    ax_desc.text(0.02, 0.95, description, ha='left', va='top', fontsize=10,
                 color='#2c3e50', wrap=True, linespacing=1.5,
                 transform=ax_desc.transAxes)

    pdf.savefig(fig)
    save_graph(fig, '01_histogramme.png')
    plt.close(fig)


# ============================================================
# Graphique 2 : Scatter LOC vs NOM
# ============================================================

def page_scatter(pdf, df):
    fig = plt.figure(figsize=(11, 8.5))

    fig.text(0.5, 0.95, '2. Diagramme de dispersion — LOC vs NOM',
             ha='center', fontsize=16, fontweight='bold', color='#2c3e50')

    ax = fig.add_axes([0.08, 0.35, 0.82, 0.55])

    sizes = df['Nb_Attributs'] * 100 + 50
    scatter = ax.scatter(df['Nb_Methodes'], df['Lignes_de_Code'],
                        s=sizes, c=df['Lignes_de_Code'], cmap='RdYlGn_r',
                        alpha=0.7, edgecolors='black', linewidth=0.5)

    for _, row in df.iterrows():
        ax.annotate(row['Nom_Classe'],
                    (row['Nb_Methodes'], row['Lignes_de_Code']),
                    xytext=(5, 5), textcoords='offset points', fontsize=9)

    avg_ratio = df['Lignes_de_Code'].sum() / max(df['Nb_Methodes'].sum(), 1)
    x_range = range(0, int(df['Nb_Methodes'].max()) + 5)
    ax.plot(x_range, [avg_ratio * xi for xi in x_range], '--',
            color='gray', alpha=0.5, label=f'Ratio moyen: {avg_ratio:.1f} LOC/méthode')

    ax.set_xlabel('Nombre de méthodes (NOM)', fontsize=11)
    ax.set_ylabel('Lignes de code (LOC)', fontsize=11)
    ax.legend(fontsize=9)
    ax.grid(alpha=0.3)
    plt.colorbar(scatter, ax=ax, label='LOC', shrink=0.8)

    above = df[df['Lignes_de_Code'] > avg_ratio * df['Nb_Methodes']]['Nom_Classe'].tolist()
    below = df[df['Lignes_de_Code'] <= avg_ratio * df['Nb_Methodes']]['Nom_Classe'].tolist()

    description = (
        f"Ce diagramme positionne chaque classe selon son nombre de méthodes (axe X) et ses lignes "
        f"de code (axe Y). La taille des cercles est proportionnelle au nombre d'attributs (NOA). "
        f"La ligne pointillée représente le ratio moyen de {avg_ratio:.1f} LOC par méthode.\n\n"
        f"Classes au-dessus de la moyenne (méthodes plus longues) : {', '.join(above) if above else 'aucune'}.\n"
        f"Classes en dessous (méthodes plus concises) : {', '.join(below) if below else 'aucune'}."
    )

    ax_desc = fig.add_axes([0.06, 0.02, 0.88, 0.22])
    ax_desc.axis('off')
    ax_desc.text(0.02, 0.95, description, ha='left', va='top', fontsize=10,
                 color='#2c3e50', wrap=True, linespacing=1.5,
                 transform=ax_desc.transAxes)

    pdf.savefig(fig)
    save_graph(fig, '02_scatter.png')
    plt.close(fig)


# ============================================================
# Graphique 3 : Densité de code (LOC/méthode)
# ============================================================

def page_densite(pdf, df):
    fig = plt.figure(figsize=(11, 8.5))

    fig.text(0.5, 0.95, '3. Densité de code par classe (LOC / méthode)',
             ha='center', fontsize=16, fontweight='bold', color='#2c3e50')

    ax = fig.add_axes([0.15, 0.35, 0.78, 0.55])

    df_sorted = df.copy()
    df_sorted['LOC_par_Methode'] = df_sorted['Lignes_de_Code'] / df_sorted['Nb_Methodes'].replace(0, 1)
    df_sorted = df_sorted.sort_values('LOC_par_Methode', ascending=True)

    colors = [couleur_seuil(v, 'LOC_METHODE') for v in df_sorted['LOC_par_Methode']]

    bars = ax.barh(df_sorted['Nom_Classe'], df_sorted['LOC_par_Methode'], color=colors, alpha=0.85)
    ax.axvline(x=10, color='red', linestyle='--', alpha=0.5, label='Seuil recommandé (10 LOC/méthode)')

    for bar, val in zip(bars, df_sorted['LOC_par_Methode']):
        ax.text(bar.get_width() + 0.3, bar.get_y() + bar.get_height()/2,
                f'{val:.1f}', va='center', fontsize=10)

    ax.set_xlabel('LOC par méthode', fontsize=11)
    ax.legend(fontsize=9)
    ax.grid(axis='x', alpha=0.3)

    high_density = df_sorted[df_sorted['LOC_par_Methode'] > 10]['Nom_Classe'].tolist()
    avg_density = df_sorted['LOC_par_Methode'].mean()

    description = (
        f"Ce graphique montre le ratio LOC/méthode pour chaque classe, trié par ordre croissant. "
        f"Il permet d'identifier les classes dont les méthodes sont trop longues.\n\n"
        f"Vert = bon (< 8 LOC/méthode), Orange = acceptable (8-12), Rouge = à surveiller (> 12).\n"
        f"La densité moyenne du projet est de {avg_density:.1f} LOC/méthode. "
    )
    if high_density:
        description += (
            f"Les classes dépassant le seuil de 10 sont : {', '.join(high_density)}. "
            f"Elles pourraient bénéficier d'une décomposition en sous-méthodes."
        )
    else:
        description += "Toutes les classes sont sous le seuil de 10, ce qui est un bon indicateur."

    ax_desc = fig.add_axes([0.06, 0.02, 0.88, 0.22])
    ax_desc.axis('off')
    ax_desc.text(0.02, 0.95, description, ha='left', va='top', fontsize=10,
                 color='#2c3e50', wrap=True, linespacing=1.5,
                 transform=ax_desc.transAxes)

    pdf.savefig(fig)
    save_graph(fig, '03_densite.png')
    plt.close(fig)


# ============================================================
# Page 4 — WMC
# ============================================================

def page_wmc(pdf, df):
    fig = plt.figure(figsize=(11, 8.5))

    fig.text(0.5, 0.95, '4. WMC — Weighted Methods per Class',
             ha='center', fontsize=16, fontweight='bold', color='#2c3e50')

    ax = fig.add_axes([0.15, 0.35, 0.78, 0.55])

    df_sorted = df.copy()
    df_sorted = df_sorted.sort_values('WMC', ascending=True)

    colors = [couleur_seuil(v, 'WMC') for v in df_sorted['WMC']]
    bars = ax.barh(df_sorted['Nom_Classe'], df_sorted['WMC'], color=colors, alpha=0.85)

    ax.axvline(x=SEUILS['WMC']['vert'], color='orange', linestyle='--', alpha=0.6,
               label=f'Seuil acceptable ({SEUILS["WMC"]["vert"]})')
    ax.axvline(x=SEUILS['WMC']['orange'], color='red', linestyle='--', alpha=0.6,
               label=f'Seuil critique ({SEUILS["WMC"]["orange"]})')

    for bar, val in zip(bars, df_sorted['WMC']):
        ax.text(bar.get_width() + 0.3, bar.get_y() + bar.get_height()/2,
                str(int(val)), va='center', fontsize=10)

    ax.set_xlabel('WMC (somme des complexités cyclomatiques)', fontsize=11)
    ax.legend(fontsize=9)
    ax.grid(axis='x', alpha=0.3)

    df_sorted['CC_par_Methode'] = df_sorted['WMC'] / df_sorted['Nb_Methodes'].replace(0, 1)
    avg_cc = df_sorted['CC_par_Methode'].mean()
    high_wmc = df_sorted[df_sorted['WMC'] > SEUILS['WMC']['orange']]['Nom_Classe'].tolist()

    description = (
        f"WMC (Weighted Methods per Class) représente la somme des complexités cyclomatiques (CC) "
        f"de chaque méthode. Un WMC élevé indique une classe complexe et difficile à tester.\n\n"
        f"La CC moyenne par méthode est de {avg_cc:.2f}. "
        f"Vert = bon (WMC ≤ {SEUILS['WMC']['vert']}), Orange = acceptable (≤ {SEUILS['WMC']['orange']}), Rouge = critique.\n"
    )
    if high_wmc:
        description += (
            f"Classes critiques : {', '.join(high_wmc)}. "
            f"Recommandation GRASP Forte Cohésion : décomposer en classes plus petites "
            f"avec des responsabilités bien définies."
        )
    else:
        description += "Toutes les classes ont un WMC acceptable — bonne maîtrise de la complexité."

    ax_desc = fig.add_axes([0.06, 0.02, 0.88, 0.22])
    ax_desc.axis('off')
    ax_desc.text(0.02, 0.95, description, ha='left', va='top', fontsize=10,
                 color='#2c3e50', wrap=True, linespacing=1.5,
                 transform=ax_desc.transAxes)

    pdf.savefig(fig)
    save_graph(fig, '04_wmc.png')
    plt.close(fig)


# ============================================================
# Page 5 — CBO
# ============================================================

def page_cbo(pdf, df):
    fig = plt.figure(figsize=(11, 8.5))

    fig.text(0.5, 0.95, '5. CBO — Coupling Between Objects',
             ha='center', fontsize=16, fontweight='bold', color='#2c3e50')

    ax = fig.add_axes([0.15, 0.35, 0.78, 0.55])

    df_sorted = df.copy().sort_values('CBO', ascending=True)
    colors = [couleur_seuil(v, 'CBO') for v in df_sorted['CBO']]
    bars = ax.barh(df_sorted['Nom_Classe'], df_sorted['CBO'], color=colors, alpha=0.85)

    ax.axvline(x=SEUILS['CBO']['vert'], color='orange', linestyle='--', alpha=0.6,
               label=f'Seuil acceptable ({SEUILS["CBO"]["vert"]})')
    ax.axvline(x=SEUILS['CBO']['orange'], color='red', linestyle='--', alpha=0.6,
               label=f'Seuil critique ({SEUILS["CBO"]["orange"]})')

    for bar, val in zip(bars, df_sorted['CBO']):
        ax.text(bar.get_width() + 0.1, bar.get_y() + bar.get_height()/2,
                str(int(val)), va='center', fontsize=10)

    ax.set_xlabel('CBO (nombre de classes couplées)', fontsize=11)
    ax.legend(fontsize=9)
    ax.grid(axis='x', alpha=0.3)

    high_cbo = df_sorted[df_sorted['CBO'] > SEUILS['CBO']['orange']]['Nom_Classe'].tolist()
    avg_cbo = df_sorted['CBO'].mean()

    description = (
        f"CBO (Coupling Between Objects) mesure le couplage bidirectionnel entre classes "
        f"(invocations entrantes + sortantes + accès aux attributs). "
        f"Un CBO élevé fragilise la maintenabilité.\n\n"
        f"CBO moyen du projet : {avg_cbo:.1f}. "
        f"Vert = bon (≤ {SEUILS['CBO']['vert']}), Orange = acceptable (≤ {SEUILS['CBO']['orange']}), Rouge = critique.\n"
    )
    if high_cbo:
        description += (
            f"Classes à fort couplage : {', '.join(high_cbo)}. "
            f"Recommandations : GRASP Faible Couplage, principe DIP (Dependency Inversion), "
            f"ou patron Façade pour réduire les dépendances directes."
        )
    else:
        description += "Toutes les classes présentent un couplage maîtrisé — bonne application du Faible Couplage."

    ax_desc = fig.add_axes([0.06, 0.02, 0.88, 0.22])
    ax_desc.axis('off')
    ax_desc.text(0.02, 0.95, description, ha='left', va='top', fontsize=10,
                 color='#2c3e50', wrap=True, linespacing=1.5,
                 transform=ax_desc.transAxes)

    pdf.savefig(fig)
    save_graph(fig, '05_cbo.png')
    plt.close(fig)


# ============================================================
# Page 6 — LCOM
# ============================================================

def page_lcom(pdf, df):
    fig = plt.figure(figsize=(11, 8.5))

    fig.text(0.5, 0.95, '6. LCOM — Lack of Cohesion of Methods',
             ha='center', fontsize=16, fontweight='bold', color='#2c3e50')

    ax = fig.add_axes([0.15, 0.35, 0.78, 0.55])

    df_sorted = df.copy().sort_values('LCOM', ascending=True)
    colors = [couleur_seuil(v, 'LCOM') for v in df_sorted['LCOM']]
    bars = ax.barh(df_sorted['Nom_Classe'], df_sorted['LCOM'], color=colors, alpha=0.85)

    ax.axvline(x=SEUILS['LCOM']['orange'], color='orange', linestyle='--', alpha=0.6,
               label=f'Seuil attention ({SEUILS["LCOM"]["orange"]})')

    for bar, val in zip(bars, df_sorted['LCOM']):
        ax.text(bar.get_width() + 0.1, bar.get_y() + bar.get_height()/2,
                str(int(val)), va='center', fontsize=10)

    ax.set_xlabel('LCOM (manque de cohésion — Chidamber-Kemerer)', fontsize=11)
    ax.legend(fontsize=9)
    ax.grid(axis='x', alpha=0.3)

    high_lcom = df_sorted[df_sorted['LCOM'] > SEUILS['LCOM']['orange']]['Nom_Classe'].tolist()
    avg_lcom = df_sorted['LCOM'].mean()

    description = (
        f"LCOM (Lack of Cohesion of Methods) mesure le nombre de paires de méthodes sans attributs "
        f"communs, moins le nombre de paires partageant des attributs (formule CK, min=0). "
        f"Un LCOM élevé révèle une faible cohésion syntaxique.\n\n"
        f"LCOM moyen : {avg_lcom:.1f}. Vert = cohésif (LCOM = 0), Orange = attention (≤ {SEUILS['LCOM']['orange']}), Rouge = critique.\n"
        f"Note (§1.5 du cours) : la cohésion syntaxique (LCOM) diffère de la cohésion sémantique — "
        f"un LCOM=0 n'implique pas nécessairement une bonne conception.\n"
    )
    if high_lcom:
        description += (
            f"Classes à faible cohésion : {', '.join(high_lcom)}. "
            f"Recommandation SOLID SRP : chaque classe devrait avoir une seule responsabilité. "
            f"Envisager de séparer les responsabilités distinctes."
        )
    else:
        description += "Toutes les classes présentent une cohésion syntaxique acceptable."

    ax_desc = fig.add_axes([0.06, 0.02, 0.88, 0.22])
    ax_desc.axis('off')
    ax_desc.text(0.02, 0.95, description, ha='left', va='top', fontsize=10,
                 color='#2c3e50', wrap=True, linespacing=1.5,
                 transform=ax_desc.transAxes)

    pdf.savefig(fig)
    save_graph(fig, '06_lcom.png')
    plt.close(fig)


# ============================================================
# Page 7 — DIT
# ============================================================

def page_dit(pdf, df):
    fig = plt.figure(figsize=(11, 8.5))

    fig.text(0.5, 0.95, '7. DIT — Depth of Inheritance Tree',
             ha='center', fontsize=16, fontweight='bold', color='#2c3e50')

    ax = fig.add_axes([0.15, 0.35, 0.78, 0.55])

    df_sorted = df.copy().sort_values('DIT', ascending=True)
    colors = [couleur_seuil(v, 'DIT') for v in df_sorted['DIT']]
    bars = ax.barh(df_sorted['Nom_Classe'], df_sorted['DIT'], color=colors, alpha=0.85)

    ax.axvline(x=SEUILS['DIT']['vert'], color='orange', linestyle='--', alpha=0.6,
               label=f'Seuil acceptable ({SEUILS["DIT"]["vert"]})')
    ax.axvline(x=SEUILS['DIT']['orange'], color='red', linestyle='--', alpha=0.6,
               label=f'Seuil critique ({SEUILS["DIT"]["orange"]})')

    for bar, val in zip(bars, df_sorted['DIT']):
        ax.text(bar.get_width() + 0.05, bar.get_y() + bar.get_height()/2,
                str(int(val)), va='center', fontsize=10)

    ax.set_xlabel('DIT (profondeur dans la hiérarchie d\'héritage)', fontsize=11)
    ax.legend(fontsize=9)
    ax.grid(axis='x', alpha=0.3)

    high_dit = df_sorted[df_sorted['DIT'] > SEUILS['DIT']['orange']]['Nom_Classe'].tolist()
    avg_dit = df_sorted['DIT'].mean()

    description = (
        f"DIT (Depth of Inheritance Tree) mesure la profondeur d'une classe dans la hiérarchie "
        f"d'héritage. Un DIT élevé complique la compréhension et la maintenance.\n\n"
        f"DIT moyen : {avg_dit:.1f}. "
        f"Vert = bon (≤ {SEUILS['DIT']['vert']}), Orange = acceptable (≤ {SEUILS['DIT']['orange']}), Rouge = critique.\n"
    )
    if high_dit:
        description += (
            f"Classes à héritage profond : {', '.join(high_dit)}. "
            f"Heuristique (§3.3 du cours) : « Favoriser la composition plutôt que l'héritage ». "
            f"Envisager de remplacer certains niveaux d'héritage par de la délégation ou des interfaces."
        )
    else:
        description += (
            f"Toutes les classes présentent une hiérarchie d'héritage raisonnable. "
            f"Le projet favorise la composition plutôt que l'héritage — conforme à l'heuristique §3.3."
        )

    ax_desc = fig.add_axes([0.06, 0.02, 0.88, 0.22])
    ax_desc.axis('off')
    ax_desc.text(0.02, 0.95, description, ha='left', va='top', fontsize=10,
                 color='#2c3e50', wrap=True, linespacing=1.5,
                 transform=ax_desc.transAxes)

    pdf.savefig(fig)
    save_graph(fig, '07_dit.png')
    plt.close(fig)


# ============================================================
# Page 8 — Radar
# ============================================================

def page_radar(pdf, df):
    fig = plt.figure(figsize=(11, 8.5))

    fig.text(0.5, 0.95, '8. Radar — Vue multi-métriques des classes remarquables',
             ha='center', fontsize=16, fontweight='bold', color='#2c3e50')

    # Select notable classes (top by WMC, CBO, LOC, LCOM — unique)
    notable_ids = set()
    for col in ['WMC', 'CBO', 'Lignes_de_Code', 'LCOM']:
        if df[col].max() > 0:
            notable_ids.add(df[col].idxmax())
    notable = df.loc[sorted(notable_ids)]

    metrics_cols = ['Lignes_de_Code', 'Nb_Methodes', 'WMC', 'CBO', 'LCOM']
    labels = ['LOC', 'NOM', 'WMC', 'CBO', 'LCOM']
    N = len(labels)
    angles = np.linspace(0, 2 * np.pi, N, endpoint=False).tolist()
    angles += angles[:1]

    ax = fig.add_axes([0.1, 0.15, 0.55, 0.72], polar=True)
    ax.set_theta_offset(np.pi / 2)
    ax.set_theta_direction(-1)
    ax.set_thetagrids(np.degrees(angles[:-1]), labels, fontsize=10)

    # Normalize each metric to [0, 1] across all classes
    norm_df = df[metrics_cols].copy().astype(float)
    for col in metrics_cols:
        max_val = norm_df[col].max()
        if max_val > 0:
            norm_df[col] = norm_df[col] / max_val

    colors_radar = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6']
    for idx_pos, (idx, row) in enumerate(notable.iterrows()):
        values = norm_df.loc[idx, metrics_cols].tolist()
        values += values[:1]
        color = colors_radar[idx_pos % len(colors_radar)]
        ax.plot(angles, values, 'o-', linewidth=2, color=color,
                label=row['Nom_Classe'])
        ax.fill(angles, values, alpha=0.1, color=color)

    ax.set_ylim(0, 1)
    ax.legend(loc='upper right', bbox_to_anchor=(1.55, 1.15), fontsize=9)

    description = (
        f"Ce graphique radar superpose les métriques LOC, NOM, WMC, CBO et LCOM "
        f"(normalisées entre 0 et 1) pour les classes les plus remarquables du projet. "
        f"Il permet d'identifier rapidement les classes qui dominent sur plusieurs axes.\n\n"
        f"Classes représentées : {', '.join(notable['Nom_Classe'].tolist())}.\n"
        f"Une classe occupant beaucoup de surface radar concentre plusieurs risques qualité."
    )

    ax_desc = fig.add_axes([0.06, 0.02, 0.88, 0.12])
    ax_desc.axis('off')
    ax_desc.text(0.02, 0.95, description, ha='left', va='top', fontsize=10,
                 color='#2c3e50', wrap=True, linespacing=1.5,
                 transform=ax_desc.transAxes)

    pdf.savefig(fig)
    save_graph(fig, '08_radar.png')
    plt.close(fig)


# ============================================================
# Page 9 : Tableau récapitulatif (toutes métriques)
# ============================================================

def page_tableau(pdf, df):
    fig = plt.figure(figsize=(11, 8.5))

    fig.text(0.5, 0.95, '9. Tableau récapitulatif des métriques',
             ha='center', fontsize=16, fontweight='bold', color='#2c3e50')

    ax = fig.add_axes([0.02, 0.30, 0.96, 0.60])
    ax.axis('off')

    df_display = df.copy()
    df_display['LOC/M'] = (df_display['Lignes_de_Code'] /
                            df_display['Nb_Methodes'].replace(0, 1)).round(1)
    df_display['CC/M'] = (df_display['WMC'] /
                           df_display['Nb_Methodes'].replace(0, 1)).round(2)

    col_labels = ['Classe', 'NOM', 'NOA', 'LOC', 'WMC', 'DIT', 'CBO', 'LCOM', 'LOC/M', 'CC/M']
    display_cols = ['Nom_Classe', 'Nb_Methodes', 'Nb_Attributs', 'Lignes_de_Code',
                    'WMC', 'DIT', 'CBO', 'LCOM', 'LOC/M', 'CC/M']

    table = ax.table(
        cellText=df_display[display_cols].values,
        colLabels=col_labels,
        cellLoc='center',
        loc='center'
    )
    table.auto_set_font_size(False)
    table.set_fontsize(8)
    table.scale(1.0, 1.5)

    for j in range(len(col_labels)):
        table[0, j].set_facecolor('#3498db')
        table[0, j].set_text_props(color='white', fontweight='bold')

    for i in range(1, len(df_display) + 1):
        color = '#f8f9fa' if i % 2 == 0 else 'white'
        for j in range(len(col_labels)):
            table[i, j].set_facecolor(color)

    total_loc = int(df['Lignes_de_Code'].sum())
    total_methods = int(df['Nb_Methodes'].sum())
    total_attrs = int(df['Nb_Attributs'].sum())
    avg_loc_method = total_loc / max(total_methods, 1)
    avg_wmc = df['WMC'].mean()
    avg_cbo = df['CBO'].mean()
    avg_lcom = df['LCOM'].mean()

    description = (
        f"Tableau complet des métriques pour les {len(df)} classes du projet.\n\n"
        f"Statistiques globales :\n"
        f"  — Total LOC : {total_loc}  |  Total méthodes : {total_methods}  |  Total attributs : {total_attrs}\n"
        f"  — Ratio moyen LOC/méthode : {avg_loc_method:.1f}  |  WMC moyen : {avg_wmc:.1f}  "
        f"|  CBO moyen : {avg_cbo:.1f}  |  LCOM moyen : {avg_lcom:.1f}"
    )

    ax_desc = fig.add_axes([0.06, 0.02, 0.88, 0.22])
    ax_desc.axis('off')
    ax_desc.text(0.02, 0.95, description, ha='left', va='top', fontsize=10,
                 color='#2c3e50', wrap=True, linespacing=1.5,
                 transform=ax_desc.transAxes, fontfamily='monospace')

    pdf.savefig(fig)
    save_graph(fig, '09_tableau.png')
    plt.close(fig)


# ============================================================
# Page 10 — Conclusion
# ============================================================

def page_conclusion(pdf, df):
    fig = plt.figure(figsize=(11, 8.5))
    fig.patch.set_facecolor('#fdfdfd')

    fig.text(0.5, 0.92, 'Conclusion et recommandations',
             ha='center', fontsize=20, fontweight='bold', color='#2c3e50')

    ax_line = fig.add_axes([0.2, 0.88, 0.6, 0.002])
    ax_line.set_facecolor('#3498db')
    ax_line.set_xticks([])
    ax_line.set_yticks([])

    df_analysis = df.copy()
    df_analysis['LOC_par_Methode'] = df_analysis['Lignes_de_Code'] / df_analysis['Nb_Methodes'].replace(0, 1)

    total_loc = int(df['Lignes_de_Code'].sum())
    total_methods = int(df['Nb_Methodes'].sum())
    nb_classes = len(df)
    avg_density = df_analysis['LOC_par_Methode'].mean()
    avg_wmc = df['WMC'].mean()
    avg_cbo = df['CBO'].mean()
    avg_lcom = df['LCOM'].mean()
    avg_dit = df['DIT'].mean()
    max_loc_class = df.loc[df['Lignes_de_Code'].idxmax()]

    high_risk_loc = df_analysis[df_analysis['LOC_par_Methode'] > SEUILS['LOC_METHODE']['orange']]['Nom_Classe'].tolist()
    medium_risk_loc = df_analysis[(df_analysis['LOC_par_Methode'] > SEUILS['LOC_METHODE']['vert']) &
                                  (df_analysis['LOC_par_Methode'] <= SEUILS['LOC_METHODE']['orange'])]['Nom_Classe'].tolist()
    low_risk_loc = df_analysis[df_analysis['LOC_par_Methode'] <= SEUILS['LOC_METHODE']['vert']]['Nom_Classe'].tolist()

    high_wmc = df[df['WMC'] > SEUILS['WMC']['orange']]['Nom_Classe'].tolist()
    high_cbo = df[df['CBO'] > SEUILS['CBO']['orange']]['Nom_Classe'].tolist()
    high_lcom = df[df['LCOM'] > SEUILS['LCOM']['orange']]['Nom_Classe'].tolist()
    high_dit = df[df['DIT'] > SEUILS['DIT']['orange']]['Nom_Classe'].tolist()

    conclusion = (
        f"Vue d'ensemble\n"
        f"Le projet NoteManager est composé de {nb_classes} classes, totalisant {total_loc} LOC "
        f"dans {total_methods} méthodes. Densité moyenne : {avg_density:.1f} LOC/méthode, "
        f"WMC moyen : {avg_wmc:.1f}, CBO moyen : {avg_cbo:.1f}, LCOM moyen : {avg_lcom:.1f}, "
        f"DIT moyen : {avg_dit:.1f}.\n\n"
        f"Points forts\n"
    )

    if low_risk_loc:
        conclusion += (
            f"  • Bonne densité LOC (< 8 LOC/m) : {', '.join(low_risk_loc)}.\n"
        )
    if avg_dit <= SEUILS['DIT']['vert']:
        conclusion += (
            f"  • DIT moyen de {avg_dit:.1f} — le projet favorise la composition plutôt que l'héritage (§3.3).\n"
        )
    if avg_cbo <= SEUILS['CBO']['vert']:
        conclusion += (
            f"  • CBO moyen de {avg_cbo:.1f} — couplage maîtrisé (Faible Couplage GRASP).\n"
        )

    conclusion += f"\nPoints d'attention\n"

    if high_wmc:
        conclusion += (
            f"  • WMC élevé : {', '.join(high_wmc)}. "
            f"→ Décomposer (GRASP Forte Cohésion).\n"
        )
    if high_cbo:
        conclusion += (
            f"  • CBO élevé : {', '.join(high_cbo)}. "
            f"→ Réduire dépendances (DIP, Façade, Faible Couplage).\n"
        )
    if high_lcom:
        conclusion += (
            f"  • LCOM élevé : {', '.join(high_lcom)}. "
            f"→ Séparer responsabilités (SOLID SRP).\n"
        )
    if high_dit:
        conclusion += (
            f"  • DIT élevé : {', '.join(high_dit)}. "
            f"→ Favoriser composition (§3.3).\n"
        )
    if high_risk_loc:
        conclusion += (
            f"  • Méthodes longues (> 12 LOC/m) : {', '.join(high_risk_loc)}. "
            f"→ Décomposer en sous-méthodes.\n"
        )

    conclusion += (
        f"\nClasse la plus volumineuse : {max_loc_class['Nom_Classe']} "
        f"({int(max_loc_class['Lignes_de_Code'])} LOC, WMC={int(max_loc_class['WMC'])}, "
        f"CBO={int(max_loc_class['CBO'])}).\n\n"
        f"Pipeline de validation\n"
        f"Métriques générées par le pipeline CI/CD GitHub Actions (ts2famix → Pharo/Moose → Python), "
        f"validées par vérification croisée sur 4 niveaux (structure, invariants, calcul indépendant, "
        f"comparaison avec tolérances WMC±2, CBO±2, LCOM±3)."
    )

    ax_text = fig.add_axes([0.08, 0.05, 0.84, 0.82])
    ax_text.axis('off')
    ax_text.text(0.0, 1.0, conclusion, ha='left', va='top', fontsize=10,
                 color='#2c3e50', wrap=True, linespacing=1.6,
                 transform=ax_text.transAxes)

    pdf.savefig(fig)
    save_graph(fig, '10_conclusion.png')
    plt.close(fig)


# ============================================================
# Mode PR : Graphiques comparatifs (PR vs main) — Pages 1 à 5
# ============================================================

def prepare_comparison_df(df_pr, df_main):
    left = df_pr[['Nom_Classe'] + METRIC_COLUMNS].copy()
    right = df_main[['Nom_Classe'] + METRIC_COLUMNS].copy()
    merged = pd.merge(
        left, right, on='Nom_Classe', how='outer', suffixes=('_pr', '_main'), indicator=True
    ).fillna(0)
    for col in merged.columns:
        if col not in ['Nom_Classe', '_merge']:
            merged[col] = pd.to_numeric(merged[col], errors='coerce').fillna(0)
    merged['Classe_Label'] = merged['Nom_Classe']
    merged.loc[merged['_merge'] == 'left_only', 'Classe_Label'] = (
        merged.loc[merged['_merge'] == 'left_only', 'Nom_Classe'] + ' (nouvelle)'
    )
    merged.loc[merged['_merge'] == 'right_only', 'Classe_Label'] = (
        merged.loc[merged['_merge'] == 'right_only', 'Nom_Classe'] + ' (supprimée)'
    )
    return merged.sort_values('Nom_Classe').reset_index(drop=True)


def format_float_value(value):
    return f'{value:.1f}'.rstrip('0').rstrip('.')


def highlight_changed_labels(labels, changed_mask):
    """Highlight matplotlib tick labels for classes whose compared metric changed."""
    for label, changed in zip(labels, changed_mask):
        if changed:
            label.set_fontweight('bold')
            label.set_color('#c0392b')


def add_no_change_stamp(fig):
    """Overlay a large watermark-style 'Pas de changement' stamp on a figure."""
    fig.text(
        0.5, 0.55, 'Pas de changement',
        ha='center', va='center', fontsize=54, fontweight='bold',
        color='#e74c3c', alpha=0.28, rotation=16,
        bbox=dict(boxstyle='round,pad=0.35', facecolor='white', edgecolor='#e74c3c', linewidth=2.5, alpha=0.35)
    )


def page_histogramme_compare(pdf, df_pr, df_main):
    fig = plt.figure(figsize=(11, 8.5))
    fig.text(0.5, 0.95, '1. Comparaison PR vs main — LOC, NOM, NOA',
             ha='center', fontsize=16, fontweight='bold', color='#2c3e50')
    merged = prepare_comparison_df(df_pr, df_main)

    metric_specs = [
        ('Lignes_de_Code', 'LOC', '#e74c3c'),
        ('Nb_Methodes', 'NOM', '#3498db'),
        ('Nb_Attributs', 'NOA', '#2ecc71')
    ]
    changed_mask = (
        ~np.isclose(merged['Lignes_de_Code_pr'], merged['Lignes_de_Code_main'], rtol=1e-05, atol=1e-08) |
        ~np.isclose(merged['Nb_Methodes_pr'], merged['Nb_Methodes_main'], rtol=1e-05, atol=1e-08) |
        ~np.isclose(merged['Nb_Attributs_pr'], merged['Nb_Attributs_main'], rtol=1e-05, atol=1e-08)
    )

    x = np.arange(len(merged))
    width = 0.35
    for idx, (col, label, color) in enumerate(metric_specs):
        ax = fig.add_axes([0.08, 0.67 - idx * 0.2, 0.88, 0.16])
        ax.bar(x - width/2, merged[f'{col}_main'], width, label='main', color='#bdc3c7', alpha=0.8)
        ax.bar(x + width/2, merged[f'{col}_pr'], width, label='PR', color=color, alpha=0.85)
        ax.set_ylabel(label, fontsize=9)
        ax.grid(axis='y', alpha=0.25)
        if idx == 0:
            ax.legend(fontsize=9, loc='upper right')
        if idx < 2:
            ax.set_xticks([])
        else:
            ax.set_xticks(x)
            ax.set_xticklabels(merged['Classe_Label'], rotation=45, ha='right', fontsize=8)
            highlight_changed_labels(ax.get_xticklabels(), changed_mask)

    if not changed_mask.any():
        add_no_change_stamp(fig)

    ax_desc = fig.add_axes([0.06, 0.02, 0.88, 0.12])
    ax_desc.axis('off')
    ax_desc.text(
        0.02, 0.95,
        "Comparaison directe des métriques structurelles entre la PR (couleurs) et la branche main (gris). "
        "Chaque barre permet de visualiser l'impact du refactoring pour chaque classe.",
        ha='left', va='top', fontsize=10, color='#2c3e50', wrap=True, linespacing=1.5,
        transform=ax_desc.transAxes
    )

    pdf.savefig(fig)
    save_graph(fig, '01_histogramme.png')
    plt.close(fig)


def page_scatter_compare(pdf, df_pr, df_main):
    fig = plt.figure(figsize=(11, 8.5))
    fig.text(0.5, 0.95, '2. Comparaison PR vs main — Dispersion LOC vs NOM',
             ha='center', fontsize=16, fontweight='bold', color='#2c3e50')
    ax = fig.add_axes([0.08, 0.30, 0.84, 0.60])
    merged = prepare_comparison_df(df_pr, df_main)

    ax.scatter(merged['Nb_Methodes_main'], merged['Lignes_de_Code_main'],
               c='#7f8c8d', label='main', s=80, alpha=0.8, edgecolors='black', linewidth=0.4)
    ax.scatter(merged['Nb_Methodes_pr'], merged['Lignes_de_Code_pr'],
               c='#3498db', label='PR', s=80, alpha=0.8, edgecolors='black', linewidth=0.4)

    for _, row in merged.iterrows():
        ax.plot([row['Nb_Methodes_main'], row['Nb_Methodes_pr']],
                [row['Lignes_de_Code_main'], row['Lignes_de_Code_pr']],
                color='#95a5a6', alpha=0.5, linewidth=1)
        ax.annotate(row['Classe_Label'], (row['Nb_Methodes_pr'], row['Lignes_de_Code_pr']),
                    xytext=(4, 4), textcoords='offset points', fontsize=8)

    ax.set_xlabel('Nombre de méthodes (NOM)', fontsize=11)
    ax.set_ylabel('Lignes de code (LOC)', fontsize=11)
    ax.grid(alpha=0.3)
    ax.legend(fontsize=9)

    pdf.savefig(fig)
    save_graph(fig, '02_scatter.png')
    plt.close(fig)


def page_densite_compare(pdf, df_pr, df_main):
    fig = plt.figure(figsize=(11, 8.5))
    fig.text(0.5, 0.95, '2. Comparaison PR vs main — Densité de code (LOC / méthode)',
             ha='center', fontsize=16, fontweight='bold', color='#2c3e50')
    ax = fig.add_axes([0.15, 0.28, 0.78, 0.62])
    merged = prepare_comparison_df(df_pr, df_main).copy()
    merged['densite_main'] = merged['Lignes_de_Code_main'] / merged['Nb_Methodes_main'].replace(0, 1)
    merged['densite_pr'] = merged['Lignes_de_Code_pr'] / merged['Nb_Methodes_pr'].replace(0, 1)
    merged['has_change'] = ~np.isclose(
        merged['densite_main'], merged['densite_pr'], rtol=1e-05, atol=1e-08
    )
    merged = merged.sort_values('densite_pr', ascending=True)

    y = np.arange(len(merged))
    h = 0.35
    ax.barh(y - h/2, merged['densite_main'], h, color='#bdc3c7', alpha=0.85, label='main')
    ax.barh(y + h/2, merged['densite_pr'], h, color='#e67e22', alpha=0.9, label='PR')

    ax.set_yticks(y)
    ax.set_yticklabels(merged['Classe_Label'], fontsize=9)
    highlight_changed_labels(ax.get_yticklabels(), merged['has_change'].tolist())
    ax.set_xlabel('LOC par méthode', fontsize=11)
    ax.grid(axis='x', alpha=0.3)
    ax.legend(fontsize=9, loc='upper right')

    for yi, val_main, val_pr in zip(y, merged['densite_main'], merged['densite_pr']):
        ax.text(val_main + 0.05, yi - h/2, f'{val_main:.1f}', va='center', fontsize=8)
        ax.text(val_pr + 0.05, yi + h/2, f'{val_pr:.1f}', va='center', fontsize=8)

    ax_desc = fig.add_axes([0.06, 0.02, 0.88, 0.18])
    ax_desc.axis('off')
    ax_desc.text(
        0.02, 0.95,
        "Comparaison de la densité de code (LOC/méthode) entre la PR et main pour chaque classe. "
        "Ce graphe met en évidence l'effet du refactoring sur la taille moyenne des méthodes.",
        ha='left', va='top', fontsize=10, color='#2c3e50', wrap=True, linespacing=1.5,
        transform=ax_desc.transAxes
    )

    if not merged['has_change'].any():
        add_no_change_stamp(fig)

    pdf.savefig(fig)
    save_graph(fig, '03_densite.png')
    plt.close(fig)


def page_compare_metric_barh(pdf, df_pr, df_main, metric_col, title, xlabel, output_name, color_pr):
    fig = plt.figure(figsize=(11, 8.5))
    fig.text(0.5, 0.95, title, ha='center', fontsize=16, fontweight='bold', color='#2c3e50')
    ax = fig.add_axes([0.15, 0.28, 0.78, 0.62])
    merged = prepare_comparison_df(df_pr, df_main)
    merged['has_change'] = ~np.isclose(
        merged[f'{metric_col}_pr'], merged[f'{metric_col}_main'], rtol=1e-05, atol=1e-08
    )
    merged = merged.sort_values(f'{metric_col}_pr', ascending=True)

    y = np.arange(len(merged))
    h = 0.35
    ax.barh(y - h/2, merged[f'{metric_col}_main'], h, color='#bdc3c7', alpha=0.85, label='main')
    ax.barh(y + h/2, merged[f'{metric_col}_pr'], h, color=color_pr, alpha=0.9, label='PR')

    ax.set_yticks(y)
    ax.set_yticklabels(merged['Classe_Label'], fontsize=9)
    highlight_changed_labels(ax.get_yticklabels(), merged['has_change'].tolist())
    ax.set_xlabel(xlabel, fontsize=11)
    ax.grid(axis='x', alpha=0.3)
    ax.legend(fontsize=9, loc='upper right')

    for yi, val_main, val_pr in zip(y, merged[f'{metric_col}_main'], merged[f'{metric_col}_pr']):
        ax.text(val_main + 0.05, yi - h/2, format_float_value(val_main), va='center', fontsize=8)
        ax.text(val_pr + 0.05, yi + h/2, format_float_value(val_pr), va='center', fontsize=8)

    ax_desc = fig.add_axes([0.06, 0.02, 0.88, 0.18])
    ax_desc.axis('off')
    ax_desc.text(
        0.02, 0.95,
        "Comparaison visuelle PR vs main dans le même graphe. Les barres PR sont colorées et les barres "
        "main sont en gris, afin d'illustrer l'effet du refactoring sur chaque classe.",
        ha='left', va='top', fontsize=10, color='#2c3e50', wrap=True, linespacing=1.5,
        transform=ax_desc.transAxes
    )

    if not merged['has_change'].any():
        add_no_change_stamp(fig)

    pdf.savefig(fig)
    save_graph(fig, output_name)
    plt.close(fig)


# ============================================================
# Main
# ============================================================

def main():
    csv_path = sys.argv[1] if len(sys.argv) > 1 else 'export_metrics.csv'
    output_path = sys.argv[2] if len(sys.argv) > 2 else 'rapport_metriques.pdf'
    baseline_main_path = sys.argv[3] if len(sys.argv) > 3 else None

    print(f"Chargement du CSV : {csv_path}")
    df = load_csv(csv_path)
    print(f"{len(df)} classes trouvées")
    print(df.to_string(index=False))
    print()

    is_pr_compare = baseline_main_path is not None and os.path.exists(baseline_main_path)

    print(f"Génération du rapport PDF : {output_path}")
    with PdfPages(output_path) as pdf:
        if is_pr_compare:
            print(f"Mode PR comparatif activé avec baseline main : {baseline_main_path}")
            df_main = load_csv(baseline_main_path)
            page_titre(pdf)
            page_histogramme_compare(pdf, df, df_main)
            page_densite_compare(pdf, df, df_main)
            page_compare_metric_barh(
                pdf, df, df_main,
                metric_col='WMC',
                title='3. Comparaison PR vs main — WMC',
                xlabel='WMC',
                output_name='04_wmc.png',
                color_pr='#9b59b6'
            )
            page_compare_metric_barh(
                pdf, df, df_main,
                metric_col='CBO',
                title='4. Comparaison PR vs main — CBO',
                xlabel='CBO',
                output_name='05_cbo.png',
                color_pr='#16a085'
            )
            page_compare_metric_barh(
                pdf, df, df_main,
                metric_col='LCOM',
                title='5. Comparaison PR vs main — LCOM',
                xlabel='LCOM',
                output_name='06_lcom.png',
                color_pr='#c0392b'
            )
            print(f"Rapport généré avec succès : {output_path} (6 pages: titre + graphes 1 à 5 comparatifs)")
        else:
            page_titre(pdf)
            page_histogramme(pdf, df)
            page_scatter(pdf, df)
            page_densite(pdf, df)
            page_wmc(pdf, df)
            page_cbo(pdf, df)
            page_lcom(pdf, df)
            page_dit(pdf, df)
            page_radar(pdf, df)
            page_tableau(pdf, df)
            page_conclusion(pdf, df)
            print(f"Rapport généré avec succès : {output_path} (11 pages)")


if __name__ == '__main__':
    main()
