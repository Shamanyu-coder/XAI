import json
import os
from yoga_recommender import YogaRecommender

# Mock internal data location if needed, but we can just use the class
recommender = YogaRecommender()

def test_recommendation(type_val, desc, injury=False):
    print(f"\n--- Testing for: {type_val} ({desc}), Injury: {injury} ---")
    res = recommender.recommend(issue_type=type_val, issue_description=desc, has_injury=injury)
    if not res:
        print("Empty Recommendations!")
    for r in res:
        print(f"Pose: {r['pose']}, Score: {r['score']}, Reasons: {r['reasons']}")

if __name__ == "__main__":
    test_recommendation("Back Pain", "My back hurts a lot")
    test_recommendation("Stress & Anxiety", "I want to relax and reduce stress")
    test_recommendation("Neck Pain", "Stiff neck from sitting")
    test_recommendation("Neck Pain", "Severe tension in my upper neck and shoulders")
    test_recommendation("Back Pain", "Lower back pain", injury=True)
