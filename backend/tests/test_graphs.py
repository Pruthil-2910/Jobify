"""Tests for agents.state TypedDicts and graph plumbing.

Validates ChatState/JDMatchState __required_keys__ / __optional_keys__,
provides a _FakeCompiledGraph helper, and includes monkeypatch fixtures
that stub services.embedding.embed_text and ChatGoogleGenerativeAI.

Live integration tests are skipped when GEMINI_API_KEY is not set.
"""
from __future__ import annotations

import os
from typing import Any

import pytest

from agents.state import ChatState, JDMatchState


# ---------------------------------------------------------------------------
# TypedDict shape validation
# ---------------------------------------------------------------------------

def test_chat_state_required_keys():
    required = ChatState.__required_keys__
    assert "user_id" in required
    assert "resume_json" in required
    assert "user_message" in required
    assert "gemini_key" in required


def test_chat_state_optional_keys():
    optional = ChatState.__optional_keys__
    assert "intent" in optional
    assert "retrieved_jobs" in optional
    assert "final_response" in optional


def test_jd_match_state_required_keys():
    required = JDMatchState.__required_keys__
    assert "user_id" in required
    assert "jd_text" in required
    assert "current_resume_json" in required
    assert "gemini_key" in required


def test_jd_match_state_optional_keys():
    optional = JDMatchState.__optional_keys__
    assert "jd_embedding" in optional
    assert "top_projects" in optional
    assert "gap_analysis" in optional
    assert "tailored_resume_json" in optional
    assert "saved_id" in optional


def test_chat_state_construction():
    state: ChatState = {
        "user_id": 1,
        "resume_json": "{}",
        "user_message": "hello",
        "gemini_key": "k",
    }
    assert state["user_id"] == 1


def test_jd_match_state_construction():
    state: JDMatchState = {
        "user_id": 1,
        "jd_text": "Python dev",
        "current_resume_json": "{}",
        "gemini_key": "k",
    }
    assert state["jd_text"] == "Python dev"


# ---------------------------------------------------------------------------
# Fake compiled graph helper
# ---------------------------------------------------------------------------

class _FakeCompiledGraph:
    """Minimal stand-in for a langgraph compiled graph.

    Mimics the .invoke(state) -> state interface so node/graph orchestration
    code can be tested without depending on langgraph at import time.
    """

    def __init__(self, nodes: list | None = None):
        self.nodes = nodes or []
        self.calls: list[dict] = []

    def invoke(self, state: dict, config: dict | None = None) -> dict:
        self.calls.append({"state": dict(state), "config": config})
        result = dict(state)
        for node in self.nodes:
            patch = node(result) or {}
            result.update(patch)
        return result

    async def ainvoke(self, state: dict, config: dict | None = None) -> dict:
        return self.invoke(state, config)


def test_fake_compiled_graph_passthrough():
    graph = _FakeCompiledGraph()
    out = graph.invoke({"a": 1})
    assert out == {"a": 1}
    assert graph.calls and graph.calls[0]["state"] == {"a": 1}


def test_fake_compiled_graph_node_chain():
    def n1(state):
        return {"step1": True}

    def n2(state):
        assert state.get("step1") is True
        return {"step2": True}

    graph = _FakeCompiledGraph(nodes=[n1, n2])
    out = graph.invoke({"start": True})
    assert out["step1"] is True
    assert out["step2"] is True


# ---------------------------------------------------------------------------
# Monkeypatch fixtures: stub services.embedding.embed_text and
# ChatGoogleGenerativeAI so unit tests do not hit the network.
# ---------------------------------------------------------------------------

@pytest.fixture
def stub_embed_text(monkeypatch):
    """Patch services.embedding.embed_text to return a deterministic vector."""
    def _fake_embed(text: str, *args: Any, **kwargs: Any) -> list[float]:
        # Deterministic 8-dim vector based on text length for assertions.
        base = float(len(text) or 1)
        return [base * (i + 1) / 10.0 for i in range(8)]

    try:
        import services.embedding as embedding_mod
    except ImportError:  # pragma: no cover - module may not yet exist
        pytest.skip("services.embedding not available")

    monkeypatch.setattr(embedding_mod, "embed_text", _fake_embed, raising=False)
    return _fake_embed


@pytest.fixture
def stub_chat_gemini(monkeypatch):
    """Patch langchain_google_genai.ChatGoogleGenerativeAI with a fake LLM."""

    class _FakeMessage:
        def __init__(self, content: str):
            self.content = content

    class _FakeChatGoogleGenerativeAI:
        def __init__(self, *args: Any, **kwargs: Any):
            self.args = args
            self.kwargs = kwargs

        def invoke(self, messages, *args: Any, **kwargs: Any):
            return _FakeMessage("stubbed-llm-response")

        async def ainvoke(self, messages, *args: Any, **kwargs: Any):
            return _FakeMessage("stubbed-llm-response")

        def __or__(self, other):
            return self

    try:
        import langchain_google_genai as lcg
        monkeypatch.setattr(
            lcg, "ChatGoogleGenerativeAI", _FakeChatGoogleGenerativeAI, raising=False
        )
    except ImportError:
        # Library not installed in this environment; tests that need it will skip.
        pass

    return _FakeChatGoogleGenerativeAI


# ---------------------------------------------------------------------------
# Live integration tests (skipped without GEMINI_API_KEY)
# ---------------------------------------------------------------------------

requires_gemini = pytest.mark.skipif(
    not os.getenv("GEMINI_API_KEY"),
    reason="GEMINI_API_KEY not set; skipping live Gemini integration test",
)


@requires_gemini
def test_live_gemini_smoke():
    """Smoke test that the live Gemini key is usable.

    Only runs when GEMINI_API_KEY is set in the environment.
    """
    from langchain_google_genai import ChatGoogleGenerativeAI

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=os.environ["GEMINI_API_KEY"],
    )
    resp = llm.invoke("Reply with the single word: OK")
    assert resp is not None
    assert getattr(resp, "content", None)


def test_stub_embed_text_fixture(stub_embed_text):
    vec = stub_embed_text("hello")
    assert isinstance(vec, list)
    assert len(vec) == 8


def test_stub_chat_gemini_fixture(stub_chat_gemini):
    llm = stub_chat_gemini(model="gemini-2.0-flash")
    out = llm.invoke("anything")
    assert out.content == "stubbed-llm-response"
