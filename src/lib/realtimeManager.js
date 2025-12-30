/**
 * 🔄 Realtime Manager - Gestión centralizada de suscripciones Supabase
 * 
 * PROBLEMA: Múltiples hooks creaban canales duplicados, saturando conexiones.
 * SOLUCIÓN: Un único canal compartido por tabla con listeners registrados.
 * 
 * Beneficios:
 * - 1 canal por tabla en lugar de N canales
 * - Reconexión automática si se pierde conexión
 * - Throttling de eventos para evitar saturación
 * - Cleanup automático de listeners inactivos
 */

import { supabase } from './supabase';

class RealtimeManager {
  constructor() {
    this.channels = new Map();     // tabla -> channel
    this.listeners = new Map();    // tabla -> Set<callback>
    this.lastEvent = new Map();    // tabla -> timestamp (throttle)
    this.throttleMs = 500;         // Mínimo 500ms entre notificaciones
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;    // 2 segundos entre intentos
  }

  /**
   * Suscribirse a cambios de una tabla
   * @param {string} table - Nombre de la tabla
   * @param {function} callback - Función a llamar cuando hay cambios
   * @returns {function} - Función para desuscribirse
   */
  subscribe(table, callback) {
    // Registrar listener
    if (!this.listeners.has(table)) {
      this.listeners.set(table, new Set());
    }
    this.listeners.get(table).add(callback);

    // Crear canal si no existe
    if (!this.channels.has(table)) {
      this._createChannel(table);
    }

    // Retornar función de cleanup
    return () => {
      this.unsubscribe(table, callback);
    };
  }

  /**
   * Desuscribirse de una tabla
   */
  unsubscribe(table, callback) {
    const tableListeners = this.listeners.get(table);
    if (tableListeners) {
      tableListeners.delete(callback);
      
      // Si no quedan listeners, cerrar el canal
      if (tableListeners.size === 0) {
        this._closeChannel(table);
        this.listeners.delete(table);
      }
    }
  }

  /**
   * Crear canal para una tabla
   */
  _createChannel(table) {
    console.log(`🔄 RealtimeManager: Creando canal para "${table}"`);

    const channel = supabase
      .channel(`realtime_${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
        },
        (payload) => {
          this._handlePayload(table, payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ RealtimeManager: Canal "${table}" conectado`);
          this.reconnectAttempts = 0;
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.warn(`⚠️ RealtimeManager: Canal "${table}" cerrado/error, intentando reconectar...`);
          this._attemptReconnect(table);
        }
      });

    this.channels.set(table, channel);
  }

  /**
   * Cerrar canal de una tabla
   */
  _closeChannel(table) {
    const channel = this.channels.get(table);
    if (channel) {
      console.log(`🔌 RealtimeManager: Cerrando canal "${table}"`);
      channel.unsubscribe();
      this.channels.delete(table);
    }
  }

  /**
   * Manejar payload con throttling
   */
  _handlePayload(table, payload) {
    const now = Date.now();
    const lastTime = this.lastEvent.get(table) || 0;

    // Throttle: ignorar eventos muy frecuentes
    if (now - lastTime < this.throttleMs) {
      return;
    }
    this.lastEvent.set(table, now);

    // Notificar a todos los listeners de esta tabla
    const tableListeners = this.listeners.get(table);
    if (tableListeners) {
      tableListeners.forEach((callback) => {
        try {
          callback(payload);
        } catch (err) {
          console.error(`❌ RealtimeManager: Error en listener de "${table}":`, err);
        }
      });
    }
  }

  /**
   * Intentar reconexión con backoff
   */
  _attemptReconnect(table) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`❌ RealtimeManager: Máximo de intentos de reconexión alcanzado para "${table}"`);
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    console.log(`🔄 RealtimeManager: Reconectando "${table}" en ${delay}ms (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      // Cerrar canal viejo
      this._closeChannel(table);
      
      // Solo reconectar si aún hay listeners
      if (this.listeners.get(table)?.size > 0) {
        this._createChannel(table);
      }
    }, delay);
  }

  /**
   * Limpiar todo (para logout o unmount global)
   */
  cleanup() {
    console.log('🧹 RealtimeManager: Limpiando todos los canales');
    this.channels.forEach((channel, table) => {
      channel.unsubscribe();
    });
    this.channels.clear();
    this.listeners.clear();
    this.lastEvent.clear();
  }

  /**
   * Debug: mostrar estado actual
   */
  getStatus() {
    return {
      channels: Array.from(this.channels.keys()),
      listeners: Object.fromEntries(
        Array.from(this.listeners.entries()).map(([table, set]) => [table, set.size])
      ),
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// Singleton
export const realtimeManager = new RealtimeManager();

// Exponer para debug en consola
if (typeof window !== 'undefined') {
  window.realtimeManager = realtimeManager;
}

export default realtimeManager;

