import cv2
import numpy as np
import tensorflow as tf
import json
import time
from pathlib import Path
import mediapipe as mp

# MediaPipe Tasks API
from mediapipe.tasks.python import vision
from mediapipe.tasks.python import BaseOptions

# ======================================================
# 📁 PATHS
# ======================================================
BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = BASE_DIR / "yoga_pose_model_final.keras"
DATASET_PATH = BASE_DIR / "dataset"
POSE_LANDMARKER_PATH = BASE_DIR / "models" / "pose_landmarker.task"

DATA_DIR = BASE_DIR.parent / "data"
POSE_JSON_PATH = DATA_DIR / "yogaposes.json"
POSE_ID_MAP_PATH = DATA_DIR / "pose_id_map.json"

# MODEL_PATH = BASE_DIR / "yoga_pose_model_final.kera12s"
# DATASET_PATH = BASE_DIR / "dataset" 
# INFO_PATH = BASE_DIR.parent / "data" / "yogaposes.json"
# POSE_LANDMARKER_PATH = BASE_DIR / "models" / "pose_landmarker.task"

# ======================================================
# 🔍 VALIDATION
# ======================================================
for p in [
    MODEL_PATH,
    DATASET_PATH,
    POSE_LANDMARKER_PATH,
    POSE_JSON_PATH,
    POSE_ID_MAP_PATH
]:
    if not p.exists():
        raise FileNotFoundError(f"❌ Missing required file: {p}")

# ======================================================
# 🤖 LOAD MODEL
# ======================================================
model = tf.keras.models.load_model(MODEL_PATH)
print("✅ Yoga pose model loaded")

# ======================================================
# 🏷️ LOAD CLASS NAMES
# ======================================================
class_names = sorted([
    d.name for d in DATASET_PATH.iterdir()
    if d.is_dir()
])
print(f"✅ Loaded {len(class_names)} poses")

# ======================================================
# 🧘 SELECT POSE
# ======================================================
print("\nSelect a pose to practice:\n")
for i, name in enumerate(class_names, 1):
    print(f"{i}. {name}")

choice = int(input("\nEnter pose number: ")) - 1
if choice not in range(len(class_names)):
    raise ValueError("Invalid selection")

selected_pose = class_names[choice]
print(f"\n🧘 Selected pose: {selected_pose}")

# ======================================================
# 🆔 LOAD POSE ID MAP
# ======================================================
with open(POSE_ID_MAP_PATH, "r", encoding="utf-8") as f:
    pose_id_map = json.load(f)

if selected_pose not in pose_id_map:
    raise KeyError(f"Pose ID not found for '{selected_pose}'")

selected_pose_id = pose_id_map[selected_pose]
print(f"🔑 Pose ID: {selected_pose_id}")

# ======================================================
# 📘 LOAD YOGA POSES JSON (BY ID)
# ======================================================
with open(POSE_JSON_PATH, "r", encoding="utf-8") as f:
    poses_data = json.load(f)

pose_record = next(
    (p for p in poses_data if p.get("id") == selected_pose_id),
    None
)

if not pose_record:
    raise ValueError(f"No pose found with id={selected_pose_id}")

benefits = pose_record.get("benefits", [])

# ======================================================
# 🖼️ LOAD REFERENCE IMAGES
# ======================================================
pose_folder = DATASET_PATH / selected_pose
ref_images = [
    cv2.resize(cv2.imread(str(p)), (320, 240))
    for p in pose_folder.iterdir()
    if p.suffix.lower() in [".jpg", ".jpeg", ".png"]
]

# ======================================================
# 🧍 CREATE POSE LANDMARKER
# ======================================================
options = vision.PoseLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=str(POSE_LANDMARKER_PATH)),
    running_mode=vision.RunningMode.VIDEO,
    num_poses=1
)

pose_landmarker = vision.PoseLandmarker.create_from_options(options)

# ======================================================
# 🔮 PREDICT POSE
# ======================================================
def predict_pose(frame):
    img = cv2.resize(frame, (224, 224))
    img = img.astype("float32") / 255.0
    img = np.expand_dims(img, axis=0)
    preds = model.predict(img, verbose=0)
    idx = int(np.argmax(preds))
    return class_names[idx], float(preds[0][idx])

# ======================================================
# 🎥 CAMERA UI
# ======================================================
cap = cv2.VideoCapture(0)
timestamp_ms = 0

cv2.namedWindow("🧘 Yoga Pose Trainer", cv2.WINDOW_NORMAL)
cv2.setWindowProperty(
    "🧘 Yoga Pose Trainer",
    cv2.WND_PROP_FULLSCREEN,
    cv2.WINDOW_FULLSCREEN
)

img_index = 0
last_switch = time.time()
show_benefits = False

print("🎥 Camera started | Q = quit | B = benefits")

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)

    pose_name, confidence = predict_pose(frame)

    if confidence > 0.8:
        feedback = "✅ Great form!"
        color = (0, 255, 0)
    elif confidence > 0.5:
        feedback = "⚠️ Adjust slightly!"
        color = (0, 255, 255)
    else:
        feedback = "❌ Try to match reference"
        color = (0, 0, 255)

    if ref_images and time.time() - last_switch > 3:
        img_index = (img_index + 1) % len(ref_images)
        last_switch = time.time()

    reference = ref_images[img_index] if ref_images else np.zeros((240, 320, 3))
    frame_r = cv2.resize(frame, (400, 480))
    ref_r = cv2.resize(reference, (400, 480))

    cv2.putText(ref_r, "Reference", (10, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 200, 255), 3)

    cv2.putText(frame_r, f"{pose_name} ({confidence:.2f})",
                (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 3)

    cv2.putText(frame_r, feedback,
                (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 1, color, 3)

    final = np.hstack((ref_r, frame_r))

    if show_benefits:
        overlay = final.copy()
        cv2.rectangle(overlay, (30, 80), (1200, 500), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.75, final, 0.25, 0, final)

        cv2.putText(final, f"Benefits of {selected_pose}:",
                    (60, 130), cv2.FONT_HERSHEY_SIMPLEX, 1.1, (0, 255, 255), 2)

        for i, b in enumerate(benefits):
            cv2.putText(final, f"- {b}",
                        (70, 180 + i * 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 255), 2)

    cv2.putText(final, "B = Benefits | Q = Quit",
                (40, 450), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)

    cv2.imshow("🧘 Yoga Pose Trainer", final)

    key = cv2.waitKey(1) & 0xFF
    if key == ord("q"):
        break
    elif key == ord("b"):
        show_benefits = not show_benefits

cap.release()
cv2.destroyAllWindows()