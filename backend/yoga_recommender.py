import json
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "yogaposes.json")



class YogaRecommender:
    def __init__(self):
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            self.poses = json.load(f)

    def recommend(self, issue_type: str, issue_description: str, has_injury: bool):
        issue_text = (issue_type + " " + issue_description).lower()
        # Simple stop words to improve keyword matching
        stop_words = {"i", "a", "the", "and", "is", "of", "to", "my", "with", "for", "in"}
        keywords = {word for word in issue_text.split() if word not in stop_words}
        
        recommendations = []

        for pose in self.poses:
            score = 0
            reasons = []

            # 1. Match Issue Type directly to categories or ailments (High Weight)
            type_lower = issue_type.lower()
            if any(type_lower in cat.lower() for cat in pose.get("category", [])):
                score += 5
                reasons.append(f"Ideal for {issue_type}")
            
            for ailment in pose.get("ailments_helped", []):
                if type_lower in ailment.lower() or ailment.lower() in type_lower:
                    score += 5
                    reasons.append(f"Specifically helps {ailment}")

            # 2. Match Keywords in benefits and descriptions (Medium Weight)
            for benefit in pose.get("benefits", []):
                benefit_lower = benefit.lower()
                if any(kw in benefit_lower for kw in keywords):
                    score += 2
                    reasons.append("Matches your specific goals")

            # 3. Handle Injury (Penalty)
            if has_injury:
                contra = " ".join(pose.get("contraindications", [])).lower()
                if "injury" in contra or any(kw in contra for kw in keywords):
                    score -= 10
                    reasons.append("Caution: Consult doctor for your injury")

            if score > 0:
                recommendations.append({
                    "pose": pose["english_name"],
                    "score": max(score, 1),
                    "reasons": list(set(reasons)),
                    "benefits": pose.get("benefits", [])
                })

        # Sort by score and then by pose name for stability
        recommendations.sort(key=lambda x: (-x["score"], x["pose"]))
        return recommendations

    def get_all_ailments(self):
        ailments_map = {}
        for pose in self.poses:
            for ailment in pose.get("ailments_helped", []):
                name = ailment.strip().title()
                if name not in ailments_map:
                    ailments_map[name] = []
                ailments_map[name].append({"pose": pose["english_name"]})
        
        res = []
        for ail, poses_list in ailments_map.items():
            poses_list.sort(key=lambda x: x["pose"])
            eff = 100
            final_poses = []
            for p in poses_list:
                final_poses.append({"pose": p["pose"], "effectiveness": eff})
                eff -= 8
                if eff < 75: eff = 75
            res.append({"illness": ail, "poses": final_poses})
        
        res.sort(key=lambda x: x["illness"])
        return res