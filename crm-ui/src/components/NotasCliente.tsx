import { useState } from 'react';
import { PlusIcon, XMarkIcon, PaperClipIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Nota, Archivo } from '../types';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface NotasClienteProps {
  clienteId: string;
  notas: Nota[];
  onNotasActualizadas: () => void;
}

export default function NotasCliente({ clienteId, notas, onNotasActualizadas }: NotasClienteProps) {
  const [nuevaNota, setNuevaNota] = useState({
    titulo: '',
    contenido: ''
  });
  const [archivosSubiendo, setArchivosSubiendo] = useState<File[]>([]);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevaNota.titulo || !nuevaNota.contenido) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setCargando(true);
    try {
      const formData = new FormData();
      formData.append('titulo', nuevaNota.titulo);
      formData.append('contenido', nuevaNota.contenido);
      formData.append('cliente_id', clienteId);
      
      archivosSubiendo.forEach(archivo => {
        formData.append('archivos', archivo);
      });

      await api.post('/notas', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setNuevaNota({ titulo: '', contenido: '' });
      setArchivosSubiendo([]);
      onNotasActualizadas();
      toast.success('Nota guardada correctamente');
    } catch (error) {
      toast.error('Error al guardar la nota');
      console.error('Error:', error);
    } finally {
      setCargando(false);
    }
  }

  async function eliminarNota(notaId: string) {
    if (!confirm('¿Estás seguro de eliminar esta nota?')) return;

    try {
      await api.delete(`/notas/${notaId}`);
      onNotasActualizadas();
      toast.success('Nota eliminada correctamente');
    } catch (error) {
      toast.error('Error al eliminar la nota');
      console.error('Error:', error);
    }
  }

  async function eliminarArchivo(archivoId: string) {
    if (!confirm('¿Estás seguro de eliminar este archivo?')) return;

    try {
      await api.delete(`/archivos/${archivoId}`);
      onNotasActualizadas();
      toast.success('Archivo eliminado correctamente');
    } catch (error) {
      toast.error('Error al eliminar el archivo');
      console.error('Error:', error);
    }
  }

  function handleArchivoSeleccionado(e: React.ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files || []);
    setArchivosSubiendo(prev => [...prev, ...archivos]);
  }

  function quitarArchivoSubiendo(index: number) {
    setArchivosSubiendo(prev => prev.filter((_, i) => i !== index));
  }

  function formatearTamano(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Título de la nota"
            value={nuevaNota.titulo}
            onChange={(e) => setNuevaNota({ ...nuevaNota, titulo: e.target.value })}
            className="w-full px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <textarea
            placeholder="Contenido de la nota"
            value={nuevaNota.contenido}
            onChange={(e) => setNuevaNota({ ...nuevaNota, contenido: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        {/* Archivos por subir */}
        {archivosSubiendo.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Archivos seleccionados:</p>
            {archivosSubiendo.map((archivo, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <PaperClipIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">{archivo.name}</span>
                  <span className="ml-2 text-xs text-gray-400">
                    ({formatearTamano(archivo.size)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => quitarArchivoSubiendo(index)}
                  className="text-red-500 hover:text-red-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 cursor-pointer">
            <PaperClipIcon className="h-5 w-5" />
            <span>Adjuntar archivos</span>
            <input
              type="file"
              multiple
              onChange={handleArchivoSeleccionado}
              className="hidden"
            />
          </label>
          <button
            type="submit"
            disabled={cargando}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50"
          >
            <PlusIcon className="h-5 w-5" />
            {cargando ? 'Guardando...' : 'Agregar nota'}
          </button>
        </div>
      </form>

      {/* Lista de notas */}
      <div className="space-y-4">
        {notas.map((nota) => (
          <div key={nota.id} className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-medium text-gray-900">{nota.titulo}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(nota.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => eliminarNota(nota.id)}
                className="text-red-500 hover:text-red-600"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-4">{nota.contenido}</p>
            
            {/* Archivos adjuntos */}
            {nota.archivos.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Archivos adjuntos:</p>
                {nota.archivos.map((archivo) => (
                  <div key={archivo.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <PaperClipIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <a
                        href={archivo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        {archivo.nombre}
                      </a>
                      <span className="ml-2 text-xs text-gray-400">
                        ({formatearTamano(archivo.tamano)})
                      </span>
                    </div>
                    <button
                      onClick={() => eliminarArchivo(archivo.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 