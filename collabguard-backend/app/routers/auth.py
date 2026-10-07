"""Faculty authentication router."""
import uuid
from fastapi import APIRouter, HTTPException, status, Depends
from app.core.security import verify_password, get_password_hash, create_access_token, get_current_user
from app.db.mongodb import mongodb
from app.schemas.auth import UserRegister, UserLogin, TokenResponse, UserProfile

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
async def register(user_in: UserRegister):
    """Register a new faculty or evaluator account."""
    # Check if user already exists
    if mongodb.is_connected and mongodb.db is not None:
        existing = await mongodb.db.users.find_one({"email": user_in.email})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered.",
            )

    user_id = str(uuid.uuid4())[:8]
    hashed_pwd = get_password_hash(user_in.password)
    user_doc = {
        "id": user_id,
        "email": user_in.email,
        "name": user_in.name,
        "department": user_in.department,
        "course_code": user_in.course_code,
        "password_hash": hashed_pwd,
        "role": "faculty",
    }

    if mongodb.is_connected and mongodb.db is not None:
        await mongodb.db.users.insert_one(user_doc)
    mongodb._mock_data["users"][user_in.email] = user_doc

    access_token = create_access_token(
        subject=user_id,
        claims={"email": user_in.email, "name": user_in.name, "role": "faculty"},
    )

    return TokenResponse(
        access_token=access_token,
        user={
            "id": user_id,
            "email": user_in.email,
            "name": user_in.name,
            "department": user_in.department,
            "course_code": user_in.course_code,
            "role": "faculty",
        },
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Authenticate faculty member and issue JWT."""
    user = None
    if mongodb.is_connected and mongodb.db is not None:
        user = await mongodb.db.users.find_one({"email": credentials.email})
    if not user:
        user = mongodb._mock_data["users"].get(credentials.email)

    # Demo default faculty credential fallback
    if not user and credentials.email in ("faculty@vit.ac.in", "demo@collabguard.edu"):
        user = {
            "id": "fac_default_1",
            "email": credentials.email,
            "name": "Dr. D. Vivek (Faculty Guide)",
            "department": "Computer Science & Engineering",
            "course_code": "BCSE406L",
            "password_hash": get_password_hash("password123"),
            "role": "faculty",
        }

    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    access_token = create_access_token(
        subject=user["id"],
        claims={"email": user["email"], "name": user["name"], "role": user.get("role", "faculty")},
    )

    return TokenResponse(
        access_token=access_token,
        user={
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "department": user.get("department", "CSE"),
            "course_code": user.get("course_code", "BCSE406L"),
            "role": user.get("role", "faculty"),
        },
    )


@router.get("/me", response_model=UserProfile)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Retrieve current faculty profile."""
    if not current_user:
        return UserProfile(
            id="demo_user",
            email="demo@collabguard.edu",
            name="Faculty Guest",
            department="CSE",
            course_code="BCSE406L",
            role="faculty",
        )
    return UserProfile(
        id=current_user["id"],
        email=current_user.get("email", ""),
        name=current_user.get("name", "Faculty"),
        department="Computer Science & Engineering",
        course_code="BCSE406L",
        role=current_user.get("role", "faculty"),
    )
