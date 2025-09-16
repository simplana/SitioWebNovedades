import { useState, useEffect } from 'react';
import { medjugorjeService, MedjugorjeMessage } from '../services/medjugorjeService';

export const useMedjugorjeMessages = () => {
  const [messages, setMessages] = useState<MedjugorjeMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  useEffect(() => {
    loadMessages();
    const cleanup = setupNewMessageListener();
    requestNotificationPermission();
    
    return cleanup;
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedMessages = await medjugorjeService.getMessages();
      setMessages(fetchedMessages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading messages');
      console.error('Error loading Medjugorje messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshMessages = async () => {
    try {
      setError(null);
      const refreshedMessages = await medjugorjeService.refreshMessages();
      setMessages(refreshedMessages);
      setHasNewMessage(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error refreshing messages');
      console.error('Error refreshing messages:', err);
    }
  };

  const setupNewMessageListener = () => {
    const handleNewMessage = () => {
      setHasNewMessage(true);
      console.log('🔔 New message detected!');
    };

    window.addEventListener('newVirginMessage', handleNewMessage);
    
    return () => {
      window.removeEventListener('newVirginMessage', handleNewMessage);
    };
  };

  const requestNotificationPermission = async () => {
    await medjugorjeService.requestNotificationPermission();
  };

  const getLatestMessage = (): MedjugorjeMessage | null => {
    return messages.find(m => m.isLatest) || null;
  };

  const getPreviousMessages = (): MedjugorjeMessage[] => {
    return messages.filter(m => !m.isLatest);
  };


  return {
    messages,
    loading,
    error,
    hasNewMessage,
    refreshMessages,
    getLatestMessage,
    getPreviousMessages,
    setHasNewMessage
  };
};