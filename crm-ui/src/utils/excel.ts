import * as XLSX from 'xlsx';
import { Cliente, Venta } from '../types';

export function exportClientesToExcel(clientes: Cliente[]) {
  const workbook = XLSX.utils.book_new();
  
  // Preparar datos de clientes
  const clientesData = clientes.map(cliente => ({
    'ID': cliente.id,
    'Nombre': cliente.nombre,
    'Teléfono': cliente.telefono,
    'Email': cliente.email || '',
    'Categoría': cliente.categoria,
    'Fecha de Nacimiento': cliente.fecha_nacimiento || '',
    'Fecha de Inicio': cliente.fecha_inicio || '',
    'Fecha de Vencimiento': cliente.fecha_vencimiento || '',
    'Fecha de Registro': new Date(cliente.created_at).toLocaleDateString()
  }));

  const clientesSheet = XLSX.utils.json_to_sheet(clientesData);
  XLSX.utils.book_append_sheet(workbook, clientesSheet, 'Clientes');

  // Agregar hoja de notas
  const notasData: any[] = [];
  clientes.forEach(cliente => {
    cliente.notas.forEach(nota => {
      notasData.push({
        'Cliente': cliente.nombre,
        'Título': nota.titulo,
        'Contenido': nota.contenido,
        'Fecha': new Date(nota.created_at).toLocaleDateString()
      });
    });
  });

  if (notasData.length > 0) {
    const notasSheet = XLSX.utils.json_to_sheet(notasData);
    XLSX.utils.book_append_sheet(workbook, notasSheet, 'Notas');
  }

  XLSX.writeFile(workbook, 'clientes.xlsx');
}

export function exportVentasToExcel(ventas: Venta[], clientes: Cliente[]) {
  const workbook = XLSX.utils.book_new();
  
  // Preparar datos de ventas
  const ventasData = ventas.map(venta => {
    const cliente = clientes.find(c => c.id === venta.cliente_id);
    return {
      'ID': venta.id,
      'Cliente': cliente?.nombre || 'Cliente no encontrado',
      'Monto': `$${venta.monto}`,
      'Fecha': new Date(venta.fecha_pago).toLocaleDateString(),
      'Tipo': venta.tipo === 'recurrente' ? 'Recurrente' : 'Única',
      'Estado': venta.estado === 'pagada' ? 'Pagada' : 'Pendiente'
    };
  });

  const ventasSheet = XLSX.utils.json_to_sheet(ventasData);
  XLSX.utils.book_append_sheet(workbook, ventasSheet, 'Ventas');

  // Agregar resumen
  const resumenData = [
    {
      'Métrica': 'Total Ventas',
      'Valor': `$${ventas.reduce((sum, v) => sum + v.monto, 0)}`
    },
    {
      'Métrica': 'Ventas Pagadas',
      'Valor': `$${ventas.filter(v => v.estado === 'pagada').reduce((sum, v) => sum + v.monto, 0)}`
    },
    {
      'Métrica': 'Ventas Pendientes',
      'Valor': `$${ventas.filter(v => v.estado === 'pendiente').reduce((sum, v) => sum + v.monto, 0)}`
    },
    {
      'Métrica': 'Ventas Recurrentes',
      'Valor': ventas.filter(v => v.tipo === 'recurrente').length.toString()
    },
    {
      'Métrica': 'Ventas Únicas',
      'Valor': ventas.filter(v => v.tipo === 'unica').length.toString()
    }
  ];

  const resumenSheet = XLSX.utils.json_to_sheet(resumenData);
  XLSX.utils.book_append_sheet(workbook, resumenSheet, 'Resumen');

  XLSX.writeFile(workbook, 'ventas.xlsx');
} 