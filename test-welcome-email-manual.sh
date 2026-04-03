#!/bin/bash

# Script para probar el envío manual de email de bienvenida
# Asegúrate de reemplazar USER_ID, EMAIL y NAME con los valores reales

SUPABASE_URL="https://iabrhkvwhmliemgioxce.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhYnJoa3Z3aG1saWVtZ2lveGNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxOTAzMTksImV4cCI6MjA3Mjc2NjMxOX0.xotrsbhO18bNSuPj7e-fpEUPZZxONbuPAHO68Z938cI"

# Solicitar datos del usuario
read -p "User ID (UUID del usuario que creaste): " USER_ID
read -p "Email del usuario: " USER_EMAIL
read -p "Nombre del usuario: " USER_NAME

echo ""
echo "Enviando email de bienvenida a $USER_EMAIL..."
echo ""

curl -X POST \
  "${SUPABASE_URL}/functions/v1/send-welcome-email" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"${USER_ID}\",
    \"email\": \"${USER_EMAIL}\",
    \"name\": \"${USER_NAME}\"
  }" \
  | jq '.'

echo ""
echo "Verifica tu bandeja de entrada y spam."
