# 🗺️ My Data Science Learning Map — Scaler DSML (Aug24)

> **Goal:** Pass the 4 pending vivas, *actually understand* it, code it myself, and direct AI well — as a manager who gets it.
> **Pace:** ~1 month, flexible. Some topics fast, some slow.
> **ADHD rules:** 25-min blocks · one concept at a time · code in the first 5 min · break when restless · quick win every block.

---

## 🎯 The 4 targets (pending "AI Companion Interview" vivas)
- [ ] **Module 17** — ML: Adv Supervised → PCA, t-SNE, clustering, anomaly detection
- [ ] **Module 18** — ML: Unsupervised & RecSys → time series, recommender systems
- [ ] **Module 22** — Computer Vision → CNNs, transfer learning, detection, GANs
- [ ] **Module 23** — NLP → embeddings, RNN/LSTM, attention, transformers, BERT

## ✅ Already certified (don't re-learn, just keep sharp)
SQL · NumPy/Pandas · Stats Fundamentals

## 🧱 The dependency spine (why we build bottom-up)
```
Maths for ML (gradient descent)   ← where I got tripped
   └─ Linear / Logistic Regression
        └─ Supervised algos (KNN, trees, RF, boosting, SVM)
             └─ Unsupervised (PCA, clustering)      → VIVA 17
             └─ Time series + RecSys                → VIVA 18
        └─ Neural Networks (perceptron, backprop)
             └─ CNNs                                → VIVA 22
             └─ RNN/LSTM/Transformers               → VIVA 23
```

---

## Week 1 — The ML Spine  (the maths that tripped me)
- [ ] 1.1 What is ML? + **how a model learns (gradient descent)**  ← START HERE
- [ ] 1.2 Linear Regression from scratch
- [ ] 1.3 Logistic Regression (classification)
- [ ] 1.4 Overfitting, bias–variance, regularization, cross-validation
- [ ] 1.5 Classification metrics (precision/recall/ROC) + imbalanced data

## Week 2 — Supervised → Unsupervised  → 🎯 VIVA 17
- [ ] 2.1 KNN · 2.2 Decision Trees · 2.3 Random Forest & Bagging
- [ ] 2.4 Boosting (XGBoost intuition) · 2.5 Naive Bayes · 2.6 SVM
- [ ] 2.7 PCA · 2.8 t-SNE/UMAP · 2.9 KMeans/GMM/Hierarchical/DBSCAN · 2.10 Anomaly detection

## Week 3 — RecSys + NN foundations  → 🎯 VIVA 18
- [ ] 3.1 Time series & forecasting · 3.2 Recommender systems
- [ ] 3.3 The perceptron & a neuron · 3.4 Forward + backpropagation

## Week 4 — Deep Learning  → 🎯 VIVAS 22 & 23
- [ ] 4.1 CNNs & transfer learning · 4.2 Object detection / GANs intuition
- [ ] 4.3 Word embeddings (Word2Vec) · 4.4 RNN/LSTM · 4.5 Attention → Transformers → BERT

---

### How each block runs
1. I drop a tiny runnable file in `learn/`.
2. You run it → change one thing → re-run.
3. Do 1–2 TODO exercises.
4. I ask **2 viva-style questions** → you explain it back in plain words.
5. Tick the box. Quick win. Break if needed.
