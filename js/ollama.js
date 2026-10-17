/* ============================================================
   ListCraft AI — Ollama API Client
   Handles connection, model discovery, and streaming generation
   ============================================================ */

const OllamaClient = (() => {
  const BASE_URL = 'http://localhost:11434';

  /**
   * Check if Ollama is running and reachable
   * @returns {Promise<{connected: boolean, version?: string}>}
   */
  async function checkConnection() {
    try {
      const res = await fetch(BASE_URL, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const text = await res.text();
        return { connected: true, version: text.trim() };
      }
      return { connected: false };
    } catch {
      return { connected: false };
    }
  }

  /**
   * List all locally available models
   * @returns {Promise<Array<{name: string, size: number, modified: string}>>}
   */
  async function listModels() {
    try {
      const res = await fetch(`${BASE_URL}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.models || []).map((m) => ({
        name: m.name,
        size: m.size,
        modified: m.modified_at,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Generate a listing using Ollama's chat endpoint with streaming.
   *
   * @param {string} model - Model name (e.g. "llama3.1")
   * @param {Array<{role: string, content: string}>} messages - Chat messages
   * @param {(chunk: string) => void} onChunk - Callback for each text chunk
   * @param {AbortSignal} [signal] - Optional abort signal
   * @returns {Promise<string>} Full response text
   */
  async function generateListing(model, messages, onChunk, signal) {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 2048,
        },
      }),
      signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'Unknown error');
      throw new Error(`Ollama API error (${res.status}): ${errText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      // Ollama streams one JSON object per line
      const lines = chunk.split('\n').filter((l) => l.trim());

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.message && parsed.message.content) {
            const text = parsed.message.content;
            fullText += text;
            onChunk(text);
          }
          // Check if generation is done
          if (parsed.done) {
            return fullText;
          }
        } catch {
          // Skip malformed lines
        }
      }
    }

    return fullText;
  }

  /**
   * Format model size for display
   * @param {number} bytes
   * @returns {string}
   */
  function formatSize(bytes) {
    if (!bytes) return '';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
  }

  return {
    checkConnection,
    listModels,
    generateListing,
    formatSize,
  };
})();
