#!/bin/bash

# Script para redesplegar las funciones de email
# Asegúrate de tener Supabase CLI instalado y autenticado

echo "🚀 Redesplegando funciones de email..."

echo "📧 Desplegando send-welcome-email..."
supabase functions deploy send-welcome-email --no-verify-jwt

echo "📧 Desplegando send-order-confirmation-email..."
supabase functions deploy send-order-confirmation-email --no-verify-jwt

echo "✅ Funciones redesplegadas exitosamente!"
echo ""
echo "⚠️  IMPORTANTE: Configuración de Resend"
echo "============================================"
echo ""
echo "Para que los emails funcionen, necesitas:"
echo ""
echo "1. OPCIÓN A - Para desarrollo/pruebas:"
echo "   - El dominio 'onboarding@resend.dev' solo enviará emails"
echo "   - a la dirección que usaste para registrarte en Resend"
echo "   - Perfecto para pruebas"
echo ""
echo "2. OPCIÓN B - Para producción:"
echo "   - Ve a https://resend.com/domains"
echo "   - Agrega tu dominio: novedadescatolicas.com"
echo "   - Configura los registros DNS (SPF, DKIM)"
echo "   - Una vez verificado, actualiza las funciones para usar:"
echo "   - 'Novedades Católicas <noreply@novedadescatolicas.com>'"
echo ""
echo "3. Asegúrate de tener el secret RESEND_API_KEY configurado:"
echo "   supabase secrets set RESEND_API_KEY=tu_api_key_aqui"
echo ""
