import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from sklearn.preprocessing import StandardScaler
from typing import Tuple, Optional


class DataPreprocessor:
    
    def __init__(self, name: str = 'default'):
        self.name = name
        self.scaler: Optional[StandardScaler] = None
        self.iqr_bounds: dict = {}
        self.impute_values: dict = {}
        self.is_fitted = False
    
    def handle_nulls(self, df: pd.DataFrame) -> pd.DataFrame:

        df = df.copy()
        nulls_before = df.isnull().sum().sum()
        
        if nulls_before == 0:
            print(f"  [{self.name}] No null values found")
            return df
        
        for col in df.columns:
            null_count = df[col].isnull().sum()
            if null_count > 0:
                if df[col].dtype in ['float64', 'int64', 'float32', 'int32']:
                    fill_val = df[col].median()
                    df[col].fillna(fill_val, inplace=True)
                    self.impute_values[col] = fill_val
                    print(f"  [{self.name}] Imputed {null_count} nulls in '{col}' with median={fill_val:.2f}")
                else:
                    fill_val = df[col].mode()[0] if not df[col].mode().empty else 'Unknown'
                    df[col].fillna(fill_val, inplace=True)
                    self.impute_values[col] = fill_val
                    print(f"  [{self.name}] Imputed {null_count} nulls in '{col}' with mode='{fill_val}'")
        
        print(f"  [{self.name}] Null handling: {nulls_before} -> {df.isnull().sum().sum()} nulls")
        return df
    
    def remove_duplicates(self, df: pd.DataFrame) -> pd.DataFrame:
        before = len(df)
        df = df.drop_duplicates().reset_index(drop=True)
        removed = before - len(df)
        if removed > 0:
            print(f"  [{self.name}] Removed {removed} duplicate rows ({before} -> {len(df)})")
        else:
            print(f"  [{self.name}] No duplicate rows found")
        return df
    
    def cap_outliers(self, df: pd.DataFrame, feature_cols: list) -> pd.DataFrame:
        df = df.copy()
        numeric_features = [col for col in feature_cols if col in df.columns and df[col].dtype in ['float64', 'int64', 'float32', 'int32']]
        total_capped = 0
        
        for col in numeric_features:
            q1 = df[col].quantile(0.25)
            q3 = df[col].quantile(0.75)
            iqr = q3 - q1
            lower = q1 - 1.5 * iqr
            upper = q3 + 1.5 * iqr
            
            self.iqr_bounds[col] = {'lower': float(lower), 'upper': float(upper)}
            
            below = (df[col] < lower).sum()
            above = (df[col] > upper).sum()
            capped = below + above
            
            if capped > 0:
                df[col] = df[col].clip(lower=lower, upper=upper)
                total_capped += capped
                print(f"  [{self.name}] Capped {capped} outliers in '{col}' (bounds: [{lower:.2f}, {upper:.2f}])")
        
        if total_capped == 0:
            print(f"  [{self.name}] No outliers to cap in feature columns")
        else:
            print(f"  [{self.name}] Total outliers capped: {total_capped}")
        
        return df
    
    def fit_scaler(self, X: np.ndarray, feature_names: list) -> np.ndarray:
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)
        self.is_fitted = True
        print(f"  [{self.name}] StandardScaler fitted on {X.shape[1]} features, {X.shape[0]} samples")
        return X_scaled
    
    def transform(self, X: np.ndarray) -> np.ndarray:
        if self.scaler is None:
            return X
        return self.scaler.transform(X)
    
    def save(self, path: Path):
        state = {
            'scaler': self.scaler,
            'iqr_bounds': self.iqr_bounds,
            'impute_values': self.impute_values,
            'is_fitted': self.is_fitted,
            'name': self.name
        }
        joblib.dump(state, path)
        print(f"  [{self.name}] Preprocessor saved to {path}")
    
    def load(self, path: Path) -> bool:
        if path.exists():
            state = joblib.load(path)
            self.scaler = state.get('scaler')
            self.iqr_bounds = state.get('iqr_bounds', {})
            self.impute_values = state.get('impute_values', {})
            self.is_fitted = state.get('is_fitted', False)
            self.name = state.get('name', self.name)
            print(f"  [{self.name}] Preprocessor loaded from {path}")
            return True
        return False
    
    def preprocess_training_data(self, df: pd.DataFrame, feature_cols: list, target_col: str) -> Tuple[np.ndarray, np.ndarray]:
        print(f"\n  [{self.name}] === PREPROCESSING PIPELINE START ===")
        print(f"  [{self.name}] Input shape: {df.shape}")
        
        df = self.handle_nulls(df)
        
        df = self.remove_duplicates(df)
        
        df = self.cap_outliers(df, feature_cols)
        
        X = df[feature_cols].values
        y = df[target_col].values
        
        X_scaled = self.fit_scaler(X, feature_cols)
        
        print(f"  [{self.name}] Output shape: X={X_scaled.shape}, y={y.shape}")
        print(f"  [{self.name}] === PREPROCESSING PIPELINE COMPLETE ===\n")
        
        return X_scaled, y
    
    def preprocess_prediction_input(self, X: np.ndarray) -> np.ndarray:
        if self.scaler is not None and self.is_fitted:
            return self.scaler.transform(X)
        return X
