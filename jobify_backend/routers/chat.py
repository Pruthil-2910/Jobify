"""Chat router - conversational chatbot endpoint."""
from fastapi import APIRouter, Depends, HTTPException, Request, status

from auth.dependencies import get_current_user
from agents.chatbot_graph import chatbot_graph
from agents.state import ChatState
from models.resume import ChatRequest, ChatResponse
from services.embedding import InvalidAPIKeyError, RateLimitError

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/message", response_model=ChatResponse)
async def chat_message(
    body: ChatRequest,
    request: Request,
    current_user=Depends(get_current_user),
):
    """Send a chat message to the conversational agent."""
    gemini_key = getattr(request.state, "gemini_key", None)
    if not gemini_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "invalid_gemini_key", "message": "Missing or invalid Gemini API key"},
        )

    user_id = getattr(current_user, "id", None) or (
        current_user.get("id") if isinstance(current_user, dict) else None
    )

    initial_state: ChatState = {
        "user_id": user_id,
        "resume_json": "",
        "user_message": body.message,
        "gemini_key": gemini_key,
    }

    try:
        final = await chatbot_graph.ainvoke(initial_state)
    except InvalidAPIKeyError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "invalid_gemini_key", "message": "Invalid Gemini API key"},
        )
    except RateLimitError:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"code": "rate_limit", "message": "Rate limit exceeded"},
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "internal_error", "message": "An internal error occurred"},
        )

    return ChatResponse(
        response=final.get("final_response", ""),
        intent=final.get("intent", "general"),
        jobs_referenced=final.get("retrieved_jobs", []),
    )
