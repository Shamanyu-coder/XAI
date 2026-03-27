import os
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import ModelCheckpoint
from PIL import ImageFile

# ✅ Fix truncated images
ImageFile.LOAD_TRUNCATED_IMAGES = True

# ✅ Dataset path
DATASET_PATH = r"C:\Users\kashy\OneDrive\Desktop\XAI\backend\ai_client\dataset"
if not os.path.exists(DATASET_PATH):
    raise FileNotFoundError(f"Dataset path not found: {DATASET_PATH}")
print("📂 Dataset found at:", DATASET_PATH)

# ✅ Data preprocessing & augmentation
train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=25,
    width_shift_range=0.2,
    height_shift_range=0.2,
    shear_range=0.2,
    zoom_range=0.2,
    horizontal_flip=True,
    fill_mode="nearest",
    validation_split=0.2
)

train_generator = train_datagen.flow_from_directory(
    DATASET_PATH,
    target_size=(224, 224),
    batch_size=32,
    class_mode="categorical",
    subset="training"
)

validation_generator = train_datagen.flow_from_directory(
    DATASET_PATH,
    target_size=(224, 224),
    batch_size=32,
    class_mode="categorical",
    subset="validation"
)

class_names = list(train_generator.class_indices.keys())
print(f"✅ Detected {len(class_names)} yoga poses: {class_names}")

# ✅ Build transfer learning model
base_model = MobileNetV2(weights="imagenet", include_top=False, input_shape=(224, 224, 3))
base_model.trainable = False  # Freeze base model

x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dropout(0.3)(x)
predictions = Dense(len(class_names), activation="softmax")(x)

model = Model(inputs=base_model.input, outputs=predictions)

# ✅ Compile
model.compile(
    optimizer=Adam(learning_rate=0.0001),
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)

# ✅ Checkpoint callback
checkpoint = ModelCheckpoint(
    "best_yoga_pose_model.keras",  # Save as .keras format
    monitor="val_accuracy",
    save_best_only=True,
    verbose=1
)

# ✅ Train
EPOCHS = 15
print("🚀 Starting training...")
history = model.fit(
    train_generator,
    validation_data=validation_generator,
    epochs=EPOCHS,
    callbacks=[checkpoint]
)

# ✅ Save final model
model.save("yoga_pose_model_final.keras")
print("✅ Training complete! Model saved as 'yoga_pose_model_final.keras'")