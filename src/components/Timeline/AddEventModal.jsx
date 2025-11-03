import { useState, useEffect } from 'react';
import { X, Calendar, Link as LinkIcon, Image as ImageIcon, MapPin, Tag, Save, Upload, FileText, Shield, AlertTriangle } from 'lucide-react';
import ImageUploader from '../ImageUploader';
import PDFUploader from './PDFUploader';
import EntitySelector from './EntitySelector';
import { SOURCE_RELIABILITY, INFO_CREDIBILITY, PRIORITY_LEVELS } from '../../config/intelligenceClassification';

/**
 * Modal para agregar/editar eventos
 */
export default function AddEventModal({ event, onClose, onCreate, onUpdate }) {
  // Función para obtener fecha local en formato YYYY-MM-DDTHH:MM sin conversión UTC
  const getLocalDateTimeString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    analyst_analysis: '',
    analyst_recommendations: '',
    event_date: getLocalDateTimeString(),
    type: 'evento',
    location: '',
    link_url: '',
    link_title: '',
    image_url: '',
    file_url: '',
    file_name: '',
    file_size: null,
    source_reliability: 'C',
    info_credibility: '3',
    priority_level: 'normal',
    tags: [],
    latitude: null,
    longitude: null,
  });

  const [tagInput, setTagInput] = useState('');
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [showPDFUploader, setShowPDFUploader] = useState(false);
  const [selectedEntities, setSelectedEntities] = useState([]);
  const [saving, setSaving] = useState(false);
  const [recommendations, setRecommendations] = useState(['']); // Array de recomendaciones individuales
  const [currentRecommendation, setCurrentRecommendation] = useState('');

  useEffect(() => {
    if (event) {
      // Extraer fecha/hora sin conversión de zona horaria
      let eventDateFormatted = event.event_date;
      if (eventDateFormatted) {
        // Si viene con 'Z' o '+00:00', quitarlo para tratarlo como local
        eventDateFormatted = eventDateFormatted.replace('Z', '').replace(/[+-]\d{2}:\d{2}$/, '');
        // Asegurar formato YYYY-MM-DDTHH:MM
        if (eventDateFormatted.length > 16) {
          eventDateFormatted = eventDateFormatted.slice(0, 16);
        }
      }
      
      setFormData({
        ...event,
        event_date: eventDateFormatted,
        tags: event.tags || []
      });
      
      // Cargar recomendaciones si existen
      if (event.analyst_recommendations) {
        // Si las recomendaciones vienen separadas por saltos de línea numerados
        const recs = event.analyst_recommendations
          .split(/\n/)
          .map(r => r.replace(/^\d+\.\s*/, '').trim())
          .filter(r => r.length > 0);
        
        setRecommendations(recs.length > 0 ? recs : ['']);
      }
      
      // Cargar entidades asociadas
      loadEventEntities(event.id);
    }
  }, [event]);

  const loadEventEntities = async (eventId) => {
    try {
      const { supabase } = await import('../../lib/supabase');
      
      const { data, error } = await supabase
        .from('event_entities')
        .select(`
          entity_id,
          entities:entity_id (
            id,
            name,
            class,
            type
          )
        `)
        .eq('event_id', eventId);

      if (error) throw error;

      if (data) {
        const entities = data.map(rel => rel.entities).filter(Boolean);
        setSelectedEntities(entities);
      }
    } catch (error) {
      console.error('Error cargando entidades del evento:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('El título es obligatorio');
      return;
    }

    setSaving(true);
    try {
      // Combinar recomendaciones en un solo texto numerado
      const recommendationsText = recommendations
        .filter(r => r.trim().length > 0)
        .map((r, idx) => `${idx + 1}. ${r}`)
        .join('\n');

      const finalData = {
        ...formData,
        analyst_recommendations: recommendationsText
      };

      let result;
      let eventId;
      
      if (event?.id) {
        // Editando evento existente
        result = await onUpdate(event.id, finalData);
        eventId = event.id;
      } else {
        // Creando nuevo evento
        result = await onCreate(null, finalData);
        eventId = result.data?.id;
      }
      
      if (result.success && eventId) {
        // Guardar relaciones con entidades
        await saveEventEntityRelations(eventId, selectedEntities);
        onClose();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Error al guardar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const saveEventEntityRelations = async (eventId, entities) => {
    try {
      const { supabase } = await import('../../lib/supabase');
      
      // Eliminar relaciones anteriores
      await supabase
        .from('event_entities')
        .delete()
        .eq('event_id', eventId);

      // Insertar nuevas relaciones
      if (entities.length > 0) {
        const relations = entities.map(entity => ({
          event_id: eventId,
          entity_id: entity.id,
          relationship_type: 'mentioned'
        }));

        const { error } = await supabase
          .from('event_entities')
          .insert(relations);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error guardando relaciones:', error);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleImageUploadComplete = (urls) => {
    setFormData({
      ...formData,
      image_url: urls.full
    });
    setShowImageUploader(false);
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-700 w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 bg-gradient-to-r from-blue-900/30 to-slate-800 flex justify-between items-center flex-shrink-0">
          <h2 className="text-2xl font-bold text-white">
            {event ? '✏️ Editar Evento' : '➕ Nuevo Evento'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar-transparent">
          {/* Tipo de evento */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Tipo de Evento *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'evento', icon: '🎯', label: 'Evento', desc: 'Fuente cerrada' },
                { value: 'noticia', icon: '📰', label: 'Noticia', desc: 'Links/Fotos' },
                { value: 'informe', icon: '📄', label: 'Informe', desc: 'PDF' }
              ].map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.value })}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    formData.type === type.value
                      ? 'border-blue-500 bg-blue-500/20 text-white'
                      : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-xs font-semibold">{type.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{type.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Clasificación de Inteligencia */}
          <div className="grid grid-cols-2 gap-3">
            {/* Confiabilidad de la Fuente */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                <Shield size={14} className="inline mr-1" />
                Fuente
              </label>
              <select
                value={formData.source_reliability}
                onChange={(e) => setFormData({ ...formData, source_reliability: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.values(SOURCE_RELIABILITY).map(source => (
                  <option key={source.code} value={source.code}>
                    {source.code} - {source.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                {SOURCE_RELIABILITY[formData.source_reliability]?.description}
              </p>
            </div>

            {/* Credibilidad de la Información */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                <Shield size={14} className="inline mr-1" />
                Información
              </label>
              <select
                value={formData.info_credibility}
                onChange={(e) => setFormData({ ...formData, info_credibility: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.values(INFO_CREDIBILITY).map(info => (
                  <option key={info.code} value={info.code}>
                    {info.code} - {info.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                {INFO_CREDIBILITY[formData.info_credibility]?.description}
              </p>
            </div>
          </div>

          {/* Nivel de Prioridad */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <AlertTriangle size={14} className="inline mr-1" />
              Nivel de Prioridad
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(PRIORITY_LEVELS).map(priority => (
                <button
                  key={priority.code}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority_level: priority.code })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.priority_level === priority.code
                      ? `${priority.borderColor} ${priority.bgColor} text-white`
                      : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div className="text-xl mb-1">{priority.icon}</div>
                  <div className="text-xs font-semibold">{priority.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Título *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Despliegue de tropas en región norte"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Fecha y hora */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              <Calendar size={14} className="inline mr-1" />
              Fecha y Hora *
            </label>
            <input
              type="datetime-local"
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Descripción Completa */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center justify-between">
              <span>📋 Descripción Completa</span>
              <span className="text-xs text-blue-400">Soporta Markdown • Redimensionable</span>
            </label>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-lg"></div>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción detallada de lo que sucedió, quién estuvo involucrado, contexto del evento... (Soporta **negrita**, *cursiva*, - listas)"
                rows={4}
                className="w-full pl-5 pr-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[100px] max-h-[300px]"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              💡 Hechos objetivos de lo que ocurrió
            </p>
          </div>

          {/* Análisis del Analista - REDIMENSIONABLE */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center justify-between">
              <span>📊 Análisis del Analista de Inteligencia</span>
              <span className="text-xs text-cyan-400">Soporta Markdown • Redimensionable</span>
            </label>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 rounded-l-lg"></div>
              <textarea
                value={formData.analyst_analysis}
                onChange={(e) => setFormData({ ...formData, analyst_analysis: e.target.value })}
                placeholder="Tu análisis profesional: implicaciones estratégicas, patrones detectados, relación con otros eventos, evaluación de amenazas... (Soporta **negrita**, *cursiva*, - listas)"
                rows={5}
                className="w-full pl-5 pr-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-y min-h-[120px] max-h-[400px]"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              💡 Interpretación profesional del analista • Arrastra esquina para ampliar
            </p>
          </div>

          {/* Recomendaciones Individuales con Textarea */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center justify-between">
              <span>💡 Recomendaciones</span>
              <span className="text-xs text-green-400">Soporta Markdown • Ctrl+Enter para nueva</span>
            </label>
            
            <div className="space-y-3">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="flex gap-2">
                  <div className="flex items-start justify-center w-7 pt-2 bg-green-600/20 rounded-lg text-green-400 font-bold text-sm flex-shrink-0 min-h-[60px]">
                    {idx + 1}
                  </div>
                  <textarea
                    value={rec}
                    onChange={(e) => {
                      const newRecs = [...recommendations];
                      newRecs[idx] = e.target.value;
                      setRecommendations(newRecs);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        e.preventDefault();
                        // Agregar nueva recomendación si el actual no está vacío
                        if (rec.trim()) {
                          setRecommendations([...recommendations, '']);
                          // Focus en el nuevo campo después de un tick
                          setTimeout(() => {
                            const textareas = document.querySelectorAll('textarea[placeholder*="Recomendación"]');
                            textareas[textareas.length - 1]?.focus();
                          }, 0);
                        }
                      }
                    }}
                    placeholder={`Recomendación ${idx + 1}... (Soporta **negrita**, *cursiva*, - listas, etc.)`}
                    rows={3}
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-y min-h-[60px] max-h-[200px]"
                  />
                  {recommendations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newRecs = recommendations.filter((_, i) => i !== idx);
                        setRecommendations(newRecs.length > 0 ? newRecs : ['']);
                      }}
                      className="p-2 hover:bg-red-600/20 text-red-400 hover:text-red-300 rounded transition-colors h-10"
                      title="Eliminar recomendación"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              
              {/* Botón para agregar manualmente */}
              <button
                type="button"
                onClick={() => setRecommendations([...recommendations, ''])}
                className="w-full px-3 py-2 bg-green-600/10 hover:bg-green-600/20 border border-green-600/30 text-green-400 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
              >
                <span>+</span>
                Agregar Recomendación
              </button>
            </div>
            
            <p className="text-xs text-slate-500 mt-2">
              💡 Presiona <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-[10px]">Ctrl + Enter</kbd> para agregar otra recomendación • Soporta formato Markdown
            </p>
          </div>

          {/* Ubicación */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              <MapPin size={14} className="inline mr-1" />
              Ubicación
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ej: San Salvador, El Salvador"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Imagen */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              <ImageIcon size={14} className="inline mr-1" />
              Imagen
            </label>
            
            {formData.image_url ? (
              <div className="relative">
                <img 
                  src={formData.image_url} 
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border border-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, image_url: '' })}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowImageUploader(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 border-2 border-dashed border-slate-600 hover:border-blue-500 text-slate-400 hover:text-blue-400 rounded-lg transition-all"
              >
                <Upload size={18} />
                <span className="text-sm">Subir imagen</span>
              </button>
            )}
          </div>

          {/* Archivo PDF (solo para Informes) */}
          {formData.type === 'informe' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                <FileText size={14} className="inline mr-1" />
                Documento PDF
              </label>
              
              {formData.file_url ? (
                <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-8 h-8 text-purple-400" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{formData.file_name || 'Documento.pdf'}</div>
                      {formData.file_size && (
                        <div className="text-xs text-purple-300/70">
                          {(formData.file_size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, file_url: '', file_name: '', file_size: null })}
                      className="p-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <a
                    href={formData.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-purple-400 hover:text-purple-300 underline"
                  >
                    Ver PDF
                  </a>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPDFUploader(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 border-2 border-dashed border-slate-600 hover:border-purple-500 text-slate-400 hover:text-purple-400 rounded-lg transition-all"
                >
                  <Upload size={18} />
                  <span className="text-sm">Subir PDF</span>
                </button>
              )}
            </div>
          )}

          {/* Link externo */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              <LinkIcon size={14} className="inline mr-1" />
              Link de Referencia
            </label>
            <input
              type="url"
              value={formData.link_url}
              onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {formData.link_url && (
              <input
                type="text"
                value={formData.link_title}
                onChange={(e) => setFormData({ ...formData, link_title: e.target.value })}
                placeholder="Título del link (opcional)"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              <Tag size={14} className="inline mr-1" />
              Etiquetas
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Agregar etiqueta..."
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
              >
                Agregar
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-400 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Selector de Entidades */}
          <EntitySelector
            selectedEntities={selectedEntities}
            onEntitiesChange={setSelectedEntities}
          />
        </form>

        {/* Footer con botones */}
        <div className="px-6 py-4 border-t border-slate-700 bg-slate-800/50 flex gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
          >
            <X size={18} />
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            <span>{saving ? 'Guardando...' : (event ? 'Actualizar Evento' : 'Guardar Evento')}</span>
          </button>
        </div>
      </div>

      {/* Modal de subida de imagen */}
      {showImageUploader && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[400]">
          <div className="bg-slate-900 rounded-xl p-6 max-w-4xl w-full mx-4 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <ImageIcon size={20} />
                Subir Imagen del Evento
              </h3>
              <button
                onClick={() => setShowImageUploader(false)}
                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <ImageUploader
              entityId={null}
              entityName={formData.title || 'Evento'}
              onUploadComplete={handleImageUploadComplete}
              allowTemplateUpload={true}
            />
          </div>
        </div>
      )}

      {/* Modal de subida de PDFs */}
      {showPDFUploader && (
        <PDFUploader
          currentFileUrl={formData.file_url}
          onUploadComplete={(fileData) => {
            setFormData({
              ...formData,
              file_url: fileData.file_url,
              file_name: fileData.file_name,
              file_size: fileData.file_size
            });
            setShowPDFUploader(false);
          }}
          onClose={() => setShowPDFUploader(false)}
        />
      )}
    </div>
  );
}

