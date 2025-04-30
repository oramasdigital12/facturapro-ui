import { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { Mensaje } from '../types';
import api from '../lib/axios';
import toast from 'react-hot-toast';

export default function Mensajes() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [editando, setEditando] = useState<string | null>(null);

  useEffect(() => {
    cargarMensajes();
  }, []);

  async function cargarMensajes() {
    try {
      const { data } = await api.get('/mensajes');
      setMensajes(data);
    } catch (error) {
      toast.error('Error al cargar los mensajes');
      console.error('Error:', error);
    }
  }

  async function guardarMensaje(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevoMensaje.trim()) return;

    try {
      await api.post('/mensajes', { contenido: nuevoMensaje });
      toast.success('Mensaje guardado');
      setNuevoMensaje('');
      cargarMensajes();
    } catch (error) {
      toast.error('Error al guardar el mensaje');
      console.error('Error:', error);
    }
  }

  async function actualizarMensaje(id: string, contenido: string) {
    try {
      await api.put(`/mensajes/${id}`, { contenido });
      toast.success('Mensaje actualizado');
      setEditando(null);
      cargarMensajes();
    } catch (error) {
      toast.error('Error al actualizar el mensaje');
      console.error('Error:', error);
    }
  }

  async function eliminarMensaje(id: string) {
    try {
      await api.delete(`/mensajes/${id}`);
      toast.success('Mensaje eliminado');
      cargarMensajes();
    } catch (error) {
      toast.error('Error al eliminar el mensaje');
      console.error('Error:', error);
    }
  }

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-xl font-semibold mb-4">Enviar Mensaje de WhatsApp</h2>
      
      {/* Formulario de nuevo mensaje */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Nuevo Mensaje Predeterminado</h3>
        <form onSubmit={guardarMensaje} className="flex gap-2">
          <input
            type="text"
            value={nuevoMensaje}
            onChange={(e) => setNuevoMensaje(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
          >
            Guardar
          </button>
        </form>
      </div>

      {/* Lista de mensajes predeterminados */}
      <div className="flex-1 overflow-y-auto">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Mensajes Predeterminados</h3>
        <div className="space-y-2">
          {mensajes.map((mensaje) => (
            <div key={mensaje.id} className="bg-white p-4 rounded-lg shadow-sm">
              {editando === mensaje.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    actualizarMensaje(mensaje.id, mensaje.contenido);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={mensaje.contenido}
                    onChange={(e) => setMensajes(mensajes.map(m => 
                      m.id === mensaje.id ? { ...m, contenido: e.target.value } : m
                    ))}
                    className="flex-1 px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                  >
                    Guardar
                  </button>
                </form>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">{mensaje.contenido}</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditando(mensaje.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => eliminarMensaje(mensaje.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        // Aquí podrías implementar la lógica para enviar el mensaje
                        toast.success('Mensaje enviado');
                      }}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                    >
                      <ChatBubbleLeftIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 