import React, { useState } from 'react';
import { X, Plus, Save } from 'lucide-react';
import { APIConnection, APIEndpoint } from '../types/api';

interface AddConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (connection: Omit<APIConnection, 'id' | 'isConnected'>) => void;
  editConnection?: APIConnection;
}

const AddConnectionModal: React.FC<AddConnectionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editConnection
}) => {
  const [formData, setFormData] = useState({
    name: editConnection?.name || '',
    clientId: editConnection?.clientId || '',
    clientSecret: editConnection?.clientSecret || '',
    authUrl: editConnection?.authUrl || 'https://api.loyverse.com/oauth/authorize',
    tokenUrl: editConnection?.tokenUrl || 'https://api.loyverse.com/oauth/token',
    scope: editConnection?.scope || 'ITEMS_READ CUSTOMERS_READ RECEIPTS_READ OPENID',
    redirectUri: editConnection?.redirectUri || 'https://sitio-web-novedades-1f3gm5to1-simplanas-projects.vercel.app/oauth/callback'
  });

  const [endpoints, setEndpoints] = useState<APIEndpoint[]>(
    editConnection?.endpoints || [
      {
        id: 'items',
        name: 'Get Items',
        method: 'GET',
        url: 'https://api.loyverse.com/v1.0/items',
        description: 'Retrieve all items'
      }
    ]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      endpoints,
      lastTested: editConnection?.lastTested,
      accessToken: editConnection?.accessToken,
      refreshToken: editConnection?.refreshToken,
      tokenExpiry: editConnection?.tokenExpiry
    });
    onClose();
  };

  const addEndpoint = () => {
    const newEndpoint: APIEndpoint = {
      id: `endpoint-${Date.now()}`,
      name: 'New Endpoint',
      method: 'GET',
      url: 'https://api.loyverse.com/v1.0/',
      description: 'New API endpoint'
    };
    setEndpoints([...endpoints, newEndpoint]);
  };

  const updateEndpoint = (index: number, updates: Partial<APIEndpoint>) => {
    setEndpoints(endpoints.map((ep, i) => i === index ? { ...ep, ...updates } : ep));
  };

  const removeEndpoint = (index: number) => {
    setEndpoints(endpoints.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {editConnection ? 'Edit Connection' : 'Add New Connection'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Connection Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="My API Connection"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client ID
              </label>
              <input
                type="text"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your-client-id"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Secret
              </label>
              <input
                type="password"
                value={formData.clientSecret}
                onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your-client-secret"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scope
              </label>
              <input
                type="text"
                value={formData.scope}
                onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ITEMS_READ CUSTOMERS_READ"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Authorization URL
              </label>
              <input
                type="url"
                value={formData.authUrl}
                onChange={(e) => setFormData({ ...formData, authUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token URL
              </label>
              <input
                type="url"
                value={formData.tokenUrl}
                onChange={(e) => setFormData({ ...formData, tokenUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Redirect URI
            </label>
            <input
              type="url"
              value={formData.redirectUri}
              onChange={(e) => setFormData({ ...formData, redirectUri: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* API Endpoints */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">API Endpoints</h3>
              <button
                type="button"
                onClick={addEndpoint}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Endpoint</span>
              </button>
            </div>

            <div className="space-y-4">
              {endpoints.map((endpoint, index) => (
                <div key={endpoint.id} className="border border-gray-200 rounded-md p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={endpoint.name}
                        onChange={(e) => updateEndpoint(index, { name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Method
                      </label>
                      <select
                        value={endpoint.method}
                        onChange={(e) => updateEndpoint(index, { method: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeEndpoint(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        URL
                      </label>
                      <input
                        type="url"
                        value={endpoint.url}
                        onChange={(e) => updateEndpoint(index, { url: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={endpoint.description}
                        onChange={(e) => updateEndpoint(index, { description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{editConnection ? 'Update' : 'Create'} Connection</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddConnectionModal;