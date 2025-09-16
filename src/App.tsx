import React from 'react';
import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Plus, Download, Upload, Bug } from 'lucide-react';
import { useOAuth2 } from './hooks/useOAuth2';
import ApiConnectionCard from './components/ApiConnectionCard';
import AddConnectionModal from './components/AddConnectionModal';
import DebugPanel from './components/DebugPanel';
import { APIConnection } from './types/api';

// Import original components for other routes
import OriginalApp from './OriginalApp';

function App() {
  const {
    connections,
    isLoading,
    logger,
    addConnection,
    updateConnection,
    deleteConnection,
    initiateOAuth2Flow,
    testApiEndpoint,
    exportConnections,
    importConnections
  } = useOAuth2();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<APIConnection | undefined>();

  const handleAddConnection = (connection: Omit<APIConnection, 'id' | 'isConnected'>) => {
    addConnection(connection);
    setIsAddModalOpen(false);
  };

  const handleEditConnection = (connection: APIConnection) => {
    setEditingConnection(connection);
    setIsAddModalOpen(true);
  };

  const handleUpdateConnection = (connectionData: Omit<APIConnection, 'id' | 'isConnected'>) => {
    if (editingConnection) {
      updateConnection(editingConnection.id, connectionData);
      setEditingConnection(undefined);
      setIsAddModalOpen(false);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importConnections(file);
      event.target.value = ''; // Reset input
    }
  };

  // Check if we're on the OAuth2 tester route
  const isOAuth2Route = window.location.pathname === '/oauth2-tester';

  if (!isOAuth2Route) {
    return <OriginalApp />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">
                Loyverse OAuth2 API Tester
              </h1>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                {connections.length} connection{connections.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Connection</span>
              </button>

              <button
                onClick={exportConnections}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded-md transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>

              <label className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded-md transition-colors cursor-pointer">
                <Upload className="h-4 w-4" />
                <span>Import</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>

              <button
                onClick={logger.toggleVisibility}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  logger.isVisible
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400'
                }`}
              >
                <Bug className="h-4 w-4" />
                <span>Debug</span>
                {logger.logs.length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {logger.logs.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {connections.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Welcome to Loyverse OAuth2 Tester
              </h2>
              <p className="text-gray-600 mb-6">
                Get started by adding your first API connection. A default Loyverse connection 
                will be created for you.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors mx-auto"
              >
                <Plus className="h-5 w-5" />
                <span>Add Your First Connection</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {connections.map((connection) => (
              <ApiConnectionCard
                key={connection.id}
                connection={connection}
                onTest={testApiEndpoint}
                onConnect={initiateOAuth2Flow}
                onEdit={handleEditConnection}
                onDelete={deleteConnection}
                isLoading={isLoading}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <AddConnectionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingConnection(undefined);
        }}
        onSave={editingConnection ? handleUpdateConnection : handleAddConnection}
        editConnection={editingConnection}
      />

      <DebugPanel
        logs={logger.logs}
        isVisible={logger.isVisible}
        onClose={() => logger.setIsVisible(false)}
        onClear={logger.clearLogs}
      />
    </div>
  );
}

export default App;