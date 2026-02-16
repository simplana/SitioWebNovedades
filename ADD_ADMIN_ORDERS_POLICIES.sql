/*
  # Agregar políticas de administrador para órdenes

  1. Descripción
    - Permite a los usuarios en la tabla `admin_users` ver y modificar todas las órdenes
    - Los administradores pueden cambiar el estado de las órdenes
    - Los administradores pueden ver todos los items de todas las órdenes

  2. Políticas nuevas
    - Admins pueden ver todas las órdenes (SELECT)
    - Admins pueden actualizar todas las órdenes (UPDATE)
    - Admins pueden ver todos los order_items (SELECT)

  3. Notas importantes
    - Las políticas existentes de usuarios regulares se mantienen intactas
    - Solo usuarios listados en admin_users tienen estos permisos adicionales
*/

-- Política para que admins puedan ver todas las órdenes
CREATE POLICY "Admins can view all orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt() ->> 'email'
    )
  );

-- Política para que admins puedan actualizar todas las órdenes
CREATE POLICY "Admins can update all orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt() ->> 'email'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt() ->> 'email'
    )
  );

-- Política para que admins puedan ver todos los order_items
CREATE POLICY "Admins can view all order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt() ->> 'email'
    )
  );
