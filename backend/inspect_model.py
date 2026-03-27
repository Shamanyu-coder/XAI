import tensorflow as tf

def main():
    try:
        model = tf.keras.models.load_model('best_yoga_pose_model.keras')
        print("Model loaded successfully.")
        model.summary()
        
        # also print input/output shapes to be sure
        print("Inputs:", model.inputs)
        print("Outputs:", model.outputs)
    except Exception as e:
        print("Error loading model:", str(e))

if __name__ == "__main__":
    main()
