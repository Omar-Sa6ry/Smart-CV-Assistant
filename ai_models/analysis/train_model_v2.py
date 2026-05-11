"""
train_model_v2.py (Fixed for Windows Encoding & Ultra Dataset)
=============================================================
"""

import pandas as pd
import re
import joblib
import numpy as np
import warnings
import sys
import io
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

warnings.filterwarnings('ignore')

# ── Paths ─────────────────────────────────────────────────────────────────────
DATASET_PATH = 'resume_dataset_ultra.csv'
MODEL_V2_PATH    = 'resume_model_v2.pkl'
VECTORIZER_V2_PATH = 'tfidf_vectorizer_v2.pkl'
ENCODER_V2_PATH  = 'label_encoder_v2.pkl'

NORMALIZE_MAP = {
    r'\bnode[\s\.]?js\b': 'nodejs',
    r'\bnode[\s\.]?\.js\b': 'nodejs',
    r'\bnext[\s\.]?js\b': 'nextjs',
    r'\breact[\s\.]?js\b': 'reactjs',
    r'\bvue[\s\.]?js\b': 'vuejs',
    r'\bangular[\s\.]?js\b': 'angularjs',
    r'\btypescript\b': 'typescript',
    r'\bc\+\+\b': 'cplusplus',
    r'\bc#\b': 'csharp',
    r'\b\.net\b': 'dotnet',
    r'\bci/cd\b': 'cicd',
    r'\bml\b': 'machine learning',
    r'\bai\b': 'artificial intelligence',
    r'\bsql\s+server\b': 'sqlserver',
    r'\bms\s+sql\b': 'sqlserver',
    r'\basp\.net\b': 'aspnet',
    r'\baws\b': 'amazon web services',
    r'\bgcp\b': 'google cloud platform',
    r'\boci\b': 'oracle cloud',
    r'\bk8s\b': 'kubernetes',
    r'\buiux\b': 'ui ux',
    r'\bui/ux\b': 'ui ux',
    r'\bbig\s+data\b': 'bigdata',
    r'\bdeep\s+learning\b': 'deeplearning',
    r'\bmachine\s+learning\b': 'machinelearning',
    r'\bdata\s+science\b': 'datascience',
    r'\bfull[\s\-]?stack\b': 'fullstack',
    r'\bback[\s\-]?end\b': 'backend',
    r'\bfront[\s\-]?end\b': 'frontend',
    r'\brest\s+api\b': 'restapi',
    r'\bgraph\s*ql\b': 'graphql',
    r'\bno[\s\-]?sql\b': 'nosql',
    r'\bdev[\s\-]?ops\b': 'devops',
}

def normalize_text(text: str) -> str:
    t = str(text).lower()
    for pattern, replacement in NORMALIZE_MAP.items():
        t = re.sub(pattern, replacement, t)
    t = re.sub(r'[\w\.-]+@[\w\.-]+\.\w+', ' ', t)
    t = re.sub(r'https?://\S+|www\.\S+', ' ', t)
    t = re.sub(r'\+?[\d\s\-\(\)]{7,}', ' ', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t

def load_data():
    print(f"Loading dataset from {DATASET_PATH}...")
    df = pd.read_csv(DATASET_PATH)
    print(f"Loaded: {len(df)} samples | {df['Target_Role'].nunique()} categories")
    
    print("Normalizing text (this might take a while for 125k samples)...")
    df['clean_text'] = df['Raw_CV_Text'].astype(str).apply(normalize_text)

    le = LabelEncoder()
    df['label'] = le.fit_transform(df['Target_Role'])
    return df, le

def build_pipeline():
    word_tfidf = TfidfVectorizer(
        analyzer='word',
        ngram_range=(1, 2),
        max_features=20000,
        sublinear_tf=True,
        min_df=2,
        strip_accents='unicode',
    )
    char_tfidf = TfidfVectorizer(
        analyzer='char_wb',
        ngram_range=(2, 5),
        max_features=15000,
        sublinear_tf=True,
        min_df=3,
        strip_accents='unicode',
    )
    features = FeatureUnion([
        ('word', word_tfidf),
        ('char', char_tfidf),
    ])
    svc = LinearSVC(C=1.5, max_iter=3000, class_weight='balanced')
    calibrated = CalibratedClassifierCV(svc, cv=3, method='sigmoid')

    pipeline = Pipeline([
        ('features', features),
        ('clf', calibrated),
    ])
    return pipeline

def train():
    df, le = load_data()
    X = df['clean_text']
    y = df['label']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.15, random_state=42, stratify=y
    )
    print(f"Training split: {len(X_train)} train / {len(X_test)} test")

    pipeline = build_pipeline()

    print("Training LinearSVC pipeline on Ultra Dataset...")
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Test Accuracy: {acc:.4f} ({acc*100:.2f}%)")

    print("\nSaving model v2-Ultra files...")
    joblib.dump(pipeline, MODEL_V2_PATH)
    joblib.dump(le, ENCODER_V2_PATH)
    joblib.dump(NORMALIZE_MAP, VECTORIZER_V2_PATH)
    print(f"Saved: {MODEL_V2_PATH}, {ENCODER_V2_PATH}")
    return pipeline, le

if __name__ == '__main__':
    print("=" * 65)
    print(" Smart CV - Ultra Training (125k samples)")
    print("=" * 65)
    train()
    print("Training complete!")
