import api from './axiosConfig'

export const chatApi = {
  // Ask the "Ask CivicPulse" RAG assistant a question
  ask: (question) => api.post('/api/chat/ask', { question }),

  // Get the logged-in user's chat history
  getHistory: () => api.get('/api/chat/history'),

  // Admin: correct an issue's AI-suggested category (feeds the feedback loop)
  correctCategory: (issueId, newCategory, aiConfidenceAtSuggestion) =>
    api.put(`/api/issues/${issueId}/correct-category`, {
      newCategory,
      aiConfidenceAtSuggestion,
    }),
}
