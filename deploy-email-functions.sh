#!/bin/bash

echo "Desplegando funciones de email..."

echo "1. Desplegando send-welcome-email..."
npx supabase functions deploy send-welcome-email --no-verify-jwt

echo "2. Desplegando send-order-confirmation-email..."
npx supabase functions deploy send-order-confirmation-email --no-verify-jwt

echo "Funciones desplegadas exitosamente!"
