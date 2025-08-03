// Configuration pour l'API Gemini
export const GEMINI_CONFIG = {
  API_KEY: import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyClt-lSh4WgTfA-xJWBcKvi-noI0DgWtvw',
  API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
}

// Fonction pour appeler l'API Gemini
export async function callGeminiAPI(prompt: string): Promise<any> {
  try {
    const response = await fetch(`${GEMINI_CONFIG.API_URL}?key=${GEMINI_CONFIG.API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`Erreur API Gemini: ${response.status}`)
    }

    const data = await response.json()
    return data

  } catch (error) {
    console.error('Erreur lors de l\'appel à Gemini:', error)
    throw error
  }
} 