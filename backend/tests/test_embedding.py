"""Tests for services.embedding.

Mocks the low-level ``_call_embed`` helper so the test is independent of which
Google SDK is wired up underneath. Verifies:
- 768-dim output
- task_type routing for embed_query / embed_document
- retry behavior (tenacity, 3 attempts)
- exception classification (InvalidAPIKeyError, RateLimitError)
- empty input -> ValueError
- wrong-dim output -> ValueError
- attribute-style and dict-style response shapes
"""

from __future__ import annotations

import asyncio
from typing import Any

import pytest

from services import embedding as emb
from services.embedding import (
    EMBEDDING_DIM,
    EMBEDDING_MODEL,
    InvalidAPIKeyError,
    RateLimitError,
    embed_document,
    embed_query,
    embed_text,
)


def _make_vec(dim: int = EMBEDDING_DIM) -> list[float]:
    return [0.001 * i for i in range(dim)]


def _patch_call(monkeypatch, fn):
    """Replace _call_embed with the given (text, key, task_type)-shaped fn."""
    monkeypatch.setattr(emb, "_call_embed", fn)


@pytest.fixture(autouse=True)
def _fast_retry(monkeypatch):
    """Make tenacity sleeps instant + asyncio.to_thread synchronous."""
    import tenacity

    monkeypatch.setattr(tenacity.nap, "sleep", lambda s: None)

    async def fake_to_thread(fn, *args, **kwargs):
        return fn(*args, **kwargs)

    monkeypatch.setattr(emb.asyncio, "to_thread", fake_to_thread)
    yield


def test_embed_text_returns_768_dims(monkeypatch):
    captured: dict[str, Any] = {}

    def fake(text, key, task_type):
        captured["text"] = text
        captured["key"] = key
        captured["task_type"] = task_type
        return {"embedding": _make_vec()}

    _patch_call(monkeypatch, fake)
    result = asyncio.run(embed_text("hello world", "fake-key"))
    assert len(result) == 768
    assert captured["text"] == "hello world"
    assert captured["task_type"] == "RETRIEVAL_DOCUMENT"


def test_embed_query_uses_retrieval_query(monkeypatch):
    captured: dict[str, Any] = {}

    def fake(text, key, task_type):
        captured["task_type"] = task_type
        return {"embedding": _make_vec()}

    _patch_call(monkeypatch, fake)
    asyncio.run(embed_query("find this", "fake-key"))
    assert captured["task_type"] == "RETRIEVAL_QUERY"


def test_embed_document_uses_retrieval_document(monkeypatch):
    captured: dict[str, Any] = {}

    def fake(text, key, task_type):
        captured["task_type"] = task_type
        return {"embedding": _make_vec()}

    _patch_call(monkeypatch, fake)
    asyncio.run(embed_document("a long document", "fake-key"))
    assert captured["task_type"] == "RETRIEVAL_DOCUMENT"


def test_empty_input_raises_value_error(monkeypatch):
    _patch_call(monkeypatch, lambda *a, **kw: {"embedding": _make_vec()})
    with pytest.raises(ValueError):
        asyncio.run(embed_text("", "fake-key"))
    with pytest.raises(ValueError):
        asyncio.run(embed_text("   ", "fake-key"))


def test_missing_key_raises_value_error():
    with pytest.raises(ValueError):
        asyncio.run(embed_text("hi", ""))


def test_wrong_dim_raises_value_error(monkeypatch):
    _patch_call(monkeypatch, lambda *a, **kw: {"embedding": _make_vec(dim=512)})
    with pytest.raises(ValueError):
        asyncio.run(embed_text("hi", "fake-key"))


def test_invalid_api_key_classification_status(monkeypatch):
    class _AuthErr(Exception):
        def __init__(self):
            super().__init__("Invalid API key provided")
            self.status_code = 401

    def fake(text, key, task_type):
        raise _AuthErr()

    _patch_call(monkeypatch, fake)
    with pytest.raises(InvalidAPIKeyError):
        asyncio.run(embed_text("hi", "fake-key"))


def test_invalid_api_key_classification_by_message(monkeypatch):
    def fake(text, key, task_type):
        raise RuntimeError("API key not valid. Please pass a valid API key.")

    _patch_call(monkeypatch, fake)
    with pytest.raises(InvalidAPIKeyError):
        asyncio.run(embed_text("hi", "fake-key"))


def test_rate_limit_classification_status(monkeypatch):
    class _RateErr(Exception):
        def __init__(self):
            super().__init__("Too Many Requests")
            self.status_code = 429

    def fake(text, key, task_type):
        raise _RateErr()

    _patch_call(monkeypatch, fake)
    with pytest.raises(RateLimitError):
        asyncio.run(embed_text("hi", "fake-key"))


def test_rate_limit_classification_by_message(monkeypatch):
    def fake(text, key, task_type):
        raise RuntimeError("Quota exceeded for the day")

    _patch_call(monkeypatch, fake)
    with pytest.raises(RateLimitError):
        asyncio.run(embed_text("hi", "fake-key"))


def test_retry_attempts_three_times_then_succeeds(monkeypatch):
    calls = {"n": 0}

    def fake(text, key, task_type):
        calls["n"] += 1
        if calls["n"] < 3:
            raise RuntimeError("transient network blip")
        return {"embedding": _make_vec()}

    _patch_call(monkeypatch, fake)
    result = asyncio.run(embed_text("hi", "fake-key"))
    assert len(result) == 768
    assert calls["n"] == 3


def test_retry_gives_up_after_three_attempts(monkeypatch):
    calls = {"n": 0}

    def fake(text, key, task_type):
        calls["n"] += 1
        raise RuntimeError("persistent transient failure")

    _patch_call(monkeypatch, fake)
    with pytest.raises(RuntimeError):
        asyncio.run(embed_text("hi", "fake-key"))
    assert calls["n"] == 3


def test_supports_attribute_style_result(monkeypatch):
    class _Result:
        def __init__(self, vec):
            self.embedding = vec

    _patch_call(monkeypatch, lambda *a, **kw: _Result(_make_vec()))
    result = asyncio.run(embed_text("hi", "fake-key"))
    assert len(result) == 768


def test_supports_new_sdk_embeddings_list_shape(monkeypatch):
    """google-genai returns EmbedContentResponse(embeddings=[ContentEmbedding(values=[...])])."""

    class _ContentEmbedding:
        def __init__(self, vec):
            self.values = vec

    class _Response:
        def __init__(self, vec):
            self.embeddings = [_ContentEmbedding(vec)]

    _patch_call(monkeypatch, lambda *a, **kw: _Response(_make_vec()))
    result = asyncio.run(embed_text("hi", "fake-key"))
    assert len(result) == 768


def test_supports_nested_values_field(monkeypatch):
    _patch_call(monkeypatch, lambda *a, **kw: {"embedding": {"values": _make_vec()}})
    result = asyncio.run(embed_text("hi", "fake-key"))
    assert len(result) == 768
