python.exe -m pip install --upgrade pip#!/usr/bin/env bash
# Jobify backend bootstrap script (Ubuntu 24.04).
# Installs system dependencies, creates a Python virtual environment,
# installs Python requirements, and seeds a .env file from the example.

set -euo pipefail

PYTHON_BIN="${PYTHON_BIN:-python3}"
VENV_DIR="${VENV_DIR:-.venv}"

echo "[jobify] Updating apt package index..."
sudo apt-get update -y

echo "[jobify] Installing system packages..."
sudo apt-get install -y \
    python3 \
    python3-venv \
    python3-pip \
    python3-dev \
    build-essential \
    sqlite3 \
    libsqlite3-dev \
    libffi-dev \
    libssl-dev \
    curl \
    git

if [ ! -d "${VENV_DIR}" ]; then
    echo "[jobify] Creating virtual environment at ${VENV_DIR}..."
    "${PYTHON_BIN}" -m venv "${VENV_DIR}"
fi

# shellcheck disable=SC1090
source "${VENV_DIR}/bin/activate"

echo "[jobify] Upgrading pip / wheel / setuptools..."
pip install --upgrade pip wheel setuptools

echo "[jobify] Installing Python dependencies..."
pip install -r requirements.txt

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    echo "[jobify] Creating .env from .env.example (edit before running)..."
    cp .env.example .env
fi

echo "[jobify] Verifying installation..."
python -c "import fastapi, uvicorn, pydantic, sqlite_vec, langgraph; print('jobify deps OK')"

echo ""
echo "[jobify] Setup complete."
echo "[jobify] Activate the venv with: source ${VENV_DIR}/bin/activate"
echo "[jobify] Then run: python main.py"
