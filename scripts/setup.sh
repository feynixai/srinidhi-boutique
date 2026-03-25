#!/usr/bin/env bash
set -e

# ── Srinidhi Boutique — Dev Environment Setup ──────────────────────────────
BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

info()    { echo -e "${BOLD}$1${RESET}"; }
success() { echo -e "${GREEN}✓ $1${RESET}"; }
warn()    { echo -e "${YELLOW}! $1${RESET}"; }
error()   { echo -e "${RED}✗ $1${RESET}"; exit 1; }

echo ""
echo -e "${BOLD}Srinidhi Boutique — Setup${RESET}"
echo "─────────────────────────────────"

# ── 1. Check prerequisites ──────────────────────────────────────────────────
info "Checking prerequisites..."

if ! command -v node &>/dev/null; then
  error "Node.js is not installed. Install Node.js 18+ from https://nodejs.org"
fi
NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  error "Node.js 18+ required. Current: $(node -v)"
fi
success "Node.js $(node -v)"

if ! command -v npm &>/dev/null; then
  error "npm is not installed"
fi
success "npm $(npm -v)"

if ! command -v psql &>/dev/null; then
  warn "psql not found in PATH — make sure PostgreSQL is running before db:push"
else
  success "PostgreSQL found"
fi

# ── 2. Copy .env.example ────────────────────────────────────────────────────
info "Configuring environment..."
if [ ! -f server/.env ]; then
  if [ -f server/.env.example ]; then
    cp server/.env.example server/.env
    success "Copied server/.env.example → server/.env"
    warn "Edit server/.env and set DATABASE_URL before continuing"
  else
    warn "server/.env.example not found — skipping"
  fi
else
  success "server/.env already exists — skipping copy"
fi

if [ ! -f web/.env.local ]; then
  echo 'NEXT_PUBLIC_API_URL=http://localhost:4000' > web/.env.local
  echo 'NEXT_PUBLIC_WHATSAPP_NUMBER=+919876543210' >> web/.env.local
  success "Created web/.env.local"
fi

if [ ! -f admin/.env.local ]; then
  echo 'NEXT_PUBLIC_API_URL=http://localhost:4000' > admin/.env.local
  success "Created admin/.env.local"
fi

# ── 3. Install dependencies ─────────────────────────────────────────────────
info "Installing dependencies..."
npm install
success "Dependencies installed"

# ── 4. Push database schema ─────────────────────────────────────────────────
info "Pushing database schema..."
if grep -q 'DATABASE_URL=postgresql' server/.env 2>/dev/null && ! grep -q 'DATABASE_URL=postgresql://user:password' server/.env 2>/dev/null; then
  npm run db:push
  success "Database schema pushed"
else
  warn "Skipping db:push — update DATABASE_URL in server/.env first, then run: npm run db:push"
fi

# ── 5. Seed database ────────────────────────────────────────────────────────
info "Seeding database..."
if grep -q 'DATABASE_URL=postgresql' server/.env 2>/dev/null && ! grep -q 'DATABASE_URL=postgresql://user:password' server/.env 2>/dev/null; then
  npm run db:seed
  success "Database seeded (35 products, 9 categories, 10 coupons)"
else
  warn "Skipping db:seed — run manually after configuring DATABASE_URL: npm run db:seed"
fi

# ── Done ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}Setup complete!${RESET}"
echo ""
echo "Start all services:"
echo "  npm run dev"
echo ""
echo "Then open:"
echo "  Store:  http://localhost:3000"
echo "  Admin:  http://localhost:3001"
echo "  API:    http://localhost:4000"
echo ""
