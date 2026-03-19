#!/usr/bin/env bash
set -o pipefail

OPENVLT_HOME="${OPENVLT_HOME:-$HOME/.openvlt}"
APP_DIR="$OPENVLT_HOME/app"
LOG_DIR="$OPENVLT_HOME/logs"
BIN_DIR="$OPENVLT_HOME/bin"
INSTALL_LOG="$OPENVLT_HOME/install.log"
REPO_URL="https://github.com/ericvaish/openvlt.git"
DEFAULT_PORT=3456
STARTUP_CMD=""

# ─── Colors ───────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'
WHITE='\033[1;37m'
CLEAR_LINE='\033[2K'

SPINNER_FRAMES=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")
SPINNER_PID=""

# ─── Simple spinner (single line, no redraw) ─────────────────────────────

start_spinner() {
  local msg="$1"
  (
    local i=0
    while true; do
      printf "\r${CLEAR_LINE}  ${DIM}${SPINNER_FRAMES[$i]}${NC} %s" "$msg"
      i=$(( (i + 1) % ${#SPINNER_FRAMES[@]} ))
      sleep 0.08
    done
  ) &
  SPINNER_PID=$!
  disown "$SPINNER_PID" 2>/dev/null || true
}

stop_spinner() {
  if [ -n "$SPINNER_PID" ]; then
    kill "$SPINNER_PID" 2>/dev/null || true
    wait "$SPINNER_PID" 2>/dev/null || true
    SPINNER_PID=""
  fi
  printf "\r${CLEAR_LINE}"
}

step_done()  { stop_spinner; echo -e "  ${GREEN}✓${NC} $*"; }
step_fail()  { stop_spinner; echo -e "  ${RED}✗${NC} $*"; echo -e "  ${DIM}See $INSTALL_LOG for details${NC}"; exit 1; }

run_silent() {
  if ! "$@" >> "$INSTALL_LOG" 2>&1; then
    return 1
  fi
}

detect_os() {
  case "$(uname -s)" in
    Darwin*) echo "macos" ;;
    Linux*)  echo "linux" ;;
    *)       echo "unknown" ;;
  esac
}

detect_shell_profile() {
  if [ -n "${ZSH_VERSION:-}" ] || [ "$(basename "$SHELL")" = "zsh" ]; then
    echo "$HOME/.zshrc"
  elif [ -n "${BASH_VERSION:-}" ] || [ "$(basename "$SHELL")" = "bash" ]; then
    echo "$HOME/.bashrc"
  else
    echo "$HOME/.profile"
  fi
}

# ─── Steps ────────────────────────────────────────────────────────────────

check_node() {
  if command -v node &>/dev/null; then
    local node_version
    node_version=$(node -v | sed 's/v//' | cut -d. -f1)
    if [ "$node_version" -ge 20 ]; then
      step_done "Node.js $(node -v)"
      return 0
    fi
  fi

  start_spinner "Installing Node.js..."
  local os
  os=$(detect_os)

  if [ "$os" = "macos" ]; then
    if command -v brew &>/dev/null; then
      run_silent brew install node || step_fail "Node.js install failed"
    else
      step_fail "Install Node.js v20+ from https://nodejs.org or install Homebrew first"
    fi
  elif [ "$os" = "linux" ]; then
    if command -v apt-get &>/dev/null; then
      curl -fsSL https://deb.nodesource.com/setup_22.x 2>/dev/null | sudo -E bash - >> "$INSTALL_LOG" 2>&1
      run_silent sudo apt-get install -y nodejs || step_fail "Node.js install failed"
    elif command -v dnf &>/dev/null; then
      curl -fsSL https://rpm.nodesource.com/setup_22.x 2>/dev/null | sudo bash - >> "$INSTALL_LOG" 2>&1
      run_silent sudo dnf install -y nodejs || step_fail "Node.js install failed"
    else
      step_fail "Install Node.js v20+ from https://nodejs.org"
    fi
  else
    step_fail "Install Node.js v20+ from https://nodejs.org"
  fi

  step_done "Node.js $(node -v)"
}

check_bun() {
  if command -v bun &>/dev/null; then
    step_done "bun $(bun -v)"
    return 0
  fi

  start_spinner "Installing bun..."
  curl -fsSL https://bun.sh/install 2>/dev/null | bash >> "$INSTALL_LOG" 2>&1

  export BUN_INSTALL="$HOME/.bun"
  export PATH="$BUN_INSTALL/bin:$PATH"

  if command -v bun &>/dev/null; then
    step_done "bun $(bun -v)"
  else
    step_fail "bun install failed. Install manually: https://bun.sh"
  fi
}

check_pm2() {
  if command -v pm2 &>/dev/null; then
    step_done "pm2 $(pm2 -v 2>/dev/null || echo '?')"
    return 0
  fi

  start_spinner "Installing pm2..."
  run_silent npm install -g pm2 || step_fail "pm2 install failed. Try: npm install -g pm2"

  if command -v pm2 &>/dev/null; then
    step_done "pm2 $(pm2 -v 2>/dev/null || echo '?')"
  else
    step_fail "pm2 install failed. Try: npm install -g pm2"
  fi
}

clone_and_build() {
  mkdir -p "$OPENVLT_HOME"
  mkdir -p "$LOG_DIR"

  if [ -d "$APP_DIR" ]; then
    echo -e "  ${YELLOW}!${NC} Existing installation found"
    read -rp "  Reinstall? Your data is safe. (y/N) " confirm
    if [[ "$confirm" != [yY] ]]; then
      echo "  Cancelled."
      exit 0
    fi
    start_spinner "Updating source..."
    cd "$APP_DIR"
    run_silent git pull --ff-only origin main || step_fail "Git pull failed"
    step_done "Source updated"
  else
    start_spinner "Downloading openvlt..."
    run_silent git clone "$REPO_URL" "$APP_DIR" || step_fail "Git clone failed"
    cd "$APP_DIR"
    step_done "Source downloaded"
  fi

  start_spinner "Installing dependencies..."
  run_silent bun install || step_fail "Dependency install failed"
  step_done "Dependencies installed"

  start_spinner "Building application..."
  run_silent bun run build || step_fail "Build failed"

  if [ -d ".next/standalone" ]; then
    cp -r .next/standalone/* . 2>/dev/null || true
    mkdir -p .next/standalone/.next
    cp -r .next/static .next/standalone/.next/static 2>/dev/null || true
    cp -r public .next/standalone/public 2>/dev/null || true
  fi

  step_done "Build complete"
}

install_cli() {
  mkdir -p "$BIN_DIR"
  cp "$APP_DIR/bin/openvlt" "$BIN_DIR/openvlt"
  chmod +x "$BIN_DIR/openvlt"

  local shell_profile
  shell_profile=$(detect_shell_profile)

  if ! grep -q "openvlt/bin" "$shell_profile" 2>/dev/null; then
    echo "" >> "$shell_profile"
    echo "# OpenVlt" >> "$shell_profile"
    echo 'export PATH="$HOME/.openvlt/bin:$PATH"' >> "$shell_profile"
  fi

  export PATH="$BIN_DIR:$PATH"
  step_done "CLI installed"
}

start_server() {
  start_spinner "Starting server..."
  cd "$APP_DIR"
  OPENVLT_PORT="$DEFAULT_PORT" pm2 start ecosystem.config.cjs --env production >> "$INSTALL_LOG" 2>&1
  pm2 save >> "$INSTALL_LOG" 2>&1
  echo "$DEFAULT_PORT" > "$OPENVLT_HOME/.port"
  step_done "Server running on port $DEFAULT_PORT"
}

setup_startup() {
  local os startup_cmd
  os=$(detect_os)

  if [ "$os" = "macos" ]; then
    startup_cmd=$(pm2 startup launchd -u "$USER" --hp "$HOME" 2>/dev/null | grep "sudo" | head -1) || true
  elif [ "$os" = "linux" ]; then
    startup_cmd=$(pm2 startup 2>/dev/null | grep "sudo" | head -1) || true
  fi

  if [ -n "${startup_cmd:-}" ]; then
    STARTUP_CMD="$startup_cmd"
  fi
}

# ─── Main ─────────────────────────────────────────────────────────────────

main() {
  mkdir -p "$OPENVLT_HOME"
  : > "$INSTALL_LOG"

  # ── Logo (printed once) ─────────────────────────────────────────────

  echo ""
  cat << 'LOGO'
                                   ____
      ____  ____  ___  ____ _   __/ / /_
     / __ \/ __ \/ _ \/ __ \ | / / / __/
    / /_/ / /_/ /  __/ / / / |/ / / /_
    \____/ .___/\___/_/ /_/|___/_/\__/
        /_/
LOGO
  echo -e "  ${DIM}open source · self-hosted · encrypted · markdown${NC}"
  echo ""

  # ── Install ─────────────────────────────────────────────────────────

  check_node
  check_bun
  check_pm2
  echo ""

  clone_and_build
  echo ""

  install_cli
  start_server
  setup_startup
  echo ""

  # ── Done ────────────────────────────────────────────────────────────

  echo -e "  ${GREEN}${BOLD}Installation complete${NC}"
  echo ""
  echo -e "  ${BOLD}Your instance is live at:${NC}"
  echo -e "  ${CYAN}${BOLD}http://localhost:$DEFAULT_PORT${NC}"
  echo ""
  echo -e "  Open that URL in your browser to finish setup."
  echo ""
  echo -e "  ${DIM}─────────────────────────────────────${NC}"
  echo -e "  ${DIM}Commands${NC}"
  echo -e "    openvlt status   ${DIM}Check if running${NC}"
  echo -e "    openvlt stop     ${DIM}Stop the server${NC}"
  echo -e "    openvlt start    ${DIM}Start the server${NC}"
  echo -e "    openvlt update   ${DIM}Update to latest${NC}"
  echo -e "    openvlt logs     ${DIM}View server logs${NC}"
  echo ""

  local shell_profile
  shell_profile=$(detect_shell_profile)

  if [ -n "$STARTUP_CMD" ]; then
    echo -e "  ${YELLOW}${BOLD}ACTION REQUIRED${NC}"
    echo -e "  ${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "  openvlt is running now, but it ${BOLD}won't survive a reboot${NC}"
    echo -e "  unless you run this command (requires your password):"
    echo ""
    echo -e "    ${CYAN}${BOLD}$STARTUP_CMD >> $INSTALL_LOG 2>&1 && echo \"Done\"${NC}"
    echo ""
    echo -e "  ${DIM}This registers openvlt as a system service so it${NC}"
    echo -e "  ${DIM}starts automatically when your machine boots.${NC}"
    echo -e "  ${DIM}If something goes wrong, check: $INSTALL_LOG${NC}"
    echo ""
  fi

  echo -e "  ${DIM}Restart your terminal for the openvlt command to work,${NC}"
  echo -e "  ${DIM}or run: source $shell_profile${NC}"
  echo ""
}

main "$@"
