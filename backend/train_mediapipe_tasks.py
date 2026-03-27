import os
import cv2
import pickle
import numpy as np
import urllib.request
from sklearn.ensemble import RandomForestClassifier
import mediapipe as mp

task_path = 'pose_landmarker_lite.task'
if not os.path.exists(task_path):
    print("Downloading Mediapipe Task Model...")
    urllib.request.urlretrieve('https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task', task_path)

BaseOptions = mp.tasks.BaseOptions
PoseLandmarker = mp.tasks.vision.PoseLandmarker
PoseLandmarkerOptions = mp.tasks.vision.PoseLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode

options = PoseLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=task_path),
    running_mode=VisionRunningMode.IMAGE)

landmarker = PoseLandmarker.create_from_options(options)

dataset_path = os.path.join("ai_client", "dataset")
CLASS_NAMES = sorted([
    folder for folder in os.listdir(dataset_path)
    if os.path.isdir(os.path.join(dataset_path, folder))
])

X = []
y = []

print("Extracting landmarks using MediaPipe Tasks...")
for idx, class_name in enumerate(CLASS_NAMES):
    folder_path = os.path.join(dataset_path, class_name)
    images = [f for f in os.listdir(folder_path) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    print(f"Processing {class_name} ({len(images)} images)")
    
    for img_name in images:
        img_path = os.path.join(folder_path, img_name)
        img = cv2.imread(img_path)
        if img is None: continue
        
        # Convert to RGB and Mediapipe Image format
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)
        
        result = landmarker.detect(mp_image)
        
        if result.pose_landmarks and len(result.pose_landmarks) > 0:
            landmarks = []
            # Only use the first person's landmarks
            for lm in result.pose_landmarks[0]:
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
