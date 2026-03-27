def calculate_calories(duration_seconds: int):
    MET = 3.0
    weight_kg = 70
    minutes = duration_seconds / 60
    calories = MET * weight_kg * (minutes / 60)
    return round(calories, 2)