import os
import cv2
import numpy as np
import tensorflow as tf

model = tf.keras.models.load_model('../yoga_pose_model_final.keras')

dataset_path = os.path.join("ai_client", "dataset")
CLASS_NAMES = sorted([
    folder for folder in os.listdir(dataset_path)
    if os.path.isdir(os.path.join(dataset_path, folder))
])

# Pick an image
img_path = os.path.join(dataset_path, "Downward Facing Dog yoga pose", "Image_1.png")
if not os.path.exists(img_path):
    print("Image not found")
    exit()

frame = cv2.imread(img_path)
frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

def prepare_predict(img):
    img = cv2.resize(img, (224, 224))
    return np.expand_dims(img.astype("float32"), axis=0)

configs = {
    "1. BGR [0, 255]": prepare_predict(frame),
    "2. RGB [0, 255]": prepare_predict(frame_rgb),
    "3. BGR [0, 1]": prepare_predict(frame) / 255.0,
    "4. RGB [0, 1]": prepare_predict(frame_rgb) / 255.0,
    "5. RGB [-1, 1]": (prepare_predict(frame_rgb) / 127.5) - 1.0,
    "6. MobileNetV2": tf.keras.applications.mobilenet_v2.preprocess_input(prepare_predict(frame_rgb)),
    "7. ResNet50": tf.keras.applications.resnet50.preprocess_input(prepare_predict(frame))
}

with open('results.txt', 'w') as f:
    for name, img_batch in configs.items():
        preds = model.predict(img_batch, verbose=0)[0]
        idx = np.argmax(preds)
        conf = preds[idx]
        pred_class = CLASS_NAMES[idx]
        f.write(f"--- {name} ---\n")
        f.write(f"Top Pred: {pred_class} ({conf*100:.2f}%)\n")
        if "Downward" in pred_class:
            f.write(">>> MATCH!\n")
