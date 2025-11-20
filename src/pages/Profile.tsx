import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, Shield, Package, MapPin, Phone, Edit2, Save, X, Loader, Map, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import AddressMapPicker from '../components/AddressMapPicker';
import { getProvinceNames, getCorregimientosByProvince } from '../utils/panamaLocations';

interface UserProfile {
  full_name: string;
  phone: string;
  provincia: string;
  corregimiento: string;
  direccion_exacta: string;
  direccion_referencia: string;
  latitude?: number;
  longitude?: number;
  city: string;
  country: string;
}

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    full_name: '',
    phone: '',
    provincia: '',
    corregimiento: '',
    direccion_exacta: '',
    direccion_referencia: '',
    latitude: undefined,
    longitude: undefined,
    city: '',
    country: 'Panamá'
  });
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);
  const [availableCorregimientos, setAvailableCorregimientos] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadOrderCount();
    }
  }, [user]);

  useEffect(() => {
    if (editedProfile.provincia) {
      const corregimientos = getCorregimientosByProvince(editedProfile.provincia);
      setAvailableCorregimientos(corregimientos);
      if (!corregimientos.includes(editedProfile.corregimiento)) {
        setEditedProfile({ ...editedProfile, corregimiento: '' });
      }
    }
  }, [editedProfile.provincia]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        const profileData = {
          full_name: data.full_name || '',
          phone: data.phone || '',
          provincia: data.provincia || '',
          corregimiento: data.corregimiento || '',
          direccion_exacta: data.direccion_exacta || '',
          direccion_referencia: data.direccion_referencia || '',
          latitude: data.latitude,
          longitude: data.longitude,
          city: data.city || '',
          country: data.country || 'Panamá'
        };
        setProfile(profileData);
        setEditedProfile(profileData);
        if (profileData.provincia) {
          setAvailableCorregimientos(getCorregimientosByProvince(profileData.provincia));
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrderCount = async () => {
    try {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      setOrderCount(count || 0);
    } catch (error) {
      console.error('Error loading order count:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (!editedProfile.provincia || !editedProfile.corregimiento || !editedProfile.direccion_exacta) {
      alert('Por favor, completa todos los campos de dirección de envío (Provincia, Corregimiento y Dirección Exacta)');
      return;
    }

    try {
      setSaving(true);

      const { data: existing } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_profiles')
          .update(editedProfile)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_profiles')
          .insert([{ ...editedProfile, user_id: user.id }]);

        if (error) throw error;
      }

      setProfile(editedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error al guardar el perfil. Por favor, intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setEditedProfile({
      ...editedProfile,
      latitude: lat,
      longitude: lng,
      direccion_referencia: address || editedProfile.direccion_referencia
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-divine-gold" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-PA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isShippingInfoComplete = profile.provincia && profile.corregimiento && profile.direccion_exacta;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-divine-gold to-amber-600 px-6 py-8 sm:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white rounded-full p-4">
                  <User className="h-12 w-12 text-divine-gold" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {profile.full_name || 'Mi Perfil'}
                  </h1>
                  <p className="text-white text-opacity-90">{user.email}</p>
                </div>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-white text-divine-gold px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Edit2 className="h-4 w-4" />
                  <span>Editar</span>
                </button>
              )}
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8">
            {!isShippingInfoComplete && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">
                    Información de envío incompleta
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Para realizar pedidos con envío a domicilio, completa tu provincia, corregimiento y dirección exacta.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 rounded-lg p-4 flex items-center space-x-3">
                <Package className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Órdenes</p>
                  <p className="text-2xl font-bold text-gray-900">{orderCount}</p>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 flex items-center space-x-3">
                <Shield className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <p className="text-sm font-semibold text-green-600">
                    {user.email_confirmed_at ? 'Verificado' : 'Pendiente'}
                  </p>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 flex items-center space-x-3">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Miembro desde</p>
                  <p className="text-xs font-semibold text-purple-600">
                    {formatDate(user.created_at)}
                  </p>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">Información Personal</h2>

            <div className="space-y-4">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <User className="h-4 w-4 mr-2" />
                  Nombre Completo
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.full_name}
                    onChange={(e) => setEditedProfile({ ...editedProfile, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-divine-gold focus:border-transparent"
                    placeholder="Ingresa tu nombre completo"
                  />
                ) : (
                  <p className="text-gray-900 px-4 py-2 bg-gray-50 rounded-lg">
                    {profile.full_name || 'No especificado'}
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Mail className="h-4 w-4 mr-2" />
                  Correo Electrónico
                </label>
                <p className="text-gray-900 px-4 py-2 bg-gray-100 rounded-lg">
                  {user.email}
                </p>
                <p className="text-xs text-gray-500 mt-1">El correo no puede ser modificado</p>
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Phone className="h-4 w-4 mr-2" />
                  Teléfono
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editedProfile.phone}
                    onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-divine-gold focus:border-transparent"
                    placeholder="+507 6000-0000"
                  />
                ) : (
                  <p className="text-gray-900 px-4 py-2 bg-gray-50 rounded-lg">
                    {profile.phone || 'No especificado'}
                  </p>
                )}
              </div>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4 flex items-center">
              <MapPin className="h-6 w-6 mr-2 text-divine-gold" />
              Información de Envío
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Provincia <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <select
                      value={editedProfile.provincia}
                      onChange={(e) => setEditedProfile({ ...editedProfile, provincia: e.target.value, corregimiento: '' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-divine-gold focus:border-transparent"
                    >
                      <option value="">Selecciona una provincia</option>
                      {getProvinceNames().map((prov) => (
                        <option key={prov} value={prov}>{prov}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900 px-4 py-2 bg-gray-50 rounded-lg">
                      {profile.provincia || 'No especificado'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Corregimiento <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <select
                      value={editedProfile.corregimiento}
                      onChange={(e) => setEditedProfile({ ...editedProfile, corregimiento: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-divine-gold focus:border-transparent"
                      disabled={!editedProfile.provincia}
                    >
                      <option value="">Selecciona un corregimiento</option>
                      {availableCorregimientos.map((corr) => (
                        <option key={corr} value={corr}>{corr}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900 px-4 py-2 bg-gray-50 rounded-lg">
                      {profile.corregimiento || 'No especificado'}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 mr-2" />
                  Dirección Exacta <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <textarea
                    value={editedProfile.direccion_exacta}
                    onChange={(e) => setEditedProfile({ ...editedProfile, direccion_exacta: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-divine-gold focus:border-transparent"
                    rows={2}
                    placeholder="Calle, número, edificio, apartamento, etc."
                  />
                ) : (
                  <p className="text-gray-900 px-4 py-2 bg-gray-50 rounded-lg whitespace-pre-wrap">
                    {profile.direccion_exacta || 'No especificado'}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Ej: Calle 50, Edificio Plaza Central, Piso 5, Apto 502
                </p>
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Map className="h-4 w-4 mr-2" />
                  Referencias y Puntos de Referencia
                </label>
                {isEditing ? (
                  <textarea
                    value={editedProfile.direccion_referencia}
                    onChange={(e) => setEditedProfile({ ...editedProfile, direccion_referencia: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-divine-gold focus:border-transparent"
                    rows={2}
                    placeholder="Ej: Cerca del supermercado Rey, edificio blanco frente al parque"
                  />
                ) : (
                  <p className="text-gray-900 px-4 py-2 bg-gray-50 rounded-lg whitespace-pre-wrap">
                    {profile.direccion_referencia || 'No especificado'}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Ayúdanos con puntos de referencia para encontrar tu dirección más fácilmente
                </p>
              </div>

              {isEditing && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <button
                    onClick={() => setShowMapPicker(true)}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <Map className="h-5 w-5" />
                    <span>Seleccionar Ubicación en el Mapa</span>
                  </button>
                  {editedProfile.latitude && editedProfile.longitude && (
                    <p className="text-sm text-blue-700 mt-2 text-center">
                      📍 Coordenadas: {editedProfile.latitude.toFixed(6)}, {editedProfile.longitude.toFixed(6)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {isEditing && (
              <div className="mt-6 flex items-center justify-end space-x-3">
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Cancelar</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-divine-gold text-white px-6 py-2 rounded-lg hover:bg-amber-600 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => navigate('/orders')}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Package className="h-5 w-5" />
                <span>Ver Mis Órdenes</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showMapPicker && (
        <AddressMapPicker
          latitude={editedProfile.latitude}
          longitude={editedProfile.longitude}
          onLocationSelect={handleLocationSelect}
          onClose={() => setShowMapPicker(false)}
        />
      )}
    </div>
  );
};

export default Profile;
