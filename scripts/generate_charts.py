#!/usr/bin/env python3
"""
Generate quality metrics visualizations from FamixTypeScript CSV export.
Produces PDF charts for TP2 MGL843 analysis.
"""

import sys
import os
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend for CI

def load_csv(csv_path):
    """Load the CSV exported by Pharo (semicolon-separated, quoted values)."""
    df = pd.read_csv(csv_path, sep=';', quotechar='"')
    # Ensure numeric columns
    for col in ['Nb_Methodes', 'Nb_Attributs', 'Lignes_de_Code']:
        df[col] = pd.to_numeric(df[col], errors='coerce')
    return df


def chart_grouped_histogram(df, output_path):
    """
    Histogramme groupé: LOC, NOM, NOA par classe.
    Reproduit la visualisation Excel du TP1.
    """
    fig, ax = plt.subplots(figsize=(12, 6))
    
    x = range(len(df))
    width = 0.25
    
    bars1 = ax.bar([i - width for i in x], df['Lignes_de_Code'], width, 
                    label='Lignes de Code (LOC)', color='#e74c3c', alpha=0.85)
    bars2 = ax.bar(x, df['Nb_Methodes'], width, 
                    label='Nb Méthodes (NOM)', color='#3498db', alpha=0.85)
    bars3 = ax.bar([i + width for i in x], df['Nb_Attributs'], width, 
                    label='Nb Attributs (NOA)', color='#2ecc71', alpha=0.85)
    
    ax.set_xlabel('Classes', fontsize=12)
    ax.set_ylabel('Valeur', fontsize=12)
    ax.set_title('Métriques de qualité par classe — Projet NoteManager', fontsize=14)
    ax.set_xticks(x)
    ax.set_xticklabels(df['Nom_Classe'], rotation=45, ha='right', fontsize=10)
    ax.legend(fontsize=10)
    ax.grid(axis='y', alpha=0.3)
    
    # Add value labels on bars
    for bar in bars1:
        height = bar.get_height()
        if height > 0:
            ax.annotate(f'{int(height)}', xy=(bar.get_x() + bar.get_width()/2, height),
                       xytext=(0, 3), textcoords="offset points", ha='center', fontsize=8)
    for bar in bars2:
        height = bar.get_height()
        if height > 0:
            ax.annotate(f'{int(height)}', xy=(bar.get_x() + bar.get_width()/2, height),
                       xytext=(0, 3), textcoords="offset points", ha='center', fontsize=8)
    
    plt.tight_layout()
    plt.savefig(output_path, format='pdf', dpi=150, bbox_inches='tight')
    plt.close()
    print(f"  -> {output_path}")


def chart_loc_vs_nom_scatter(df, output_path):
    """
    Scatter plot: LOC vs NOM pour identifier les classes potentiellement
    problématiques (beaucoup de LOC par méthode = faible cohésion).
    """
    fig, ax = plt.subplots(figsize=(10, 7))
    
    sizes = df['Nb_Attributs'] * 100 + 50  # Size by NOA
    scatter = ax.scatter(df['Nb_Methodes'], df['Lignes_de_Code'], 
                         s=sizes, c=df['Lignes_de_Code'], cmap='RdYlGn_r',
                         alpha=0.7, edgecolors='black', linewidth=0.5)
    
    # Add class labels
    for _, row in df.iterrows():
        ax.annotate(row['Nom_Classe'], 
                    (row['Nb_Methodes'], row['Lignes_de_Code']),
                    xytext=(5, 5), textcoords='offset points', fontsize=9)
    
    # Add reference line (average LOC per method)
    avg_ratio = df['Lignes_de_Code'].sum() / df['Nb_Methodes'].sum()
    x_range = range(0, int(df['Nb_Methodes'].max()) + 5)
    ax.plot(x_range, [avg_ratio * x for x in x_range], '--', 
            color='gray', alpha=0.5, label=f'Ratio moyen: {avg_ratio:.1f} LOC/méthode')
    
    ax.set_xlabel('Nombre de méthodes (NOM)', fontsize=12)
    ax.set_ylabel('Lignes de code (LOC)', fontsize=12)
    ax.set_title('LOC vs NOM — Identification des classes à risque\n(Taille = NOA, Couleur = LOC)', fontsize=13)
    ax.legend(fontsize=10)
    ax.grid(alpha=0.3)
    
    plt.colorbar(scatter, ax=ax, label='LOC')
    plt.tight_layout()
    plt.savefig(output_path, format='pdf', dpi=150, bbox_inches='tight')
    plt.close()
    print(f"  -> {output_path}")


def chart_density_ratio(df, output_path):
    """
    Bar chart: LOC/NOM ratio par classe.
    Met en évidence les classes avec des méthodes trop longues.
    """
    fig, ax = plt.subplots(figsize=(10, 6))
    
    df_sorted = df.copy()
    df_sorted['LOC_per_Method'] = df_sorted['Lignes_de_Code'] / df_sorted['Nb_Methodes'].replace(0, 1)
    df_sorted = df_sorted.sort_values('LOC_per_Method', ascending=True)
    
    colors = ['#e74c3c' if v > 12 else '#f39c12' if v > 8 else '#2ecc71' 
              for v in df_sorted['LOC_per_Method']]
    
    bars = ax.barh(df_sorted['Nom_Classe'], df_sorted['LOC_per_Method'], color=colors, alpha=0.85)
    
    # Threshold line
    ax.axvline(x=10, color='red', linestyle='--', alpha=0.5, label='Seuil recommandé (~10 LOC/méthode)')
    
    for bar, val in zip(bars, df_sorted['LOC_per_Method']):
        ax.text(bar.get_width() + 0.3, bar.get_y() + bar.get_height()/2,
                f'{val:.1f}', va='center', fontsize=10)
    
    ax.set_xlabel('LOC par méthode (densité)', fontsize=12)
    ax.set_title('Densité de code par classe — Indicateur de cohésion', fontsize=13)
    ax.legend(fontsize=10)
    ax.grid(axis='x', alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(output_path, format='pdf', dpi=150, bbox_inches='tight')
    plt.close()
    print(f"  -> {output_path}")


def chart_summary_table(df, output_path):
    """
    Summary table as a figure — useful for the report.
    """
    fig, ax = plt.subplots(figsize=(10, 4))
    ax.axis('off')
    
    # Add computed columns
    df_display = df.copy()
    df_display['LOC/Méthode'] = (df_display['Lignes_de_Code'] / 
                                  df_display['Nb_Methodes'].replace(0, 1)).round(1)
    
    table = ax.table(
        cellText=df_display.values,
        colLabels=df_display.columns,
        cellLoc='center',
        loc='center'
    )
    table.auto_set_font_size(False)
    table.set_fontsize(10)
    table.scale(1.2, 1.5)
    
    # Style header
    for j in range(len(df_display.columns)):
        table[0, j].set_facecolor('#3498db')
        table[0, j].set_text_props(color='white', fontweight='bold')
    
    ax.set_title('Tableau récapitulatif des métriques', fontsize=14, pad=20)
    
    plt.tight_layout()
    plt.savefig(output_path, format='pdf', dpi=150, bbox_inches='tight')
    plt.close()
    print(f"  -> {output_path}")


def main():
    csv_path = sys.argv[1] if len(sys.argv) > 1 else 'export_metrics.csv'
    output_dir = sys.argv[2] if len(sys.argv) > 2 else 'output'
    
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"Loading CSV: {csv_path}")
    df = load_csv(csv_path)
    print(f"Found {len(df)} classes")
    print(df.to_string(index=False))
    print()
    
    print("Generating charts...")
    chart_grouped_histogram(df, os.path.join(output_dir, 'chart_histogram.pdf'))
    chart_loc_vs_nom_scatter(df, os.path.join(output_dir, 'chart_scatter_loc_nom.pdf'))
    chart_density_ratio(df, os.path.join(output_dir, 'chart_density.pdf'))
    chart_summary_table(df, os.path.join(output_dir, 'chart_summary_table.pdf'))
    
    print(f"\nAll charts saved to {output_dir}/")


if __name__ == '__main__':
    main()
