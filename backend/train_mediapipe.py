import os
import cv2
import pickle
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from mediapipe.python.solutions import pose as mp_pose

pose = mp_pose.Pose(static_image_mode=True, min_detection_confidence=0.5)

dataset_path = os.path.join("ai_client", "dataset")
CLASS_NAMES = sorted([
    folder for folder in os.listdir(dataset_path)
    if os.path.isdir(os.path.join(dataset_path, folder))
])

X = []
y = []

print("Extracting mediapipe landmarks from dataset...")
for idx, class_name in enumerate(CLASS_NAMES):
    folder_path = os.path.join(dataset_path, class_name)
    images = [f for f in os.listdir(folder_path) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    print(f"Processing {class_name} ({len(images)} images)")
    
    for img_name in images:
        img_path = os.path.join(folder_path, img_name)
        img = cv2.imread(img_path)
        if img is None: continue
        
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        result = pose.process(img_rgb)
        
        if result.pose_landmarks:
            landmarks = []
            for lm in result.pose_landmarks.landmark:
                landmarks.extend([lm.x, lm.y, lm.z, lm.visibility])
            X.append(landmarks)
            y.append(idx)

X = np.array(X)
y = np.array(y)

print(f"Dataset shape: {X.shape}, labels: {y.shape}")
print("Training Random Forest Classifier...")

clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X, y)

accuracy = clf.score(X, y)
print(f"Training accuracy: {accuracy * 100:.2f}%")

with open("yoga_rf_model.pkl", "wb") as f:
    pickle.dump(clf, f)

print("Saved model to yoga_rf_model.pkl")
