"""
LESSON 1.1 — HOW A MODEL LEARNS (Gradient Descent)
==================================================
This is THE idea that everything in ML stands on. The exact thing that
tripped you in "Maths for ML". We'll demystify it in ~20 minutes.

THE STORY:
We have students' (hours studied -> exam score). We want a straight line
    score = w * hours + b
that predicts score from hours. The computer does NOT know w and b.
It GUESSES, measures how wrong it is, and nudges the guess. Over and over.
That nudging is "gradient descent". That's all "learning" means.

RUN IT:   python3 learn/week1_ml_spine/lesson_1_1_how_models_learn.py
"""

import numpy as np
import matplotlib
matplotlib.use("Agg")          # save plots to a file (no screen needed)
import matplotlib.pyplot as plt

# ---------------------------------------------------------------
# 1) THE DATA  (hours studied, exam score). Real-ish, a bit noisy.
# ---------------------------------------------------------------
hours  = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], dtype=float)
scores = np.array([12, 25, 33, 41, 49, 61, 67, 78, 84, 92], dtype=float)

# ---------------------------------------------------------------
# 2) THE MODEL: a line  score = w*hours + b
#    Start with a DELIBERATELY BAD guess so we can watch it improve.
# ---------------------------------------------------------------
w = 0.0     # slope  (how many points per study-hour)
b = 0.0     # intercept (score with 0 hours)

lr = 0.01           # learning rate = how big each nudge is
epochs = 200        # how many times we nudge
n = len(hours)

# We'll snapshot the line at a few moments to SEE it learn.
snapshots = {}
loss_history = []

# ---------------------------------------------------------------
# 3) THE LEARNING LOOP  (gradient descent)
# ---------------------------------------------------------------
for epoch in range(epochs + 1):
    # a) PREDICT with current guess
    pred = w * hours + b

    # b) MEASURE error. MSE = average of (prediction - truth)^2.
    #    Squaring punishes big misses and keeps everything positive.
    error = pred - scores
    loss = np.mean(error ** 2)
    loss_history.append(loss)

    # c) WHICH WAY to nudge? The gradient = the slope of the loss.
    #    These two lines ARE the calculus from "Maths for ML".
    #    Don't memorize them yet — just feel what they do:
    #    "if predictions are too high, push w and b down, and vice-versa."
    grad_w = (2 / n) * np.sum(error * hours)
    grad_b = (2 / n) * np.sum(error)

    # d) NUDGE the guess a little bit AGAINST the gradient (downhill).
    w -= lr * grad_w
    b -= lr * grad_b

    if epoch in (0, 5, 20, 50, epochs):
        snapshots[epoch] = (w, b)
        print(f"epoch {epoch:3d} | loss = {loss:8.2f} | line: score = {w:.2f}*hours + {b:.2f}")

print(f"\nFINAL learned line:  score = {w:.2f} * hours + {b:.2f}")
print(f"Prediction for 7.5 hours of study: {w*7.5 + b:.1f} marks")

# ---------------------------------------------------------------
# 4) PICTURE IT — save a plot so you can SEE the line learning.
# ---------------------------------------------------------------
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

ax1.scatter(hours, scores, color="black", zorder=3, label="real students")
xline = np.linspace(0, 11, 50)
for ep, (ww, bb) in snapshots.items():
    ax1.plot(xline, ww * xline + bb, label=f"epoch {ep}")
ax1.set_title("The line learning to fit the data")
ax1.set_xlabel("hours studied"); ax1.set_ylabel("exam score"); ax1.legend()

ax2.plot(loss_history, color="crimson")
ax2.set_title("Error shrinking as it learns (this is 'learning')")
ax2.set_xlabel("epoch"); ax2.set_ylabel("loss (MSE)")

plt.tight_layout()
out = "learn/week1_ml_spine/lesson_1_1_plot.png"
plt.savefig(out, dpi=90)
print(f"\nSaved picture -> {out}")


# ===============================================================
# YOUR TURN  (do these, then re-run)
# ===============================================================
# TODO 1: Change lr to 0.001. Re-run. Does it learn faster or slower? Why?
# TODO 2: Change lr to 0.05 (too big). Watch the loss numbers.
#         What goes wrong? (this teaches you what "learning rate" really is)
# TODO 3 (viva muscle): in ONE sentence, explain what grad_w is telling the model.
