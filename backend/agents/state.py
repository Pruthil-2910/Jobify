from typing import TypedDict, Literal
from typing_extensions import NotRequired


class ChatState(TypedDict):
    user_id: int
    resume_json: str
    user_message: str
    intent: NotRequired[Literal["analytical", "semantic", "general"]]
    retrieved_jobs: NotRequired[list[dict]]
    final_response: NotRequired[str]
    gemini_key: str


class JDMatchState(TypedDict):
    user_id: int
    jd_text: str
    jd_embedding: NotRequired[list[float]]
    top_projects: NotRequired[list[dict]]
    gap_analysis: NotRequired[list[str]]
    current_resume_json: str
    tailored_resume_json: NotRequired[str]
    gemini_key: str
    saved_id: NotRequired[int]
