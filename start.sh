#!/bin/bash

# Trace Veil Forensics - Local Development Launcher
# This script sets up and runs the project locally

echo "=========================================="
echo "Trace Veil Forensics - Local Development"
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Edit .env with your Supabase credentials!"
    echo ""
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

echo "Starting development server..."
echo ""
echo "📍 Local URLs:"
echo "   • Website:      http://localhost:8888"
echo "   • Admin Login: http://localhost:8888/admin-login.html"
echo "   • Register:    http://localhost:8888/register.html"
echo ""
echo "📝 Note: API functions require Supabase to be configured"
echo "   See ADMIN_PANEL_SETUP.md for full setup instructions"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=========================================="
echo ""

# Use python http server as fallback
python3 -m http.server 8888 --bind 127.0.0.1
