import { useState } from 'react';
import { X, Plus, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

/**
 * ➕ Agregar Evento Manual de Inteligencia
 * Permite al usuario pegar URL de tweet/noticia y Grok lo analiza
 */
export default function AddManualEvent({ onClose, onEventAdded }) {
  const [url, setUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customSummary, setCustomSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!url && !customTitle) {
      setError('Debes proporcionar al menos una URL o un título');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Si solo tiene URL, usar Grok para analizar
      if (url && !customTitle) {
        await analyzeWithGrok();
      } else {
        // Crear evento directo
        await createDirectEvent();
      }

      onEventAdded?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Analizar URL con Grok
  const analyzeWithGrok = async () => {
    const grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_XAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'grok-2-1212',
        messages: [
          {
            role: 'system',
            content: 'You are a military intelligence analyst. Analyze the provided URL/content and extract relevant military intelligence. Respond ONLY with valid JSON.'
          },
          {
            role: 'user',
            content: `Analiza este contenido militar y extrae información relevante:\n\nURL: ${url}\n\nExtrae:\n- Título descriptivo\n- Resumen (2-3 oraciones)\n- Tipo de evento (sighting, news, exercise, announcement, deployment, movement)\n- Prioridad (low, medium, high, urgent)\n- Entidades mencionadas (buques, aviones, unidades)\n- Ubicación si la hay (lat, lng)\n- Keywords relevantes\n\nJSON format:\n{\n  "title": "...",\n  "summary": "...",\n  "event_type": "...",\n  "priority": "...",\n  "mentioned_entities": [],\n  "suggested_location": {"lat": 0, "lng": 0},\n  "location_description": "...",\n  "confidence_score": 85,\n  "keywords": [],\n  "sentiment": "neutral"\n}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!grokResponse.ok) {
      throw new Error('Error al analizar con Grok');
    }

    const grokData = await grokResponse.json();
    const grokContent = grokData.choices[0]?.message?.content || '{}';
    const cleanJson = grokContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const analysis = JSON.parse(cleanJson);

    // Guardar en BD
    let locationWKT = null;
    if (analysis.suggested_location) {
      locationWKT = `POINT(${analysis.suggested_location.lng} ${analysis.suggested_location.lat})`;
    }

    const { error: insertError } = await supabase
      .from('intelligence_events')
      .insert({
        detected_at: new Date().toISOString(),
        event_date: new Date().toISOString(),
        event_type: analysis.event_type || 'news',
        priority: analysis.priority || 'medium',
        title: analysis.title,
        summary: analysis.summary,
        full_content: url,
        source_type: url.includes('twitter.com') || url.includes('x.com') ? 'twitter' : 'news',
        source_url: url,
        source_author: 'Manual',
        source_credibility: 'unverified',
        mentioned_entities: analysis.mentioned_entities || [],
        suggested_location: locationWKT,
        location_confidence: analysis.location_confidence,
        location_description: analysis.location_description,
        grok_analysis: {
          model: 'grok-2-1212',
          analyzed_manually: true
        },
        confidence_score: analysis.confidence_score || 70,
        keywords: analysis.keywords || [],
        sentiment: analysis.sentiment || 'neutral',
        status: 'pending'
      });

    if (insertError) throw insertError;
  };

  // Crear evento directo sin Grok
  const createDirectEvent = async () => {
    const { error: insertError } = await supabase
      .from('intelligence_events')
      .insert({
        detected_at: new Date().toISOString(),
        event_date: new Date().toISOString(),
        event_type: 'news',
        priority: 'medium',
        title: customTitle,
        summary: customSummary || customTitle,
        full_content: url || null,
        source_type: url && (url.includes('twitter.com') || url.includes('x.com')) ? 'twitter' : 'news',
        source_url: url || null,
        source_author: 'Manual',
        source_credibility: 'unverified',
        mentioned_entities: [],
        grok_analysis: { manually_created: true },
        confidence_score: 50,
        keywords: [],
        sentiment: 'neutral',
        status: 'pending'
      });

    if (insertError) throw insertError;
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-slate-900 border-2 border-purple-500/50 rounded-2xl shadow-2xl z-50 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-xl">Agregar Evento Manual</h2>
              <p className="text-slate-400 text-sm">Pega URL de tweet/noticia o crea evento propio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">
              🔗 URL de la fuente (opcional)
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://twitter.com/... o https://defensenews.com/..."
                className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <p className="text-slate-500 text-xs mt-1">
              Si pegas una URL, Grok la analizará automáticamente
            </p>
          </div>

          {/* Título manual (opcional) */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">
              📝 Título del evento (opcional si tienes URL)
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Ej: Lanchas explosivas detectadas en el Caribe"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Resumen manual (opcional) */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">
              📄 Resumen (opcional)
            </label>
            <textarea
              value={customSummary}
              onChange={(e) => setCustomSummary(e.target.value)}
              placeholder="Describe el evento en 2-3 oraciones..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            ></textarea>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          {/* Botones */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-white font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || (!url && !customTitle)}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 rounded-lg text-white font-bold transition-all shadow-lg disabled:shadow-none flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Analizando...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Agregar Evento</span>
                </>
              )}
            </button>
          </div>

          {/* Ayuda */}
          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <p className="text-blue-300 text-xs">
              💡 <strong>Tip:</strong> Pega un link de Twitter o noticia militar y Grok lo analizará automáticamente,
              extrayendo entidades, ubicaciones y clasificando la importancia.
            </p>
          </div>
        </form>
      </div>
    </>
  );
}

