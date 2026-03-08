#!/bin/bash

# Script para probar el envío de emails
# Reemplaza con tu información

SUPABASE_URL="https://iabrhkvwhmliemgioxce.supabase.co"
SUPABASE_ANON_KEY="tu_anon_key_aqui"
TEST_EMAIL="tu_email_de_resend_aqui@ejemplo.com"  # Debe ser el email con el que te registraste en Resend

echo "🧪 Probando envío de email de bienvenida..."
echo ""

curl -X POST \
  "${SUPABASE_URL}/functions/v1/send-welcome-email" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-id",
    "email": "'"${TEST_EMAIL}"'",
    "name": "Usuario de Prueba"
  }' | jq .

echo ""
echo "✅ Revisa tu bandeja de entrada (o spam) en: ${TEST_EMAIL}"
echo ""
echo "Si ves un error sobre dominio no verificado:"
echo "  1. Asegúrate de redesplegar las funciones"
echo "  2. Usa el email con el que te registraste en Resend"
echo ""
