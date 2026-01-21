/*
  # Normalizar datos existentes de provincias y corregimientos

  Este script normaliza los datos de provincia y corregimiento en la tabla profiles
  para que coincidan con el formato requerido por Servientrega:
  - Mayúsculas
  - Sin tildes
  - Sin caracteres especiales

  INSTRUCCIONES:
  1. Ve a tu Supabase Dashboard SQL Editor
  2. Ejecuta este script
  3. Verifica los resultados
*/

-- Función para normalizar texto (quitar tildes y convertir a mayúsculas)
CREATE OR REPLACE FUNCTION normalize_text(text_input TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN UPPER(
    TRANSLATE(
      text_input,
      'áéíóúÁÉÍÓÚñÑäëïöüÄËÏÖÜâêîôûÂÊÎÔÛàèìòùÀÈÌÒÙ',
      'aeiouAEIOUnNaeiouAEIOUaeiouAEIOUaeiouAEIOU'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Actualizar todas las provincias y corregimientos existentes
UPDATE profiles
SET
  provincia = normalize_text(provincia),
  corregimiento = normalize_text(corregimiento)
WHERE provincia IS NOT NULL OR corregimiento IS NOT NULL;

-- Mapeos especiales para nombres que necesitan formato específico
UPDATE profiles SET provincia = 'PANAMA' WHERE provincia = 'PANAMA OESTE';
UPDATE profiles SET provincia = 'COMARCA KUNA YALA' WHERE provincia = 'COMARCA GUNA YALA';
UPDATE profiles SET provincia = 'COMARCA EMBERA' WHERE provincia = 'COMARCA EMBERA-WOUNAAN';
UPDATE profiles SET provincia = 'COMARCA NGOBE BUGLE' WHERE provincia = 'COMARCA NGABE-BUGLE';

-- Verificar resultados
SELECT
  COUNT(*) as total_profiles,
  COUNT(DISTINCT provincia) as unique_provincias,
  COUNT(DISTINCT corregimiento) as unique_corregimientos
FROM profiles
WHERE provincia IS NOT NULL;

-- Mostrar las provincias únicas después de la normalización
SELECT DISTINCT provincia
FROM profiles
WHERE provincia IS NOT NULL
ORDER BY provincia;

-- Mostrar sample de datos normalizados
SELECT id, provincia, corregimiento, direccion_exacta
FROM profiles
WHERE provincia IS NOT NULL
LIMIT 10;
