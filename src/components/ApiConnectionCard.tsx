import React, { useState } from 'react';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Edit, 
  Trash2, 
  Key,
  Globe,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink
} from 'lucide-react';
import { APIConnection, APIEndpoint } from '../types/api';

interface ApiConnectionCardProps {
  connection: APIConnection;
  onTest: (connectionId: string, endpointId: string) => void;
  onConnect: (connectionId: string) => void;
  onEdit: (connection: APIConnection) => void;
  onDelete: (connectionId: string) => void;
  isLoading: boolean;
}

const ApiConnectionCard: React.FC<ApiConnectionCardProps> = ({
  connection,
  onTest,
  onConnect,
  onEdit,
  onDelete,
  isLoading
}) => {
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [showTokenInfo, setShowTokenInfo] = useState(false);

  const getStatusIcon = (isConnected: boolean, hasToken: boolean) => {
    if (isConnected && hasToken) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (hasToken) {
      return <Clock className="h-5 w-5 text-yellow-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusText = (isConnected: boolean, hasToken: boolean) => {
    if (isConnected && hasToken) return 'Connected';
    if (hasToken) return 'Token Available';
    return 'Not Connected';
  };

  const getResultStatusColor = (success?: boolean) => {
    if (success === undefined) return 'text-gray-500';
    return success ? 'text-green-600' : 'text-red-600';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const isTokenExpired = connection.tokenExpiry ? Date.now() > connection.tokenExpiry : false;
  const hasValidToken = connection.accessToken && !isTokenExpired;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(connection.isConnected, !!hasValidToken)}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{connection.name}</h3>
              <p className="text-sm text-gray-500">
                {getStatusText(connection.isConnected, !!hasValidToken)}
                {connection.lastTested && (
                  <span className="ml-2">
                    • Last tested: {new Date(connection.lastTested).toLocaleString()}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowTokenInfo(!showTokenInfo)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="Token Info"
            >
              <Key className="h-4 w-4" />
            </button>
            <button
              onClick={() => onEdit(connection)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="Edit Connection"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(connection.id)}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
              title="Delete Connection"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Token Information */}
        {showTokenInfo && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Token Information</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Client ID:</span>
                <div className="flex items-center space-x-2">
                  <code className="bg-gray-200 px-2 py-1 rounded">
                    {connection.clientId.substring(0, 8)}...
                  </code>
                  <button
                    onClick={() => copyToClipboard(connection.clientId)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>
              {connection.accessToken && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Access Token:</span>
                  <div className="flex items-center space-x-2">
                    <code className="bg-gray-200 px-2 py-1 rounded">
                      {connection.accessToken.substring(0, 12)}...
                    </code>
                    <button
                      onClick={() => copyToClipboard(connection.accessToken!)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
              {connection.tokenExpiry && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Token Expires:</span>
                  <span className={isTokenExpired ? 'text-red-600' : 'text-green-600'}>
                    {new Date(connection.tokenExpiry).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Connection Actions */}
        <div className="mt-4 flex space-x-3">
          {!hasValidToken ? (
            <button
              onClick={() => onConnect(connection.id)}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 rounded-md transition-colors"
            >
              <Key className="h-4 w-4" />
              <span>{isLoading ? 'Connecting...' : 'Connect OAuth2'}</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Ready to test endpoints</span>
            </div>
          )}

          <a
            href={connection.authUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded-md transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            <span>View Auth URL</span>
          </a>
        </div>
      </div>

      {/* API Endpoints */}
      <div className="p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">API Endpoints</h4>
        <div className="space-y-3">
          {connection.endpoints.map((endpoint) => (
            <div key={endpoint.id} className="border border-gray-200 rounded-md">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                      endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                      endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {endpoint.method}
                    </span>
                    <div>
                      <h5 className="font-medium text-gray-900">{endpoint.name}</h5>
                      <p className="text-sm text-gray-500">{endpoint.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {endpoint.lastResult && (
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm ${getResultStatusColor(endpoint.lastResult.success)}`}>
                          {endpoint.lastResult.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {endpoint.lastResult.responseTime}ms
                        </span>
                      </div>
                    )}

                    <button
                      onClick={() => onTest(connection.id, endpoint.id)}
                      disabled={!hasValidToken || isLoading}
                      className="flex items-center space-x-2 px-3 py-1 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 rounded-md transition-colors text-sm"
                    >
                      <Play className="h-3 w-3" />
                      <span>Test</span>
                    </button>

                    <button
                      onClick={() => setExpandedEndpoint(
                        expandedEndpoint === endpoint.id ? null : endpoint.id
                      )}
                      className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {expandedEndpoint === endpoint.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Endpoint Details */}
                {expandedEndpoint === endpoint.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h6 className="text-sm font-medium text-gray-700 mb-2">Request Details</h6>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-gray-600">URL:</span>
                            <div className="flex items-center space-x-2 mt-1">
                              <code className="bg-gray-100 px-2 py-1 rounded text-xs flex-1">
                                {endpoint.url}
                              </code>
                              <button
                                onClick={() => copyToClipboard(endpoint.url)}
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          {endpoint.headers && (
                            <div>
                              <span className="text-gray-600">Headers:</span>
                              <pre className="bg-gray-100 px-2 py-1 rounded text-xs mt-1 overflow-x-auto">
                                {JSON.stringify(endpoint.headers, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h6 className="text-sm font-medium text-gray-700 mb-2">Last Result</h6>
                        {endpoint.lastResult ? (
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Status:</span>
                              <span className={getResultStatusColor(endpoint.lastResult.success)}>
                                {endpoint.lastResult.status} {endpoint.lastResult.statusText}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Response Time:</span>
                              <span>{endpoint.lastResult.responseTime}ms</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Timestamp:</span>
                              <span>{new Date(endpoint.lastResult.timestamp).toLocaleTimeString()}</span>
                            </div>
                            {endpoint.lastResult.data && (
                              <div>
                                <span className="text-gray-600">Response Data:</span>
                                <pre className="bg-gray-100 px-2 py-1 rounded text-xs mt-1 max-h-32 overflow-y-auto">
                                  {JSON.stringify(endpoint.lastResult.data, null, 2)}
                                </pre>
                              </div>
                            )}
                            {endpoint.lastResult.error && (
                              <div>
                                <span className="text-gray-600">Error:</span>
                                <div className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs mt-1">
                                  {endpoint.lastResult.error}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">No test results yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ApiConnectionCard;