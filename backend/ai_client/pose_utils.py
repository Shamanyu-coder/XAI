import cv2
import numpy as np
import mediapipe as mp
import tensorflow as tf
import os
import json
import time

MODEL_PATH = r"D:\\CU\\projects\\XAI by ML\\code hi code\\.venv\\yoga_pose_model_final.keras"
DATASET_PATH = r"D:\\CU\\projects\\XAI by ML\\code hi code\\.venv\DATASET\\TRAIN"
INFO_PATH = r"D:\\CU\\projects\\XAI by ML\\code hi code\\.venv\\yogaposes.json"


if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model not found at {MODEL_PATH}")

model = tf.keras.models.load_model(MODEL_PATH)
print("✅ Yoga pose model loaded successfully.")

class_names = sorted([
    folder for folder in os.listdir(DATASET_PATH)
    if os.path.isdir(os.path.join(DATASET_PATH, folder))
])
print(f"✅ Loaded {len(class_names)} yoga classes: {class_names}")

print("\nSelect a pose to practice:")
for i, name in enumerate(class_names):
    print(f"{i + 1}. {name}")

choice = int(input("\nEnter the number of the pose: ")) - 1
if choice < 0 or choice >= len(class_names):
    raise ValueError("Invalid selection.")

selected_pose = class_names[choice]
print(f"🧘 Selected pose: {selected_pose}")



pose_folder = os.path.join(DATASET_PATH, selected_pose)
ref_images = [
    cv2.imread(os.path.join(pose_folder, img))
    for img in os.listdir(pose_folder)
    if img.lower().endswith(('.png', '.jpg', '.jpeg'))
]
ref_images = [cv2.resize(img, (320, 240)) for img in ref_images if img is not None]

if not ref_images:
    print("⚠️ No reference images found for this pose.")
    
    
pose_info = {}
if os.path.exists(INFO_PATH):
    with open(INFO_PATH, "r") as f:
        pose_info = json.load(f)
    print("✅ Loaded yoga pose info.")
else:
    print("⚠️ No yoga info JSON found. Benefits won't be displayed.")
    
    
benefits = []
if isinstance(pose_info, dict):
    benefits = pose_info.get(selected_pose, {}).get("benefits", [])
elif isinstance(pose_info, list):
    for item in pose_info:
        if isinstance(item, dict) and item.get("pose") == selected_pose:
            benefits = item.get("benefits", [])
            break
        
        
        
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)



def calculate_angle(a, b, c):
    a, b, c = np.array(a), np.array(b), np.array(c)
    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    if angle > 180.0:
        angle = 360 - angle
    return angle

def predict_pose(frame, model, class_names):
    img = cv2.resize(frame, (224, 224))
    img = img.astype("float32") / 255.0
    img = np.expand_dims(img, axis=0)
    preds = model.predict(img, verbose=0)
    idx = np.argmax(preds)
    if idx >= len(class_names):
        return "Unknown", 0.0
    return class_names[idx], float(preds[0][idx])

def normalize_pose_name(name):
    name = name.lower()
    for word in ["yoga", "pose"]:
        name = name.replace(word, "")
    name = name.replace("_", " ").replace("-", " ")
    return " ".join(name.split()).strip()

def normalize_pose_name(name):
    name = name.lower()
    name = name.replace("yoga", "")
    name = name.replace("pose", "")
    name = name.replace("-", " ")
    name = name.replace("_", " ")
    return " ".join(name.split()).strip()


cap = cv2.VideoCapture(0)
if not cap.isOpened():
    raise Exception("Webcam not detected.")
print("🎥 Webcam started. Press 'q' to quit.")

last_pose = None
img_index = 0
last_switch_time = time.time()


cv2.namedWindow("🧘 Yoga Pose Trainer", cv2.WINDOW_NORMAL)
cv2.setWindowProperty("🧘 Yoga Pose Trainer", cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)

show_benefits = False

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)

    # 🔹 Predict pose correctly
    pose_name, confidence = predict_pose(frame, model, class_names)
    
    

    # 🔹 Feedback
    if confidence > 0.8:
        feedback_text = "✅ Great form!"
        feedback_color = (0, 255, 0)
    elif confidence > 0.5:
        feedback_text = "⚠️ Adjust slightly!"
        feedback_color = (0, 255, 255)
    else:
        feedback_text = "❌ Try to match the reference pose"
        feedback_color = (0, 0, 255)

    # 🔹 Select reference image (slideshow)
    if ref_images:
        reference_img = ref_images[img_index]
        if time.time() - last_switch_time > 3:
            img_index = (img_index + 1) % len(ref_images)
            last_switch_time = time.time()
    else:
        reference_img = np.zeros((240, 320, 3), dtype=np.uint8)

    # 🔹 Resize panels
    reference_img_resized = cv2.resize(reference_img, (400, 480))
    frame_resized = cv2.resize(frame, (400, 480))

    # 🔹 Text overlays
    cv2.putText(reference_img_resized, "Reference",
                (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 200, 255), 3)

    cv2.putText(frame_resized, f"{pose_name} ({confidence:.2f})",
                (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 3)

    cv2.putText(frame_resized, feedback_text,
                (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 1, feedback_color, 3)


    # 🔹 Combine panels
    final_frame = np.hstack((reference_img_resized, frame_resized))
    
    if show_benefits:
        overlay = final_frame.copy()
        cv2.rectangle(overlay, (30, 80), (1200, 500), (0, 0, 0), -1)
        alpha = 0.75
        cv2.addWeighted(overlay, alpha, final_frame, 1 - alpha, 0, final_frame)

        benefits_list = []

        normalized_pred = normalize_pose_name(pose_name)

        for item in pose_info:  # pose_info is a LIST
            english_name = item.get("english_name", "")
            if normalize_pose_name(english_name) == normalized_pred:
                benefits_list = item.get("benefits", [])
                break

        if not benefits_list:
            benefits_list = ["No benefits found for this pose."]



        cv2.putText(final_frame, f"Benefits of {pose_name}:",
                (60, 130), cv2.FONT_HERSHEY_SIMPLEX, 1.1, (0, 255, 255), 2)

        for i, line in enumerate(benefits_list):
            cv2.putText(final_frame, f"- {line}",
                    (70, 180 + i * 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 255), 2)


    cv2.putText(final_frame, "Press 'B' for benefits | 'Q' to quit",
                (40, 450), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)

    cv2.imshow("🧘 Yoga Pose Trainer", final_frame)

    key = cv2.waitKey(1) & 0xFF

    if key == ord('q'):
        break

    elif key == ord('b'):
        show_benefits = not show_benefits


cap.release()
cv2.destroyAllWindows()