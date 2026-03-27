from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import timedelta

from models import User, HealthProfile, YogaSession, Feedback
from schemas import HealthProfileCreate, HealthProfileResponse,YogaSessionResponse,YogaSessionCreate,FeedbackCreate, FeedbackResponse, PosePredictionRequest, PosePredictionResponse
from auth import get_current_user
from utils import calculate_calories

import os
import cv2
import base64
import numpy as np
import tensorflow as tf

import mediapipe as mp
import pickle

print("Loading Yoga Model (Mediapipe RF)...")
try:
    with open("yoga_rf_model.pkl", "rb") as f:
        pose_model = pickle.load(f)
        
    BaseOptions = mp.tasks.BaseOptions
    PoseLandmarker = mp.tasks.vision.PoseLandmarker
    PoseLandmarkerOptions = mp.tasks.vision.PoseLandmarkerOptions
    VisionRunningMode = mp.tasks.vision.RunningMode
    
    options = PoseLandmarkerOptions(
        base_options=BaseOptions(model_asset_path='pose_landmarker_lite.task'),
        running_mode=VisionRunningMode.IMAGE)
        
    landmarker = PoseLandmarker.create_from_options(options)
    
    dataset_path = os.path.join("ai_client", "dataset")
    if os.path.exists(dataset_path):
        CLASS_NAMES = sorted([
            folder for folder in os.listdir(dataset_path)
            if os.path.isdir(os.path.join(dataset_path, folder))
        ])
    else:
        CLASS_NAMES = []
    print(f"Model loaded successfully with {len(CLASS_NAMES)} classes.")
except Exception as e:
    print(f"Failed to load model: {e}")
    pose_model = None
    landmarker = None
    CLASS_NAMES = []


from yoga_recommender import YogaRecommender

from database import engine, SessionLocal
from models import Base, User
from schemas import UserCreate, UserLogin, Token
from auth import hash_password, verify_password, create_access_token


app = FastAPI(title="AI Yoga Coach Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # use frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


recommender = YogaRecommender()


Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def root():
    return {"status": "Backend running"}


@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        name=user.name,
        email=user.email,
        hashed_password=hash_password(user.password),
        age=user.age,
        gender=user.gender,
        yoga_experience=user.yoga_experience
    )

    

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully"}


@app.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(
        data={"sub": db_user.email},
        expires_delta=timedelta(minutes=60)
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@app.post("/health-profile", response_model=HealthProfileResponse)
def create_or_update_health_profile(
    data: HealthProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(HealthProfile).filter(
        HealthProfile.user_id == current_user.id
    ).first()

    if profile:
        profile.issue_type = data.issue_type
        profile.issue_description = data.issue_description
        profile.has_injury = data.has_injury
        profile.injury_description = data.injury_description
    else:
        profile = HealthProfile(
            user_id=current_user.id,
            issue_type=data.issue_type,
            issue_description=data.issue_description,
            has_injury=data.has_injury,
            injury_description=data.injury_description
        )
        db.add(profile)

    db.commit()
    db.refresh(profile)
    return profile


@app.get("/health-profile", response_model=HealthProfileResponse)
def get_health_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(HealthProfile).filter(
        HealthProfile.user_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Health profile not found")

    return profile




@app.post("/recommend-yoga")
def recommend_yoga(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    profile = db.query(HealthProfile).filter(
        HealthProfile.user_id == current_user.id
    ).first()

    if not profile:
        return {"error": "Health profile not found"}

    recommendations = recommender.recommend(
        issue_type=profile.issue_type,
        issue_description=profile.issue_description,
        has_injury=profile.has_injury
    )

    return {
        "user": current_user.name,
        "recommendations": recommendations
    }


@app.get("/all-ailments")
def get_all_ailments():
    return recommender.get_all_ailments()



import math

JOINTS = {
    "Left Arm": (11, 13, 15),
    "Right Arm": (12, 14, 16),
    "Left Leg": (23, 25, 27),
    "Right Leg": (24, 26, 28),
    "Left Hip": (11, 23, 25),
    "Right Hip": (12, 24, 26)
}

def calculate_angle(landmarks, p1, p2, p3):
    a = landmarks[p1]
    b = landmarks[p2]
    c = landmarks[p3]
    ang = math.degrees(math.atan2(c.y-b.y, c.x-b.x) - math.atan2(a.y-b.y, a.x-b.x))
    ang = abs(ang)
    if ang > 180.0:
        ang = 360.0 - ang
    return ang

ideal_angles_cache = {}

def get_ideal_angles(class_name, landmarker):
    if class_name in ideal_angles_cache:
        return ideal_angles_cache[class_name]
        
    dataset_path = os.path.join("ai_client", "dataset", class_name)
    if not os.path.isdir(dataset_path):
        return None
        
    images = [f for f in os.listdir(dataset_path) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    if not images:
        return None
        
    img_path = os.path.join(dataset_path, images[0])
    img = cv2.imread(img_path)
    if img is None: return None
    
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)
    res = landmarker.detect(mp_img)
    
    if not res.pose_landmarks or len(res.pose_landmarks) == 0: return None
    
    lms = res.pose_landmarks[0]
    angles = {}
    for joint, (p1, p2, p3) in JOINTS.items():
        angles[joint] = calculate_angle(lms, p1, p2, p3)
        
    ideal_angles_cache[class_name] = angles
    return angles

@app.post("/yoga-session", response_model=YogaSessionResponse)
def create_yoga_session(
    session: YogaSessionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    calories = calculate_calories(session.duration_seconds)

    yoga_session = YogaSession(
        user_id=current_user.id,
        pose_name=session.pose_name,
        duration_seconds=session.duration_seconds,
        avg_confidence=session.avg_confidence,
        calories_burned=calories
    )

    db.add(yoga_session)
    db.commit()
    db.refresh(yoga_session)

    return yoga_session


@app.get("/my-sessions", response_model=list[YogaSessionResponse])
def my_sessions(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return db.query(YogaSession).filter(
        YogaSession.user_id == current_user.id
    ).all()


@app.post("/feedback", response_model=FeedbackResponse)
def submit_feedback(
    feedback: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    session = db.query(YogaSession).filter(
        YogaSession.id == feedback.session_id,
        YogaSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Yoga session not found")

    fb = Feedback(
        session_id=session.id,
        relieved=feedback.relieved,
        pain_before=feedback.pain_before,
        pain_after=feedback.pain_after,
        comments=feedback.comments
    )

    db.add(fb)
    db.commit()
    db.refresh(fb)

    return fb

@app.get("/progress")
def get_user_progress(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    total_sessions = db.query(YogaSession).filter(
        YogaSession.user_id == current_user.id
    ).count()

    total_calories = db.query(
        func.coalesce(func.sum(YogaSession.calories_burned), 0)
    ).filter(
        YogaSession.user_id == current_user.id
    ).scalar()

    pain_stats = db.query(
        func.avg(Feedback.pain_before - Feedback.pain_after)
    ).join(YogaSession).filter(
        YogaSession.user_id == current_user.id
    ).scalar()

    return {
        "user": current_user.name,
        "total_sessions": total_sessions,
        "total_calories_burned": round(total_calories, 2),
        "average_pain_improvement": round(pain_stats or 0, 2)
    }
    
@app.get("/session-history")
def session_history(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    sessions = db.query(YogaSession).filter(
        YogaSession.user_id == current_user.id
    ).order_by(YogaSession.created_at.asc()).all()

    return [
        {
            "pose": s.pose_name,
            "duration": s.duration_seconds,
            "calories": s.calories_burned,
            "confidence": s.avg_confidence,
            "date": s.created_at
        }
        for s in sessions
    ]

@app.post("/predict-pose", response_model=PosePredictionResponse)
def predict_pose_api(request: PosePredictionRequest):
    if not pose_model or not CLASS_NAMES:
        return {"accuracy": 0.0, "detected_pose": "Model Not Loaded"}
        
    try:
        img_str = request.image_b64
        if "base64," in img_str:
            img_str = img_str.split("base64,")[1]
            
        img_data = base64.b64decode(img_str)
        nparr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return {"accuracy": 0.0, "detected_pose": "Invalid Image"}
            
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
        
        result = landmarker.detect(mp_image)
        if not result.pose_landmarks or len(result.pose_landmarks) == 0:
            return {"accuracy": 0.0, "detected_pose": "Person not visible", "all_predictions": []}
            
        landmarks = []
        for lm in result.pose_landmarks[0]:
            landmarks.extend([lm.x, lm.y, lm.z, lm.visibility])
            
        X_input = np.array([landmarks])
        preds = pose_model.predict_proba(X_input)[0]
        
        idx = np.argmax(preds)
        
        detected_pose = CLASS_NAMES[idx]
        confidence = float(preds[idx])
        
        all_predictions = [
            {"pose": CLASS_NAMES[i], "accuracy": round(float(preds[i]) * 100, 1)}
            for i in range(len(CLASS_NAMES))
        ]
        all_predictions.sort(key=lambda x: x["accuracy"], reverse=True)
        
        def get_words(name):
            return set(name.lower().replace("yoga", "").replace("pose", "").replace("-", " ").replace("_", " ").split())
            
        expected_words = get_words(request.expected_pose)
        
        expected_acc = None
        if expected_words:
            best_match_idx = None
            max_intersect = 0
            for i, cname in enumerate(CLASS_NAMES):
                cname_words = get_words(cname)
                intersect = len(expected_words.intersection(cname_words))
                if intersect > max_intersect:
                    max_intersect = intersect
                    best_match_idx = i
            if best_match_idx is not None:
                expected_acc = float(preds[best_match_idx]) * 100

        if expected_acc is not None:
            final_accuracy = expected_acc
        else:
            final_accuracy = confidence * 100
            
        friendly_detected = detected_pose.lower().replace("yoga", "").replace("pose", "").strip().title()
        feedback = f"Detected {friendly_detected}. Focus on your breathing."

        if expected_acc is not None and best_match_idx is not None:
            target_class_name = CLASS_NAMES[best_match_idx]
            ideal_angles = get_ideal_angles(target_class_name, landmarker)
            friendly_target = target_class_name.lower().replace("yoga", "").replace("pose", "").strip().title()
            
            if ideal_angles:
                user_angles = {}
                user_lms = result.pose_landmarks[0]
                for joint, (p1, p2, p3) in JOINTS.items():
                    user_angles[joint] = calculate_angle(user_lms, p1, p2, p3)
                    
                worst_joint = None
                max_diff = 0
                for joint in JOINTS:
                    diff = user_angles[joint] - ideal_angles[joint]
                    if abs(diff) > max_diff:
                        max_diff = abs(diff)
                        worst_joint = joint
                        
                if max_diff > 20: 
                    diff = user_angles[worst_joint] - ideal_angles[worst_joint]
                    action = "Bend" if diff > 0 else "Straighten"
                    feedback = f"Detected {friendly_detected}. {action} your {worst_joint.lower()} to match {friendly_target}."
                else:
                    feedback = f"Detected {friendly_detected}. Perfect form! Hold this position!"
        else:
            try:
                ls_y = landmarks[11*4+1]
                rs_y = landmarks[12*4+1]
                if abs(ls_y - rs_y) > 0.06:
                    feedback = f"Detected {friendly_detected}. Level your shoulders to keep your spine straight!"
                else:
                    lw_y, rw_y = landmarks[15*4+1], landmarks[16*4+1]
                    if abs(lw_y - rw_y) > 0.15:
                        feedback = f"Detected {friendly_detected}. Try to keep your arm extensions balanced."
                    else:
                        feedback = f"Detected {friendly_detected}. Posture looks well-aligned. Excellent form!"
            except Exception:
                pass
            
        return {
            "accuracy": round(final_accuracy, 1),
            "detected_pose": detected_pose,
            "all_predictions": all_predictions,
            "feedback": feedback
        }
        
    except Exception as e:
        print("Prediction error:", str(e))
        return {"accuracy": 0.0, "detected_pose": "Error"}

@app.get("/pose-image/{pose_name}")
def get_pose_image(pose_name: str):
    def get_words(name):
        return set(name.lower().replace("yoga", "").replace("pose", "").replace("-", " ").replace("_", " ").split())
    
    target_words = get_words(pose_name)
    best_match = None
    max_intersect = 0
    
    for cname in CLASS_NAMES:
        cname_words = get_words(cname)
        intersect = len(target_words.intersection(cname_words))
        if intersect > max_intersect:
            max_intersect = intersect
            best_match = cname
            
    if best_match:
        dataset_path = os.path.join("ai_client", "dataset", best_match)
        if os.path.isdir(dataset_path):
            images = [f for f in os.listdir(dataset_path) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
            if images:
                image_path = os.path.join(dataset_path, images[0])
                return FileResponse(image_path)
                
    return JSONResponse(status_code=404, content={"error": "Image not found"})