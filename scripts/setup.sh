#!/bin/bash

# RDAM Project Setup Script

echo "🚀 Setting up RDAM Project..."

# Copy env file
if [ ! -f .env ]; then
  echo "📄 Creating .env from .env.example..."
  cp .env.example .env
else
  echo "✅ .env already exists."
fi

# Setup API
echo "🛠️ Setting up API..."
cd Backend
if [ ! -f .env ]; then
  cp .env.example .env
fi
# npm install
cd ..

# Setup Portal
echo "🛠️ Setting up Portal..."
cd Frontend/ciudadano
if [ ! -f .env ]; then
  cp .env.example .env.local
fi
# npm install
cd ../..

# Setup Backoffice
echo "🛠️ Setting up Backoffice..."
cd Frontend/operario
if [ ! -f .env ]; then
  cp .env.example .env.local
fi
# npm install
cd ../..

echo "✅ Setup complete! Run 'docker-compose up -d' to start infrastructure."
