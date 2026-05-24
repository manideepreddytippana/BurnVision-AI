"""
EDA Analysis Script for BurnVision Calorie Prediction Datasets
Performs comprehensive Exploratory Data Analysis and generates JSON reports.

Usage:
    python -m app.services.eda_analysis
"""

import os
import json
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime


DATASET_DIR = Path(__file__).parent.parent / 'caloriedset' / 'calorie-burnt-15k'
REPORTS_DIR = Path(__file__).parent.parent / 'eda_reports'


def ensure_reports_dir():
    """Create reports directory if it doesn't exist"""
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)


def convert_to_serializable(obj):
    """Convert numpy/pandas types to JSON-serializable Python types"""
    if isinstance(obj, dict):
        return {str(k): convert_to_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [convert_to_serializable(i) for i in obj]
    elif isinstance(obj, (np.integer,)):
        return int(obj)
    elif isinstance(obj, (np.floating,)):
        return float(obj) if not np.isnan(obj) and not np.isinf(obj) else None
    elif isinstance(obj, np.ndarray):
        return [convert_to_serializable(i) for i in obj.tolist()]
    elif isinstance(obj, (np.bool_,)):
        return bool(obj)
    elif isinstance(obj, pd.Timestamp):
        return obj.isoformat()
    elif pd.isna(obj):
        return None
    return obj


def analyze_nulls(df: pd.DataFrame) -> dict:
    """Analyze null/missing values in the dataset"""
    null_counts = df.isnull().sum()
    total_rows = len(df)
    
    null_info = {}
    for col in df.columns:
        count = int(null_counts[col])
        if count > 0:
            null_rows = df[df[col].isnull()].index.tolist()[:20]  
            null_info[col] = {
                'null_count': count,
                'null_percentage': round(count / total_rows * 100, 2),
                'sample_row_indices': null_rows
            }
    
    return {
        'total_nulls': int(null_counts.sum()),
        'columns_with_nulls': len(null_info),
        'total_columns': len(df.columns),
        'details': null_info
    }


def analyze_zeros(df: pd.DataFrame) -> dict:
    """Analyze zero values in numeric columns"""
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    total_rows = len(df)
    
    zero_info = {}
    for col in numeric_cols:
        count = int((df[col] == 0).sum())
        if count > 0:
            zero_rows = df[df[col] == 0].index.tolist()[:20]
            zero_info[col] = {
                'zero_count': count,
                'zero_percentage': round(count / total_rows * 100, 2),
                'sample_row_indices': zero_rows
            }
    
    return {
        'columns_with_zeros': len(zero_info),
        'details': zero_info
    }


def analyze_negatives(df: pd.DataFrame) -> dict:
    """Analyze negative values in numeric columns"""
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    total_rows = len(df)
    
    neg_info = {}
    for col in numeric_cols:
        count = int((df[col] < 0).sum())
        if count > 0:
            neg_rows = df[df[col] < 0].index.tolist()[:20]
            neg_info[col] = {
                'negative_count': count,
                'negative_percentage': round(count / total_rows * 100, 2),
                'min_value': float(df[col].min()),
                'sample_row_indices': neg_rows
            }
    
    return {
        'columns_with_negatives': len(neg_info),
        'details': neg_info
    }


def analyze_duplicates(df: pd.DataFrame) -> dict:
    """Detect duplicate rows"""
    dup_count = int(df.duplicated().sum())
    return {
        'duplicate_rows': dup_count,
        'duplicate_percentage': round(dup_count / len(df) * 100, 2),
        'total_rows': len(df)
    }


def analyze_statistics(df: pd.DataFrame) -> dict:
    """Statistical summary for numeric columns"""
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    stats = {}
    
    for col in numeric_cols:
        series = df[col].dropna()
        stats[col] = {
            'count': int(series.count()),
            'mean': round(float(series.mean()), 4),
            'median': round(float(series.median()), 4),
            'std': round(float(series.std()), 4),
            'min': round(float(series.min()), 4),
            'max': round(float(series.max()), 4),
            'q25': round(float(series.quantile(0.25)), 4),
            'q75': round(float(series.quantile(0.75)), 4),
            'skewness': round(float(series.skew()), 4),
            'kurtosis': round(float(series.kurtosis()), 4),
            'range': round(float(series.max() - series.min()), 4),
            'iqr': round(float(series.quantile(0.75) - series.quantile(0.25)), 4)
        }
    
    return stats


def analyze_outliers(df: pd.DataFrame) -> dict:
    """Detect outliers using IQR method and Z-score"""
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    outlier_info = {}
    
    for col in numeric_cols:
        series = df[col].dropna()
        
        
        q1 = series.quantile(0.25)
        q3 = series.quantile(0.75)
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        iqr_outliers = ((series < lower_bound) | (series > upper_bound)).sum()
        
        
        if series.std() > 0:
            z_scores = np.abs((series - series.mean()) / series.std())
            zscore_outliers = (z_scores > 3).sum()
        else:
            zscore_outliers = 0
        
        if iqr_outliers > 0 or zscore_outliers > 0:
            iqr_outlier_rows = df[(df[col] < lower_bound) | (df[col] > upper_bound)].index.tolist()[:10]
            outlier_info[col] = {
                'iqr_outlier_count': int(iqr_outliers),
                'iqr_outlier_percentage': round(int(iqr_outliers) / len(series) * 100, 2),
                'zscore_outlier_count': int(zscore_outliers),
                'lower_bound': round(float(lower_bound), 4),
                'upper_bound': round(float(upper_bound), 4),
                'sample_outlier_rows': iqr_outlier_rows
            }
    
    
    outlier_info = dict(sorted(outlier_info.items(), key=lambda x: x[1]['iqr_outlier_count'], reverse=True))
    
    return {
        'columns_with_outliers': len(outlier_info),
        'details': outlier_info
    }


def analyze_correlations(df: pd.DataFrame, feature_cols: list = None) -> dict:
    """Analyze feature correlations"""
    if feature_cols:
        available = [c for c in feature_cols if c in df.columns]
        numeric_df = df[available].select_dtypes(include=[np.number])
    else:
        numeric_df = df.select_dtypes(include=[np.number])
    
    if numeric_df.empty:
        return {'high_correlations': [], 'correlation_matrix': {}}
    
    corr_matrix = numeric_df.corr()
    
    
    high_correlations = []
    for i in range(len(corr_matrix.columns)):
        for j in range(i + 1, len(corr_matrix.columns)):
            val = corr_matrix.iloc[i, j]
            if abs(val) > 0.85:
                high_correlations.append({
                    'feature_1': corr_matrix.columns[i],
                    'feature_2': corr_matrix.columns[j],
                    'correlation': round(float(val), 4)
                })
    
    high_correlations.sort(key=lambda x: abs(x['correlation']), reverse=True)
    
    
    corr_dict = {}
    for col in corr_matrix.columns:
        corr_dict[col] = {c: round(float(corr_matrix.loc[col, c]), 4) for c in corr_matrix.columns}
    
    return {
        'high_correlations': high_correlations,
        'correlation_matrix': corr_dict
    }


def analyze_distributions(df: pd.DataFrame) -> dict:
    """Identify skewed features that may need transformation"""
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    dist_info = {}
    
    for col in numeric_cols:
        series = df[col].dropna()
        skew = float(series.skew())
        
        if abs(skew) > 1:
            skew_label = 'highly_skewed'
        elif abs(skew) > 0.5:
            skew_label = 'moderately_skewed'
        else:
            skew_label = 'approximately_normal'
        
        dist_info[col] = {
            'skewness': round(skew, 4),
            'skew_direction': 'right' if skew > 0 else 'left',
            'skew_category': skew_label,
            'needs_transformation': abs(skew) > 1,
            'unique_values': int(series.nunique())
        }
    
    
    needs_transform = [col for col, info in dist_info.items() if info['needs_transformation']]
    
    return {
        'columns_needing_transformation': needs_transform,
        'details': dist_info
    }


def analyze_target(df: pd.DataFrame, target_col: str) -> dict:
    """Analyze the target variable distribution"""
    if target_col not in df.columns:
        return {'error': f'Target column {target_col} not found'}
    
    series = df[target_col].dropna()
    
    return {
        'target_column': target_col,
        'count': int(series.count()),
        'mean': round(float(series.mean()), 2),
        'median': round(float(series.median()), 2),
        'std': round(float(series.std()), 2),
        'min': round(float(series.min()), 2),
        'max': round(float(series.max()), 2),
        'skewness': round(float(series.skew()), 4),
        'kurtosis': round(float(series.kurtosis()), 4),
        'zero_count': int((series == 0).sum()),
        'negative_count': int((series < 0).sum())
    }


def analyze_dataset(name: str, df: pd.DataFrame, target_col: str, feature_cols: list = None) -> dict:
    """Run full EDA on a dataset"""
    print(f"\n{'='*60}")
    print(f"Analyzing: {name}")
    print(f"Shape: {df.shape}")
    print(f"{'='*60}")
    
    report = {
        'dataset_name': name,
        'generated_at': datetime.now().isoformat(),
        'shape': {'rows': df.shape[0], 'columns': df.shape[1]},
        'columns': df.columns.tolist(),
        'dtypes': {col: str(dtype) for col, dtype in df.dtypes.items()},
        'memory_usage_mb': round(df.memory_usage(deep=True).sum() / 1024 / 1024, 2)
    }
    
    
    print("  [1/8] Null value analysis...")
    report['null_analysis'] = analyze_nulls(df)
    print(f"       Total nulls: {report['null_analysis']['total_nulls']}")
    
    
    print("  [2/8] Zero value analysis...")
    report['zero_analysis'] = analyze_zeros(df)
    print(f"       Columns with zeros: {report['zero_analysis']['columns_with_zeros']}")
    
    
    print("  [3/8] Negative value analysis...")
    report['negative_analysis'] = analyze_negatives(df)
    print(f"       Columns with negatives: {report['negative_analysis']['columns_with_negatives']}")
    
    
    print("  [4/8] Duplicate detection...")
    report['duplicate_analysis'] = analyze_duplicates(df)
    print(f"       Duplicate rows: {report['duplicate_analysis']['duplicate_rows']}")
    
    
    print("  [5/8] Statistical summary...")
    report['statistics'] = analyze_statistics(df)
    
    
    print("  [6/8] Outlier detection (IQR + Z-score)...")
    report['outlier_analysis'] = analyze_outliers(df)
    print(f"       Columns with outliers: {report['outlier_analysis']['columns_with_outliers']}")
    
    
    print("  [7/8] Correlation analysis...")
    report['correlation_analysis'] = analyze_correlations(df, feature_cols)
    print(f"       High correlations (>0.85): {len(report['correlation_analysis']['high_correlations'])}")
    
    
    print("  [8/8] Distribution analysis...")
    report['distribution_analysis'] = analyze_distributions(df)
    print(f"       Columns needing transformation: {len(report['distribution_analysis']['columns_needing_transformation'])}")
    
    
    report['target_analysis'] = analyze_target(df, target_col)
    
    return report


def run_eda():
    """Main EDA execution"""
    ensure_reports_dir()
    
    print("=" * 60)
    print("BurnVision EDA Analysis")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    
    exercise_df = pd.read_csv(DATASET_DIR / 'raw_exercise.csv')
    calories_df = pd.read_csv(DATASET_DIR / 'raw_calories.csv')
    standard_df = pd.merge(exercise_df, calories_df, on='User_ID')
    
    standard_features = ['Gender', 'Age', 'Height', 'Weight', 'Duration', 'Heart_Rate', 'Body_Temp']
    standard_report = analyze_dataset(
        name='Standard Calorie Dataset (raw_exercise + raw_calories)',
        df=standard_df,
        target_col='Calories',
        feature_cols=standard_features + ['Calories']
    )
    
    report_path = REPORTS_DIR / 'eda_standard_dataset.json'
    with open(report_path, 'w') as f:
        json.dump(convert_to_serializable(standard_report), f, indent=2)
    print(f"\n  Report saved: {report_path}")
    
    
    workout_df = pd.read_csv(DATASET_DIR / 'workout_data.csv')
    
    advanced_features = [
        'Age', 'Gender', 'Weight (kg)', 'Height (m)',
        'Resting_BPM', 'Avg_BPM',
        'Workout_Type', 'Name of Exercise',
        'Session_Duration (hours)', 'Sets', 'Reps',
        'Difficulty Level', 'Experience_Level',
        'Water_Intake (liters)', 'Workout_Frequency (days/week)',
        'Calories_Burned'
    ]
    advanced_report = analyze_dataset(
        name='Advanced Calorie Dataset (workout_data)',
        df=workout_df,
        target_col='Calories_Burned',
        feature_cols=advanced_features
    )
    
    report_path = REPORTS_DIR / 'eda_advanced_dataset.json'
    with open(report_path, 'w') as f:
        json.dump(convert_to_serializable(advanced_report), f, indent=2)
    print(f"\n  Report saved: {report_path}")
    
    
    print(f"\n{'='*60}")
    print("EDA SUMMARY")
    print(f"{'='*60}")
    
    for report in [standard_report, advanced_report]:
        name = report['dataset_name']
        print(f"\n{name}:")
        print(f"  Shape: {report['shape']}")
        print(f"  Nulls: {report['null_analysis']['total_nulls']}")
        print(f"  Duplicates: {report['duplicate_analysis']['duplicate_rows']}")
        print(f"  Columns with zeros: {report['zero_analysis']['columns_with_zeros']}")
        print(f"  Columns with negatives: {report['negative_analysis']['columns_with_negatives']}")
        print(f"  Columns with outliers: {report['outlier_analysis']['columns_with_outliers']}")
        hc = report['correlation_analysis']['high_correlations']
        if hc:
            print(f"  High correlations:")
            for pair in hc[:5]:
                print(f"    {pair['feature_1']} <-> {pair['feature_2']}: {pair['correlation']}")
        transform = report['distribution_analysis']['columns_needing_transformation']
        if transform:
            print(f"  Skewed columns (need transform): {transform[:5]}")
    
    print(f"\nReports saved to: {REPORTS_DIR}")
    print("EDA Complete!")


if __name__ == '__main__':
    run_eda()
