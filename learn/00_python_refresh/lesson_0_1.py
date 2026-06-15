"""
LESSON 0.1 — Python Refresh: variables, types, f-strings
========================================================
You did this early in Scaler. We're just blowing the dust off. ~10 minutes.

HOW TO RUN:  python3 learn/00_python_refresh/lesson_0_1.py
"""

# 1) Variables hold values. Python figures out the type automatically.
name = "future data scientist"     # str  (text)
age = 30                            # int  (whole number)
gpa = 7.4                          # float (decimal)
enrolled = True                    # bool  (True/False)

# 2) type() tells you what something is. This matters A LOT later in ML,
#    because models only eat numbers — never raw text.
print("type of name:", type(name))
print("type of age :", type(age))
print("type of gpa :", type(gpa))

# 3) f-strings = the clean way to build text with variables inside { }.
print(f"\nHi {name}! You are {age}, GPA {gpa}, enrolled = {enrolled}.")

# 4) Math just works.
months_left = 1
hours_per_week = 8
total_hours = months_left * 4 * hours_per_week
print(f"\nIf you study {hours_per_week} hrs/week for {months_left} month,")
print(f"that's about {total_hours} focused hours. Plenty to move the needle.")


# ============================================================
# YOUR TURN  (edit the lines, then re-run the file)
# ============================================================
# TODO 1: Change `name` to your real name and re-run. See it update.
#
# TODO 2: Make a variable `confidence` = 3 (out of 10) today.
#         Print: "My confidence is 3/10 — let's grow it."  using an f-string.
#
# TODO 3: Predict BEFORE running: what does type(gpa == 7.4) print?
#         Then add a print to check. Were you right?

# (write your TODO 2 code below this line)
