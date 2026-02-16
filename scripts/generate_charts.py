#!/usr/bin/env python3
"""
Génération d'un rapport PDF unique contenant les visualisations
des métriques de qualité du projet NoteManager (TP2 MGL843).
"""

import sys
import os
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib
from matplotlib.backends.backend_pdf import PdfPages
from datetime import datetime

matplotlib.use('Agg')

# ============================================================
# Chargement des données
# ============================================================

def load_csv(csv_path):
    df = pd.read_csv(csv_path, sep=';', quotechar='"')
    for col in ['Nb_Methodes', 'Nb_Attributs', 'Lignes_de_Code']:
        df[col] = pd.to_numeric(df[col], errors='coerce')
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

    # Ligne décorative
    ax = fig.add_axes([0.2, 0.48, 0.6, 0.002])
    ax.set_facecolor('#3498db')
    ax.set_xticks([])
    ax.set_yticks([])

    pdf.savefig(fig)
    plt.close(fig)


# ============================================================
# Graphique 1 : Histogramme groupé
# ============================================================

def page_histogramme(pdf, df):
    fig = plt.figure(figsize=(11, 8.5))

    # Titre de page
    fig.text(0.5, 0.95, '1. Histogramme des métriques par classe',
             ha='center', fontsize=16, fontweight='bold', color='#2c3e50')

    # Graphique (partie haute)
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

    # Description (partie basse)
    top_loc = df.loc[df['Lignes_de_Code'].idxmax()]
    top_nom = df.loc[df['Nb_Methodes'].idxmax()]

    description = (
        f"Ce graphique compare les trois métriques principales (LOC, NOM, NOA) pour chaque classe "
        f"du projet NoteManager.\n\n"
        f"La classe {top_loc['Nom_Classe']} domine en termes de lignes de code ({int(top_loc['Lignes_de_Code'])} LOC), "
        f"tandis que {top_nom['Nom_Classe']} possède le plus grand nombre de méthodes ({int(top_nom['Nb_Methodes'])}). "
        f"Un déséquilibre entre LOC et NOM peut indiquer des méthodes trop longues ou un manque de "
        f"décomposition fonctionnelle. Les classes avec un LOC élevé et peu de méthodes sont des "
        f"candidates au refactoring."
    )

    fig.text(0.08, 0.03, description, ha='left', va='bottom', fontsize=10,
             color='#2c3e50', wrap=True,
             transform=fig.transFigure,
             bbox=dict(boxstyle='round,pad=0.4', facecolor='#f0f4f8', edgecolor='#bdc3c7', alpha=0.8),
             fontfamily='sans-serif', linespacing=1.4,
             multialignment='left')
    # Workaround: use ax_text for wrapping
    ax_desc = fig.add_axes([0.06, 0.02, 0.88, 0.22])
    ax_desc.axis('off')
    ax_desc.text(0.02, 0.95, description, ha='left', va='top', fontsize=10,
                 color='#2c3e50', wrap=True, linespacing=1.5,
                 transform=ax_desc.transAxes)

    # Remove the fig.text (we use ax_desc instead)
    fig.texts[-1].set_visible(False)

    pdf.savefig(fig)
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

    # Classes au-dessus / en-dessous du ratio moyen
    above = df[df['Lignes_de_Code'] > avg_ratio * df['Nb_Methodes']]['Nom_Classe'].tolist()
    below = df[df['Lignes_de_Code'] <= avg_ratio * df['Nb_Methodes']]['Nom_Classe'].tolist()

    description = (
        f"Ce diagramme positionne chaque classe selon son nombre de méthodes (axe X) et ses lignes "
        f"de code (axe Y). La taille des cercles est proportionnelle au nombre d'attributs (NOA). "
        f"La ligne pointillée représente le ratio moyen de {avg_ratio:.1f} LOC par méthode.\n\n"
        f"Classes au-dessus de la moyenne (méthodes plus longues) : {', '.join(above) if above else 'aucune'}.\n"
        f"Classes en dessous (méthodes plus concises) : {', '.join(below) if below else 'aucune'}.\n"
        f"Les classes éloignées de la ligne de tendance méritent une attention particulière lors du refactoring."
    )

    ax_desc = fig.add_axes([0.06, 0.02, 0.88, 0.22])
    ax_desc.axis('off')
    ax_desc.text(0.02, 0.95, description, ha='left', va='top', fontsize=10,
                 color='#2c3e50', wrap=True, linespacing=1.5,
                 transform=ax_desc.transAxes)

    pdf.savefig(fig)
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

    colors = ['#e74c3c' if v > 12 else '#f39c12' if v > 8 else '#2ecc71'
              for v in df_sorted['LOC_par_Methode']]

    bars = ax.barh(df_sorted['Nom_Classe'], df_sorted['LOC_par_Methode'], color=colors, alpha=0.85)
    ax.axvline(x=10, color='red', linestyle='--', alpha=0.5, label='Seuil recommandé (10 LOC/méthode)')

    for bar, val in zip(bars, df_sorted['LOC_par_Methode']):
        ax.text(bar.get_width() + 0.3, bar.get_y() + bar.get_height()/2,
                f'{val:.1f}', va='center', fontsize=10)

    ax.set_xlabel('LOC par méthode', fontsize=11)
    ax.legend(fontsize=9)
    ax.grid(axis='x', alpha=0.3)

    # Analyse
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
    plt.close(fig)


# ============================================================
# Graphique 4 : Tableau récapitulatif
# ============================================================

def page_tableau(pdf, df):
    fig = plt.figure(figsize=(11, 8.5))

    fig.text(0.5, 0.95, '4. Tableau récapitulatif des métriques',
             ha='center', fontsize=16, fontweight='bold', color='#2c3e50')

    ax = fig.add_axes([0.06, 0.35, 0.88, 0.55])
    ax.axis('off')

    df_display = df.copy()
    df_display['LOC/Méthode'] = (df_display['Lignes_de_Code'] /
                                  df_display['Nb_Methodes'].replace(0, 1)).round(1)

    col_labels = ['Classe', 'NOM', 'NOA', 'LOC', 'LOC/Méthode']

    table = ax.table(
        cellText=df_display.values,
        colLabels=col_labels,
        cellLoc='center',
        loc='center'
    )
    table.auto_set_font_size(False)
    table.set_fontsize(10)
    table.scale(1.2, 1.6)

    for j in range(len(col_labels)):
        table[0, j].set_facecolor('#3498db')
        table[0, j].set_text_props(color='white', fontweight='bold')

    # Alternance de couleurs pour les lignes
    for i in range(1, len(df_display) + 1):
        color = '#f8f9fa' if i % 2 == 0 else 'white'
        for j in range(len(col_labels)):
            table[i, j].set_facecolor(color)

    # Statistiques
    total_loc = int(df['Lignes_de_Code'].sum())
    total_methods = int(df['Nb_Methodes'].sum())
    total_attrs = int(df['Nb_Attributs'].sum())
    avg_loc_method = total_loc / max(total_methods, 1)

    description = (
        f"Ce tableau présente l'ensemble des métriques collectées pour les {len(df)} classes du projet.\n\n"
        f"Statistiques globales du projet :\n"
        f"  — Total LOC : {total_loc}   |   Total méthodes : {total_methods}   |   Total attributs : {total_attrs}\n"
        f"  — Ratio moyen LOC/méthode : {avg_loc_method:.1f}\n"
        f"  — Classe la plus volumineuse : {df.loc[df['Lignes_de_Code'].idxmax(), 'Nom_Classe']} "
        f"({int(df['Lignes_de_Code'].max())} LOC)\n"
        f"  — Classe avec le plus de méthodes : {df.loc[df['Nb_Methodes'].idxmax(), 'Nom_Classe']} "
        f"({int(df['Nb_Methodes'].max())} méthodes)"
    )

    ax_desc = fig.add_axes([0.06, 0.02, 0.88, 0.25])
    ax_desc.axis('off')
    ax_desc.text(0.02, 0.95, description, ha='left', va='top', fontsize=10,
                 color='#2c3e50', wrap=True, linespacing=1.5,
                 transform=ax_desc.transAxes, fontfamily='monospace')

    pdf.savefig(fig)
    plt.close(fig)


# ============================================================
# Page de conclusion
# ============================================================

def page_conclusion(pdf, df):
    fig = plt.figure(figsize=(11, 8.5))
    fig.patch.set_facecolor('#fdfdfd')

    fig.text(0.5, 0.92, 'Conclusion et recommandations',
             ha='center', fontsize=20, fontweight='bold', color='#2c3e50')

    # Ligne décorative
    ax_line = fig.add_axes([0.2, 0.88, 0.6, 0.002])
    ax_line.set_facecolor('#3498db')
    ax_line.set_xticks([])
    ax_line.set_yticks([])

    # Analyse automatique
    df_analysis = df.copy()
    df_analysis['LOC_par_Methode'] = df_analysis['Lignes_de_Code'] / df_analysis['Nb_Methodes'].replace(0, 1)

    total_loc = int(df['Lignes_de_Code'].sum())
    total_methods = int(df['Nb_Methodes'].sum())
    nb_classes = len(df)
    avg_density = df_analysis['LOC_par_Methode'].mean()
    max_density_class = df_analysis.loc[df_analysis['LOC_par_Methode'].idxmax()]
    max_loc_class = df.loc[df['Lignes_de_Code'].idxmax()]

    high_risk = df_analysis[df_analysis['LOC_par_Methode'] > 12]['Nom_Classe'].tolist()
    medium_risk = df_analysis[(df_analysis['LOC_par_Methode'] > 8) &
                              (df_analysis['LOC_par_Methode'] <= 12)]['Nom_Classe'].tolist()
    low_risk = df_analysis[df_analysis['LOC_par_Methode'] <= 8]['Nom_Classe'].tolist()

    conclusion = (
        f"Vue d'ensemble\n"
        f"Le projet NoteManager est composé de {nb_classes} classes, totalisant {total_loc} lignes de code "
        f"réparties dans {total_methods} méthodes. La densité moyenne est de {avg_density:.1f} LOC par méthode.\n\n"
        f"Points forts\n"
    )

    if low_risk:
        conclusion += (
            f"  • {len(low_risk)} classe(s) avec une bonne densité (< 8 LOC/méthode) : {', '.join(low_risk)}.\n"
            f"    Ces classes montrent une bonne décomposition fonctionnelle.\n\n"
        )

    conclusion += f"Points d'attention\n"

    if high_risk:
        conclusion += (
            f"  • {len(high_risk)} classe(s) à risque élevé (> 12 LOC/méthode) : {', '.join(high_risk)}.\n"
            f"    Recommandation : décomposer les méthodes longues en sous-méthodes.\n"
        )
    if medium_risk:
        conclusion += (
            f"  • {len(medium_risk)} classe(s) à surveiller (8-12 LOC/méthode) : {', '.join(medium_risk)}.\n"
        )

    conclusion += (
        f"\nClasse la plus volumineuse : {max_loc_class['Nom_Classe']} "
        f"({int(max_loc_class['Lignes_de_Code'])} LOC, {int(max_loc_class['Nb_Methodes'])} méthodes). "
        f"Cette classe concentre {int(max_loc_class['Lignes_de_Code'])/total_loc*100:.0f}% du code total "
        f"et pourrait bénéficier d'une répartition des responsabilités.\n\n"
        f"Pipeline de validation\n"
        f"Ces métriques ont été générées automatiquement par un pipeline CI/CD GitHub Actions, "
        f"puis validées par vérification croisée entre Pharo/Moose et Python "
        f"(4 niveaux de validation : structure, invariants, calcul indépendant, comparaison)."
    )

    ax_text = fig.add_axes([0.08, 0.05, 0.84, 0.82])
    ax_text.axis('off')
    ax_text.text(0.0, 1.0, conclusion, ha='left', va='top', fontsize=11,
                 color='#2c3e50', wrap=True, linespacing=1.6,
                 transform=ax_text.transAxes)

    pdf.savefig(fig)
    plt.close(fig)


# ============================================================
# Main
# ============================================================

def main():
    csv_path = sys.argv[1] if len(sys.argv) > 1 else 'export_metrics.csv'
    output_path = sys.argv[2] if len(sys.argv) > 2 else 'rapport_metriques.pdf'

    print(f"Chargement du CSV : {csv_path}")
    df = load_csv(csv_path)
    print(f"{len(df)} classes trouvées")
    print(df.to_string(index=False))
    print()

    print(f"Génération du rapport PDF : {output_path}")
    with PdfPages(output_path) as pdf:
        page_titre(pdf)
        page_histogramme(pdf, df)
        page_scatter(pdf, df)
        page_densite(pdf, df)
        page_tableau(pdf, df)
        page_conclusion(pdf, df)

    print(f"Rapport généré avec succès : {output_path} ({6} pages)")


if __name__ == '__main__':
    main()
