import Swal from 'sweetalert2';

export const showDeleteConfirmation = (text: string) => {
  return Swal.fire({
    title: '¿Estás seguro?',
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });
};

export const showTaskConfirmation = () => {
  return Swal.fire({
    title: '¿Seguro que deseas marcar esta tarea como completada?',
    text: 'Puedes deshacer esta acción en cualquier momento en la sección de tareas completadas',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sí, completar',
    cancelButtonText: 'Cancelar'
  });
};

export const showSuccessMessage = (text: string) => {
  return Swal.fire({
    title: '¡Éxito!',
    text,
    icon: 'success',
    timer: 2000,
    showConfirmButton: false
  });
}; 