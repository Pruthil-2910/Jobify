# Graph Report - .  (2026-05-06)

## Corpus Check
- Corpus is ~13,303 words - fits in a single context window. You may not need a graph.

## Summary
- 505 nodes · 897 edges · 44 communities detected
- Extraction: 65% EXTRACTED · 35% INFERRED · 0% AMBIGUOUS · INFERRED: 314 edges (avg confidence: 0.62)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Pydantic Models & Schemas|Pydantic Models & Schemas]]
- [[_COMMUNITY_Chatbot RAG Pipeline|Chatbot RAG Pipeline]]
- [[_COMMUNITY_LangGraph Pipeline (JD + Chat)|LangGraph Pipeline (JD + Chat)]]
- [[_COMMUNITY_External Module Imports|External Module Imports]]
- [[_COMMUNITY_Auth & JWT|Auth & JWT]]
- [[_COMMUNITY_JD Embedding & Matching|JD Embedding & Matching]]
- [[_COMMUNITY_DB CRUD Operations|DB CRUD Operations]]
- [[_COMMUNITY_Project Ingest (GitHubLinkedIn)|Project Ingest (GitHub/LinkedIn)]]
- [[_COMMUNITY_DB Connection & FastAPI Deps|DB Connection & FastAPI Deps]]
- [[_COMMUNITY_APIKey Middleware Flow|APIKey Middleware Flow]]
- [[_COMMUNITY_Adzuna Job Service|Adzuna Job Service]]
- [[_COMMUNITY_Embedding Service|Embedding Service]]
- [[_COMMUNITY_Resume Tailor LLM Node|Resume Tailor LLM Node]]
- [[_COMMUNITY_Routers — JD Match & Chat|Routers — JD Match & Chat]]
- [[_COMMUNITY_Routers — Users & Jobs|Routers — Users & Jobs]]
- [[_COMMUNITY_Misc Cluster 15|Misc Cluster 15]]
- [[_COMMUNITY_Misc Cluster 16|Misc Cluster 16]]
- [[_COMMUNITY_Misc Cluster 17|Misc Cluster 17]]
- [[_COMMUNITY_Misc Cluster 18|Misc Cluster 18]]
- [[_COMMUNITY_Misc Cluster 19|Misc Cluster 19]]
- [[_COMMUNITY_Misc Cluster 20|Misc Cluster 20]]
- [[_COMMUNITY_Misc Cluster 21|Misc Cluster 21]]
- [[_COMMUNITY_Misc Cluster 22|Misc Cluster 22]]
- [[_COMMUNITY_Misc Cluster 23|Misc Cluster 23]]
- [[_COMMUNITY_Misc Cluster 24|Misc Cluster 24]]
- [[_COMMUNITY_Misc Cluster 25|Misc Cluster 25]]
- [[_COMMUNITY_Misc Cluster 26|Misc Cluster 26]]
- [[_COMMUNITY_Misc Cluster 27|Misc Cluster 27]]
- [[_COMMUNITY_Misc Cluster 28|Misc Cluster 28]]
- [[_COMMUNITY_Misc Cluster 29|Misc Cluster 29]]
- [[_COMMUNITY_Misc Cluster 30|Misc Cluster 30]]
- [[_COMMUNITY_Misc Cluster 31|Misc Cluster 31]]
- [[_COMMUNITY_Misc Cluster 32|Misc Cluster 32]]
- [[_COMMUNITY_Misc Cluster 33|Misc Cluster 33]]
- [[_COMMUNITY_Misc Cluster 34|Misc Cluster 34]]
- [[_COMMUNITY_Misc Cluster 35|Misc Cluster 35]]
- [[_COMMUNITY_Misc Cluster 36|Misc Cluster 36]]
- [[_COMMUNITY_Misc Cluster 37|Misc Cluster 37]]
- [[_COMMUNITY_Misc Cluster 38|Misc Cluster 38]]
- [[_COMMUNITY_Misc Cluster 39|Misc Cluster 39]]
- [[_COMMUNITY_Misc Cluster 40|Misc Cluster 40]]
- [[_COMMUNITY_Misc Cluster 41|Misc Cluster 41]]
- [[_COMMUNITY_Misc Cluster 42|Misc Cluster 42]]
- [[_COMMUNITY_Misc Cluster 43|Misc Cluster 43]]

## God Nodes (most connected - your core abstractions)
1. `Pydantic v2 model exports for the Jobify backend.` - 24 edges
2. `InvalidAPIKeyError` - 23 edges
3. `RateLimitError` - 23 edges
4. `ChatState` - 22 edges
5. `JDMatchState` - 21 edges
6. `embed_text()` - 17 edges
7. `get_connection()` - 14 edges
8. `TokenResponse` - 11 edges
9. `APIKeyMiddleware (X-Gemini-API-Key)` - 11 edges
10. `db.crud` - 11 edges

## Surprising Connections (you probably didn't know these)
- `requirements.txt (deps)` --rationale_for--> `JD matcher full LangGraph`  [INFERRED]
  requirements.txt → agents/jd_matcher_graph.py
- `requirements.txt (deps)` --rationale_for--> `get_connection (SQLite + sqlite-vec)`  [INFERRED]
  requirements.txt → db/connection.py
- `LangGraph definition for the JD-matcher pipeline.  Two graphs are exported:  * :` --uses--> `JDMatchState`  [INFERRED]
  agents\jd_matcher_graph.py → agents\state.py
- `Load the user's current resume JSON from the ``users`` table.      Reads ``state` --uses--> `JDMatchState`  [INFERRED]
  agents\jd_matcher_graph.py → agents\state.py
- `Persist the tailored resume to the ``tailored_resumes`` table.      Reads ``stat` --uses--> `JDMatchState`  [INFERRED]
  agents\jd_matcher_graph.py → agents\state.py

## Hyperedges (group relationships)
- **JD-matcher LangGraph pipeline (load -> embed -> match -> gaps -> tailor -> save)** — agents_jd_load_resume, agents_nodes_jd_embedder, agents_nodes_project_matcher, agents_nodes_gap_analyzer, agents_nodes_resume_tailor, agents_jd_save_tailored, agents_state_jdmatch [EXTRACTED 1.00]
- **Chatbot LangGraph pipeline (context -> intent -> branch -> respond)** — agents_chatbot_inject_context, agents_nodes_intent_router, agents_nodes_rag_retrieve, agents_nodes_analytical_query, agents_nodes_llm_responder, agents_state_chat [EXTRACTED 1.00]
- **Per-request Gemini key resolution chain (header -> JWT -> Fernet decrypt -> request.state -> LangGraph state)** — middleware_api_key_middleware, auth_jwt_decode_token, auth_jwt_decrypt_api_key, db_crud_get_user_by_id, agents_state_chat, agents_state_jdmatch [INFERRED 0.90]
- **Routes gating on request.state.gemini_key (401 invalid_gemini_key)** — router_chat_message, router_jd_match_match, router_jd_match_tailor, router_jobs_fetch, router_projects_ingest, router_users_put_resume [INFERRED 0.90]
- **Adzuna fetch -> embed_document -> upsert_vec_embedding pipeline** — service_adzuna_fetch_jobs, service_embedding_embed_document, ext_db_crud, router_jobs_fetch [EXTRACTED 1.00]
- **Backend unit test suite (db, embedding, graphs)** — test_db, test_embedding, test_graphs [EXTRACTED 1.00]

## Communities

### Community 0 - "Pydantic Models & Schemas"
Cohesion: 0.07
Nodes (52): BaseModel, chat_message(), Send a chat message to the conversational agent., Insert or replace a vector embedding into one of the sqlite-vec tables.      `, Update a user's stored resume JSON blob., update_user_resume(), upsert_vec_embedding(), Pydantic v2 model exports for the Jobify backend. (+44 more)

### Community 1 - "Chatbot RAG Pipeline"
Cohesion: 0.06
Nodes (39): llm_respond (Gemini), build_chatbot_graph(), inject_context(), _intent_branch(), LangGraph definition for the Jobify chatbot.  Wires together resume context inje, Load the user's resume JSON from the DB and attach it to ``state``., Conditional edge selector based on classified intent., Build and compile the chatbot ``StateGraph``.      Returns:         A compiled L (+31 more)

### Community 2 - "LangGraph Pipeline (JD + Chat)"
Cohesion: 0.07
Nodes (43): chatbot LangGraph, inject_context node, _intent_branch selector, load_resume node, JD match-only subgraph, JD matcher full LangGraph, analytical_query (text-to-SQL), analyze_gaps (Gemini) (+35 more)

### Community 3 - "External Module Imports"
Cohesion: 0.07
Nodes (43): agents.chatbot_graph, agents.jd_matcher_graph, agents.nodes.resume_tailor, agents.state, auth.dependencies, auth.jwt_handler, config.settings, db.crud (+35 more)

### Community 4 - "Auth & JWT"
Cohesion: 0.1
Nodes (37): login(), Authentication router: register, login, API-key management, and validation., Register a new user and return an access token., Authenticate via email + password and return an access token., Encrypt and persist the caller's third-party API key., Validate a Gemini API key by issuing a lightweight models list call., register(), set_api_key() (+29 more)

### Community 5 - "JD Embedding & Matching"
Cohesion: 0.11
Nodes (33): Chat router - conversational chatbot endpoint., _call_embed(), _classify_exception(), _embed_with_retry(), InvalidAPIKeyError, RateLimitError, Embedding service wrapping Google Generative AI text-embedding-004.  Stable publ, Raised when the Gemini API key is invalid or unauthorized. (+25 more)

### Community 6 - "DB CRUD Operations"
Cohesion: 0.09
Nodes (29): create_user(), delete_project(), get_job_by_id(), get_tailored_resume(), list_all_jobs(), list_tailored_resumes(), list_user_projects(), CRUD operations for Jobify backend.  Provides full CRUD for users, jobs, user_ (+21 more)

### Community 7 - "Project Ingest (GitHub/LinkedIn)"
Cohesion: 0.12
Nodes (27): create_project(), Create a project for a user. Returns new project id., _cap(), extract_github_repo_text(), extract_linkedin_text(), _http_get(), ingest_url(), LinkedInBlockedError (+19 more)

### Community 8 - "DB Connection & FastAPI Deps"
Cohesion: 0.09
Nodes (23): get_connection(), get_db(), Database connection management for Jobify backend.  Provides SQLite connections, Open a new SQLite connection with sqlite-vec loaded and pragmas applied.      Re, Context-managed database connection.      Commits on success, rolls back on erro, create_tailored_resume(), Create a tailored resume for a user. Returns new id., get_db_dep() (+15 more)

### Community 9 - "APIKey Middleware Flow"
Cohesion: 0.1
Nodes (23): save_tailored node, APIKeyMiddleware, Resolves Gemini API key from header X-Gemini-API-Key, falling back to     the au, BaseHTTPMiddleware, crud.create_project, crud.create_tailored_resume, crud.create_user, crud.update_user_api_key (+15 more)

### Community 10 - "Adzuna Job Service"
Cohesion: 0.12
Nodes (22): AdzunaError, ConfigError, fetch_jobs(), _is_transient(), _load_credentials(), _normalize(), Adzuna jobs API client.  Provides ``fetch_jobs`` for querying the Adzuna search, Fetch normalized job listings from Adzuna.      Args:         query: Search keyw (+14 more)

### Community 11 - "Embedding Service"
Cohesion: 0.14
Nodes (21): embed_document(), embed_query(), embed_text(), Embed a single piece of text via Gemini text-embedding-004.      Args:         t, Embed a query string (task_type=RETRIEVAL_QUERY)., Embed a document string (task_type=RETRIEVAL_DOCUMENT)., _make_vec(), test_embed_document_uses_retrieval_document() (+13 more)

### Community 12 - "Resume Tailor LLM Node"
Cohesion: 0.25
Nodes (13): get_user_by_id(), Fetch a user by primary key. Returns dict or None., get_current_user(), Resolve the current authenticated user from a Bearer JWT.      Raises 401 with `, _build_state(), _gemini_key_or_401(), jd_history(), jd_match() (+5 more)

### Community 13 - "Routers — JD Match & Chat"
Cohesion: 0.23
Nodes (11): _build_prompt(), _extract_json_object(), _invoke_llm(), Resume tailor node for the JD-Match LangGraph workflow.  Rewrites the candidate', Validate that the tailored resume retains the original top-level keys.      Args, Invoke Gemini with tenacity-based retry on transport errors., Produce an ATS-optimized resume tailored to the target JD.      Reads the Gemini, Compose the tailoring prompt.      Args:         resume_json: The original resum (+3 more)

### Community 14 - "Routers — Users & Jobs"
Cohesion: 0.27
Nodes (9): analyze_gaps(), _build_prompt(), _extract_json_array(), _invoke_llm(), Gap analyzer node for the JD-Match LangGraph workflow.  Compares the user's resu, Invoke Gemini with tenacity-based retry on transport errors., Analyze skill gaps between the user's resume and the target JD.      Reads the G, Build the gap-analysis prompt.      Args:         resume_json: The candidate res (+1 more)

### Community 15 - "Misc Cluster 15"
Cohesion: 0.67
Nodes (3): db.connection, db.schema, tests/test_db.py

### Community 16 - "Misc Cluster 16"
Cohesion: 1.0
Nodes (2): services/adzuna.py, services/github.py

### Community 17 - "Misc Cluster 17"
Cohesion: 1.0
Nodes (2): models.job, routers/jobs.py

### Community 18 - "Misc Cluster 18"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Misc Cluster 19"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Misc Cluster 20"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Misc Cluster 21"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Misc Cluster 22"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Misc Cluster 23"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Misc Cluster 24"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Misc Cluster 25"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Misc Cluster 26"
Cohesion: 1.0
Nodes (1): hash_password (bcrypt)

### Community 27 - "Misc Cluster 27"
Cohesion: 1.0
Nodes (1): verify_password

### Community 28 - "Misc Cluster 28"
Cohesion: 1.0
Nodes (1): crud.get_user_by_email

### Community 29 - "Misc Cluster 29"
Cohesion: 1.0
Nodes (1): crud.update_user_resume

### Community 30 - "Misc Cluster 30"
Cohesion: 1.0
Nodes (1): crud.search_jobs

### Community 31 - "Misc Cluster 31"
Cohesion: 1.0
Nodes (1): crud.upsert_vec_embedding

### Community 32 - "Misc Cluster 32"
Cohesion: 1.0
Nodes (1): JobResponse pydantic model

### Community 33 - "Misc Cluster 33"
Cohesion: 1.0
Nodes (1): JobSearchQuery model

### Community 34 - "Misc Cluster 34"
Cohesion: 1.0
Nodes (1): Resume pydantic model

### Community 35 - "Misc Cluster 35"
Cohesion: 1.0
Nodes (1): JDMatchRequest

### Community 36 - "Misc Cluster 36"
Cohesion: 1.0
Nodes (1): ChatRequest

### Community 37 - "Misc Cluster 37"
Cohesion: 1.0
Nodes (1): TailoredResumeResponse

### Community 38 - "Misc Cluster 38"
Cohesion: 1.0
Nodes (1): UserRegister model

### Community 39 - "Misc Cluster 39"
Cohesion: 1.0
Nodes (1): routers/auth.py

### Community 40 - "Misc Cluster 40"
Cohesion: 1.0
Nodes (1): routers/chat.py

### Community 41 - "Misc Cluster 41"
Cohesion: 1.0
Nodes (1): routers/projects.py

### Community 42 - "Misc Cluster 42"
Cohesion: 1.0
Nodes (1): routers/users.py

### Community 43 - "Misc Cluster 43"
Cohesion: 1.0
Nodes (1): ConfigError

## Knowledge Gaps
- **157 isolated node(s):** `Application configuration via pydantic-settings.  Loads environment variables fr`, `Typed application settings sourced from environment / .env file.`, `Gap analyzer node for the JD-Match LangGraph workflow.  Compares the user's resu`, `Build the gap-analysis prompt.      Args:         resume_json: The candidate res`, `Extract and parse a JSON array of strings from raw LLM text.      Tolerates surr` (+152 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Misc Cluster 16`** (2 nodes): `services/adzuna.py`, `services/github.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Cluster 17`** (2 nodes): `models.job`, `routers/jobs.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Cluster 18`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Cluster 19`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Cluster 20`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Cluster 21`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Cluster 22`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Cluster 23`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Cluster 24`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Cluster 25`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Cluster 26`** (1 nodes): `hash_password (bcrypt)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Cluster 27`** (1 nodes): `verify_password`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Cluster 28`** (1 nodes): `crud.get_user_by_email`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Cluster 29`** (1 nodes): `crud.update_user_resume`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Cluster 30`** (1 nodes): `crud.search_jobs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Cluster 31`** (1 nodes): `crud.upsert_vec_embedding`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Cluster 32`** (1 nodes): `JobResponse pydantic model`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Cluster 33`** (1 nodes): `JobSearchQuery model`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Cluster 34`** (1 nodes): `Resume pydantic model`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Cluster 35`** (1 nodes): `JDMatchRequest`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Cluster 36`** (1 nodes): `ChatRequest`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Cluster 37`** (1 nodes): `TailoredResumeResponse`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Cluster 38`** (1 nodes): `UserRegister model`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Cluster 39`** (1 nodes): `routers/auth.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Cluster 40`** (1 nodes): `routers/chat.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Cluster 41`** (1 nodes): `routers/projects.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Cluster 42`** (1 nodes): `routers/users.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Misc Cluster 43`** (1 nodes): `ConfigError`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_user_by_id()` connect `Resume Tailor LLM Node` to `DB Connection & FastAPI Deps`, `Chatbot RAG Pipeline`, `DB CRUD Operations`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `get_connection()` connect `DB Connection & FastAPI Deps` to `Chatbot RAG Pipeline`, `Resume Tailor LLM Node`, `JD Embedding & Matching`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `Pydantic v2 model exports for the Jobify backend.` connect `Pydantic Models & Schemas` to `Auth & JWT`, `JD Embedding & Matching`, `Project Ingest (GitHub/LinkedIn)`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Are the 23 inferred relationships involving `Pydantic v2 model exports for the Jobify backend.` (e.g. with `JobBase` and `JobFetchRequest`) actually correct?**
  _`Pydantic v2 model exports for the Jobify backend.` has 23 INFERRED edges - model-reasoned connections that need verification._
- **Are the 19 inferred relationships involving `InvalidAPIKeyError` (e.g. with `JD embedder node for the JD matcher graph.  Embeds the user-supplied job descrip` and `Call the embedding service with tenacity-driven retries.`) actually correct?**
  _`InvalidAPIKeyError` has 19 INFERRED edges - model-reasoned connections that need verification._
- **Are the 19 inferred relationships involving `RateLimitError` (e.g. with `JD embedder node for the JD matcher graph.  Embeds the user-supplied job descrip` and `Call the embedding service with tenacity-driven retries.`) actually correct?**
  _`RateLimitError` has 19 INFERRED edges - model-reasoned connections that need verification._
- **Are the 20 inferred relationships involving `ChatState` (e.g. with `LangGraph definition for the Jobify chatbot.  Wires together resume context inje` and `Load the user's resume JSON from the DB and attach it to ``state``.`) actually correct?**
  _`ChatState` has 20 INFERRED edges - model-reasoned connections that need verification._