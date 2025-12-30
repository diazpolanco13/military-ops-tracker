/**
 * 🔄 Realtime Manager V2 - Gestión centralizada de suscripciones Supabase
 * 
 * PROBLEMA ANTERIOR: Loop infinito de reconexión por cierre/reconexión cíclico
 * SOLUCIÓN: Flag de cierre intencional + contador de reconexión por tabla
 */

import { supabase } from './supabase';

class RealtimeManager {
  constructor() {
    this.channels = new Map();          // tabla -> channel
    this.listeners = new Map();         // tabla -> Set<callback>
    this.lastEvent = new Map();         // tabla -> timestamp (throttle)
    this.reconnectAttempts = new Map(); // tabla -> intentos (POR TABLA, no global)
    this.closingIntentionally = new Set(); // tablas que se están cerrando intencionalmente
    this.throttleMs = 500;              // Mínimo 500ms entre notificaciones
    this.maxReconnectAttempts = 3;      // Reducido de 5 a 3
    this.reconnectDelay = 3000;         // Aumentado a 3 segundos
    this.isCleaningUp = false;          // Flag para evitar reconexiones durante cleanup
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
      
      // Si no quedan listeners, cerrar el canal INTENCIONALMENTE
      if (tableListeners.size === 0) {
        this._closeChannel(table, true); // true = intencional
        this.listeners.delete(table);
      }
    }
  }

  /**
   * Crear canal para una tabla
   */
  _createChannel(table) {
    // Evitar crear canal si ya existe
    if (this.channels.has(table)) {
      console.log(`🔄 RealtimeManager: Canal "${table}" ya existe, reutilizando`);
      return;
    }

    console.log(`🔄 RealtimeManager: Creando canal para "${table}"`);

    const channel = supabase
      .channel(`realtime_${table}_${Date.now()}`) // ID único para evitar conflictos
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
          this.reconnectAttempts.set(table, 0); // Reset por tabla
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          // Solo intentar reconectar si NO fue cierre intencional
          if (this.closingIntentionally.has(table)) {
            console.log(`🔌 RealtimeManager: Canal "${table}" cerrado (intencional)`);
            this.closingIntentionally.delete(table);
          } else if (!this.isCleaningUp) {
            console.warn(`⚠️ RealtimeManager: Canal "${table}" cerrado/error inesperado`);
            this._attemptReconnect(table);
          }
        }
      });

    this.channels.set(table, channel);
  }

  /**
   * Cerrar canal de una tabla
   * @param {boolean} intentional - Si es true, no intentar reconectar
   */
  _closeChannel(table, intentional = false) {
    const channel = this.channels.get(table);
    if (channel) {
      if (intentional) {
        this.closingIntentionally.add(table); // Marcar como intencional ANTES de cerrar
      }
      console.log(`🔌 RealtimeManager: Cerrando canal "${table}" (${intentional ? 'intencional' : 'forzado'})`);
      
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        console.warn(`⚠️ RealtimeManager: Error cerrando canal "${table}":`, e);
      }
      
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
   * Intentar reconexión con backoff (POR TABLA)
   */
  _attemptReconnect(table) {
    // No reconectar durante cleanup global
    if (this.isCleaningUp) {
      console.log(`🔄 RealtimeManager: Ignorando reconexión de "${table}" (cleanup en progreso)`);
      return;
    }

    const attempts = this.reconnectAttempts.get(table) || 0;
    
    if (attempts >= this.maxReconnectAttempts) {
      console.error(`❌ RealtimeManager: Máximo de intentos alcanzado para "${table}", pausando reconexión`);
      // Resetear después de 30 segundos para permitir reintentos posteriores
      setTimeout(() => {
        this.reconnectAttempts.set(table, 0);
      }, 30000);
      return;
    }

    // Solo reconectar si aún hay listeners
    if (!this.listeners.get(table)?.size) {
      console.log(`🔄 RealtimeManager: No hay listeners para "${table}", no reconectar`);
      return;
    }

    this.reconnectAttempts.set(table, attempts + 1);
    const delay = this.reconnectDelay * (attempts + 1); // Backoff exponencial

    console.log(`🔄 RealtimeManager: Reconectando "${table}" en ${delay}ms (intento ${attempts + 1}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      // Verificar de nuevo si hay listeners antes de reconectar
      if (this.listeners.get(table)?.size > 0 && !this.isCleaningUp) {
        // Eliminar canal viejo del mapa (sin llamar unsubscribe que dispara CLOSED)
        this.channels.delete(table);
        // Crear nuevo canal
        this._createChannel(table);
      }
    }, delay);
  }

  /**
   * Limpiar todo (para logout o unmount global)
   */
  cleanup() {
    console.log('🧹 RealtimeManager: Limpiando todos los canales');
    this.isCleaningUp = true;
    
    this.channels.forEach((channel, table) => {
      this.closingIntentionally.add(table);
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        // Ignorar errores durante cleanup
      }
    });
    
    this.channels.clear();
    this.listeners.clear();
    this.lastEvent.clear();
    this.reconnectAttempts.clear();
    this.closingIntentionally.clear();
    
    // Permitir nuevas suscripciones después de un momento
    setTimeout(() => {
      this.isCleaningUp = false;
    }, 1000);
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
      reconnectAttempts: Object.fromEntries(this.reconnectAttempts),
      closingIntentionally: Array.from(this.closingIntentionally),
      isCleaningUp: this.isCleaningUp,
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
