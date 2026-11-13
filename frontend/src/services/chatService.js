/**
 * chatService.js — Customer-Artisan Chat Integration for ShilpSetu
 */

import { getCurrentUser } from './auth.js';

/**
 * Retrieve or create a conversation with the specified artisan
 * @param {string} artisanId
 */
export async function getOrCreateConversation(artisanId) {
  const user = await getCurrentUser();
  if (!user) {
    return {
      available: false,
      error: 'Please log in to chat with artisans',
    };
  }

  // Currently, real-time messaging is being provisioned
  return {
    available: false,
    message: 'Direct artisan messaging is coming soon to ShilpSetu.',
    artisanId,
  };
}

