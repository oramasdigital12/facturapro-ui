import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { FiX, FiDownload, FiDollarSign, FiUsers, FiFileText, FiTrendingUp, FiAlertTriangle, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReporteGeneralModalProps {
  open: boolean;
  onClose: () => void;
  fechaDesde: string;
  fechaHasta: string;
  color_personalizado?: string;
}

interface Factura {
  id: string;
  numero_factura: string;
  cliente?: {
    nombre: string;
    telefono?: string;
    email?: string;
  };
  total: number;
  estado: string;
  fecha_factura: string;
  fecha_vencimiento?: string;
  items: any[];
}

interface Cliente {
  id: string;
  nombre: string;
  telefono?: string;
  email?: string;
  categoria: string;
  proviene?: string;
  created_at: string;
}

export default function ReporteGeneralModal({ 
  open, 
  onClose, 
  fechaDesde, 
  fechaHasta, 
  color_personalizado = '#2563eb' 
}: ReporteGeneralModalProps) {
  const [loading, setLoading] = useState(false);
  const [reporteData, setReporteData] = useState<any>(null);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  useEffect(() => {
    if (open && fechaDesde && fechaHasta) {
      generarReporte();
    }
  }, [open, fechaDesde, fechaHasta]);

  const generarReporte = async () => {
    setLoading(true);
    try {
      // Obtener facturas del período
      const facturasRes = await api.get('/api/facturas', {
        params: {
          fecha_inicio: fechaDesde,
          fecha_fin: fechaHasta
        }
      });
      const facturas: Factura[] = facturasRes.data.facturas || facturasRes.data || [];

      // Obtener clientes
      const clientesRes = await api.get('/api/clientes');
      const clientes: Cliente[] = clientesRes.data || [];

      // Filtrar clientes por fecha de creación
      const clientesEnPeriodo = clientes.filter(cliente => {
        const fechaCreacion = new Date(cliente.created_at);
        const desde = new Date(fechaDesde);
        const hasta = new Date(fechaHasta);
        return fechaCreacion >= desde && fechaCreacion <= hasta;
      });

      // Calcular métricas
      const facturasCompletadas = facturas.filter(f => f.estado === 'pagada');
      const facturasPendientes = facturas.filter(f => f.estado === 'pendiente');
      
      // Calcular facturas por vencer y vencidas
      const hoy = new Date();
      const facturasPorVencer = facturasPendientes.filter(f => {
        if (!f.fecha_vencimiento) return false;
        const vencimiento = new Date(f.fecha_vencimiento);
        const dias = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        return dias >= 0 && dias <= 3;
      });

      const facturasVencidas = facturasPendientes.filter(f => {
        if (!f.fecha_vencimiento) return false;
        const vencimiento = new Date(f.fecha_vencimiento);
        const dias = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        return dias < 0;
      });

      // Calcular totales
      const totalVentasCompletadas = facturasCompletadas.reduce((sum, f) => sum + (f.total || 0), 0);
      const totalVentasPendientes = facturasPendientes.reduce((sum, f) => sum + (f.total || 0), 0);
      const totalPorVencer = facturasPorVencer.reduce((sum, f) => sum + (f.total || 0), 0);
      const totalVencidas = facturasVencidas.reduce((sum, f) => sum + (f.total || 0), 0);

      // Clientes por categoría
      const clientesActivos = clientesEnPeriodo.filter(c => c.categoria === 'activo');
      const clientesInactivos = clientesEnPeriodo.filter(c => c.categoria !== 'activo');

      // Agrupar clientes por origen
      const clientesPorOrigen = clientesEnPeriodo.reduce((acc, cliente) => {
        // Usar el campo correcto 'proviene' para el origen
        let origen = 'Sin origen';
        if (cliente.proviene && cliente.proviene.trim() !== '') {
          origen = cliente.proviene.trim();
        }
        
        if (!acc[origen]) {
          acc[origen] = [];
        }
        acc[origen].push(cliente);
        return acc;
      }, {} as Record<string, Cliente[]>);

      // Solo incluir orígenes que tengan clientes
      const origenesConClientes = Object.entries(clientesPorOrigen).filter(([_, clientes]) => clientes.length > 0);

      setReporteData({
        facturas,
        facturasCompletadas,
        facturasPendientes,
        facturasPorVencer,
        facturasVencidas,
        totalVentasCompletadas,
        totalVentasPendientes,
        totalPorVencer,
        totalVencidas,
        clientesEnPeriodo,
        clientesActivos,
        clientesInactivos,
        origenesConClientes
      });
    } catch (error) {
      console.error('Error generando reporte:', error);
    } finally {
      setLoading(false);
    }
  };

     const descargarPDF = async () => {
     if (!reporteData) {
       console.error('No hay datos de reporte disponibles');
       return;
     }
     
     setGenerandoPDF(true);
     try {
       console.log('Iniciando generación de PDF...');
       const doc = new jsPDF();
      
      // Configuración inicial
      doc.setFont('helvetica');
      doc.setFontSize(20);
      doc.setTextColor(37, 99, 235); // Blue-600
      
      // Título
      doc.text('Reporte General', 105, 20, { align: 'center' });
      
      // Período
      doc.setFontSize(12);
      doc.setTextColor(75, 85, 99); // Gray-600
      const periodoText = `Período: ${format(new Date(fechaDesde), 'dd/MM/yyyy', { locale: es })} - ${format(new Date(fechaHasta), 'dd/MM/yyyy', { locale: es })}`;
      doc.text(periodoText, 105, 30, { align: 'center' });
      
      let yPosition = 45;
      
      // Métricas principales
      doc.setFontSize(14);
      doc.setTextColor(37, 99, 235);
      doc.text('Resumen Ejecutivo', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      
      const metricas = [
        `Total de Facturas: ${reporteData.facturas.length}`,
        `Ventas Completadas: $${reporteData.totalVentasCompletadas.toFixed(2)}`,
        `Ventas Pendientes: $${reporteData.totalVentasPendientes.toFixed(2)}`,
        `Por Vencer: $${reporteData.totalPorVencer.toFixed(2)}`,
        `Vencidas: $${reporteData.totalVencidas.toFixed(2)}`,
        `Clientes en Período: ${reporteData.clientesEnPeriodo.length}`,
        `Clientes Activos: ${reporteData.clientesActivos.length}`,
        `Clientes Inactivos: ${reporteData.clientesInactivos.length}`
      ];
      
      metricas.forEach(metrica => {
        doc.text(metrica, 20, yPosition);
        yPosition += 5;
      });
      
      yPosition += 10;
      
      // Facturas Completadas
      if (reporteData.facturasCompletadas.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(37, 99, 235);
        doc.text(`Ventas Completadas - Total: $${reporteData.totalVentasCompletadas.toFixed(2)}`, 20, yPosition);
        yPosition += 8;
        
        const tablaCompletadas = reporteData.facturasCompletadas.map((f: Factura) => [
          f.numero_factura || 'N/A',
          f.cliente?.nombre || 'Cliente N/A',
          `$${(f.total || 0).toFixed(2)}`,
          format(new Date(f.fecha_factura), 'dd/MM/yyyy', { locale: es })
        ]);
        
                 autoTable(doc, {
           startY: yPosition,
           head: [['N° Factura', 'Cliente', 'Total', 'Fecha']],
           body: tablaCompletadas,
           theme: 'grid',
           headStyles: { fillColor: [37, 99, 235] },
           styles: { fontSize: 8 }
         });
         
         yPosition = (doc as any).lastAutoTable.finalY + 10;
      }
      
             // Facturas Pendientes
       if (reporteData.facturasPendientes.length > 0) {
         doc.setFontSize(12);
         doc.setTextColor(37, 99, 235);
         doc.text(`Ventas Pendientes - Total: $${reporteData.totalVentasPendientes.toFixed(2)}`, 20, yPosition);
         yPosition += 8;
         
         const tablaPendientes = reporteData.facturasPendientes.map((f: Factura) => [
           f.numero_factura || 'N/A',
           f.cliente?.nombre || 'Cliente N/A',
           `$${(f.total || 0).toFixed(2)}`,
           format(new Date(f.fecha_factura), 'dd/MM/yyyy', { locale: es })
         ]);
         
                   autoTable(doc, {
            startY: yPosition,
            head: [['N° Factura', 'Cliente', 'Total', 'Fecha']],
            body: tablaPendientes,
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235] },
            styles: { fontSize: 8 }
          });
         
         yPosition = (doc as any).lastAutoTable.finalY + 10;
       }

       // Facturas por Vencer
       if (reporteData.facturasPorVencer.length > 0) {
         doc.setFontSize(12);
         doc.setTextColor(37, 99, 235);
         doc.text(`Facturas por Vencer - Total: $${reporteData.totalPorVencer.toFixed(2)}`, 20, yPosition);
         yPosition += 8;
         
         const tablaPorVencer = reporteData.facturasPorVencer.map((f: Factura) => [
           f.numero_factura || 'N/A',
           f.cliente?.nombre || 'Cliente N/A',
           `$${(f.total || 0).toFixed(2)}`,
           f.fecha_vencimiento ? format(new Date(f.fecha_vencimiento), 'dd/MM/yyyy', { locale: es }) : 'N/A'
         ]);
         
                   autoTable(doc, {
            startY: yPosition,
            head: [['N° Factura', 'Cliente', 'Total', 'Fecha Vencimiento']],
            body: tablaPorVencer,
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235] },
            styles: { fontSize: 8 }
          });
         
         yPosition = (doc as any).lastAutoTable.finalY + 10;
       }

       // Facturas Vencidas
       if (reporteData.facturasVencidas.length > 0) {
         doc.setFontSize(12);
         doc.setTextColor(37, 99, 235);
         doc.text(`Facturas Vencidas - Total: $${reporteData.totalVencidas.toFixed(2)}`, 20, yPosition);
         yPosition += 8;
         
         const tablaVencidas = reporteData.facturasVencidas.map((f: Factura) => [
           f.numero_factura || 'N/A',
           f.cliente?.nombre || 'Cliente N/A',
           `$${(f.total || 0).toFixed(2)}`,
           f.fecha_vencimiento ? format(new Date(f.fecha_vencimiento), 'dd/MM/yyyy', { locale: es }) : 'N/A'
         ]);
         
                   autoTable(doc, {
            startY: yPosition,
            head: [['N° Factura', 'Cliente', 'Total', 'Fecha Vencimiento']],
            body: tablaVencidas,
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235] },
            styles: { fontSize: 8 }
          });
         
         yPosition = (doc as any).lastAutoTable.finalY + 10;
       }
      
      // Clientes Activos
      if (reporteData.clientesActivos.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(37, 99, 235);
        doc.text(`Clientes Activos (${reporteData.clientesActivos.length})`, 20, yPosition);
        yPosition += 8;
        
        const tablaActivos = reporteData.clientesActivos.map((c: Cliente) => [
          c.nombre,
          c.telefono || 'N/A',
          c.email || 'N/A',
          c.proviene || 'Sin origen'
        ]);
        
                 autoTable(doc, {
           startY: yPosition,
           head: [['Nombre', 'Teléfono', 'Email', 'Origen']],
           body: tablaActivos,
           theme: 'grid',
           headStyles: { fillColor: [37, 99, 235] },
           styles: { fontSize: 8 }
         });
        
        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }
      
      // Clientes por Origen
      reporteData.origenesConClientes.forEach(([origen, clientes]: [string, Cliente[]]) => {
        if (clientes.length > 0) {
          doc.setFontSize(12);
          doc.setTextColor(37, 99, 235);
          doc.text(`Clientes por Origen: ${origen} (${clientes.length})`, 20, yPosition);
          yPosition += 8;
          
          const tablaOrigen = clientes.map((c: Cliente) => [
            c.nombre,
            c.telefono || 'N/A',
            c.email || 'N/A',
            c.categoria
          ]);
          
                     autoTable(doc, {
             startY: yPosition,
             head: [['Nombre', 'Teléfono', 'Email', 'Categoría']],
             body: tablaOrigen,
             theme: 'grid',
             headStyles: { fillColor: [37, 99, 235] },
             styles: { fontSize: 8 }
           });
          
          yPosition = (doc as any).lastAutoTable.finalY + 10;
        }
      });
      
             // Guardar PDF
       const nombreArchivo = `reporte_general_${fechaDesde}_${fechaHasta}.pdf`;
       console.log('Guardando PDF como:', nombreArchivo);
       doc.save(nombreArchivo);
       console.log('PDF generado exitosamente');
       
     } catch (error) {
       console.error('Error generando PDF:', error);
       alert('Error al generar el PDF. Revisa la consola para más detalles.');
     } finally {
       setGenerandoPDF(false);
     }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
        
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color_personalizado }}>
                <FiTrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Reporte General
                </Dialog.Title>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {fechaDesde && fechaHasta && (
                    `${format(new Date(fechaDesde), 'dd/MM/yyyy', { locale: es })} - ${format(new Date(fechaHasta), 'dd/MM/yyyy', { locale: es })}`
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={descargarPDF}
                disabled={generandoPDF || !reporteData}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {generandoPDF ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <FiDownload className="w-4 h-4" />
                    Descargar PDF
                  </>
                )}
              </button>
              
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Generando reporte...</p>
                </div>
              </div>
            ) : reporteData ? (
              <div className="space-y-8">
                {/* Métricas Principales */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <FiFileText className="w-5 h-5" />
                      <span className="text-sm font-medium">Total Facturas</span>
                    </div>
                    <div className="text-2xl font-bold">{reporteData.facturas.length}</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <FiDollarSign className="w-5 h-5" />
                      <span className="text-sm font-medium">Ventas Completadas</span>
                    </div>
                    <div className="text-2xl font-bold">${reporteData.totalVentasCompletadas.toFixed(2)}</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-4 text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <FiClock className="w-5 h-5" />
                      <span className="text-sm font-medium">Ventas Pendientes</span>
                    </div>
                    <div className="text-2xl font-bold">${reporteData.totalVentasPendientes.toFixed(2)}</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <FiUsers className="w-5 h-5" />
                      <span className="text-sm font-medium">Clientes</span>
                    </div>
                    <div className="text-2xl font-bold">{reporteData.clientesEnPeriodo.length}</div>
                  </div>
                </div>

                                 {/* Detalles de Facturas */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   {/* Facturas Completadas */}
                   {reporteData.facturasCompletadas.length > 0 && (
                     <div className="bg-white dark:bg-gray-700 rounded-xl shadow-lg p-6">
                       <div className="flex items-center gap-2 mb-4">
                         <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                           <FiDollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                         </div>
                         <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                           Ventas Completadas
                         </h3>
                         <span className="ml-auto text-lg font-bold text-green-600 dark:text-green-400">
                           ${reporteData.totalVentasCompletadas.toFixed(2)}
                         </span>
                       </div>
                       
                       <div className="space-y-3 max-h-64 overflow-y-auto">
                         {reporteData.facturasCompletadas.map((factura: Factura) => (
                           <div key={factura.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                             <div>
                               <div className="font-medium text-gray-900 dark:text-gray-100">
                                 #{factura.numero_factura || 'N/A'}
                               </div>
                               <div className="text-sm text-gray-600 dark:text-gray-400">
                                 {factura.cliente?.nombre || 'Cliente N/A'}
                               </div>
                             </div>
                             <div className="text-right">
                               <div className="font-semibold text-gray-900 dark:text-gray-100">
                                 ${(factura.total || 0).toFixed(2)}
                               </div>
                               <div className="text-sm text-gray-600 dark:text-gray-400">
                                 {format(new Date(factura.fecha_factura), 'dd/MM/yyyy', { locale: es })}
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   {/* Facturas Pendientes */}
                   {reporteData.facturasPendientes.length > 0 && (
                     <div className="bg-white dark:bg-gray-700 rounded-xl shadow-lg p-6">
                       <div className="flex items-center gap-2 mb-4">
                         <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                           <FiClock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                         </div>
                         <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                           Ventas Pendientes
                         </h3>
                         <span className="ml-auto text-lg font-bold text-yellow-600 dark:text-yellow-400">
                           ${reporteData.totalVentasPendientes.toFixed(2)}
                         </span>
                       </div>
                       
                       <div className="space-y-3 max-h-64 overflow-y-auto">
                         {reporteData.facturasPendientes.map((factura: Factura) => (
                           <div key={factura.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                             <div>
                               <div className="font-medium text-gray-900 dark:text-gray-100">
                                 #{factura.numero_factura || 'N/A'}
                               </div>
                               <div className="text-sm text-gray-600 dark:text-gray-400">
                                 {factura.cliente?.nombre || 'Cliente N/A'}
                               </div>
                             </div>
                             <div className="text-right">
                               <div className="font-semibold text-gray-900 dark:text-gray-100">
                                 ${(factura.total || 0).toFixed(2)}
                               </div>
                               <div className="text-sm text-gray-600 dark:text-gray-400">
                                 {format(new Date(factura.fecha_factura), 'dd/MM/yyyy', { locale: es })}
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>

                 {/* Facturas por Vencer y Vencidas */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   {/* Facturas por Vencer */}
                   {reporteData.facturasPorVencer.length > 0 && (
                     <div className="bg-white dark:bg-gray-700 rounded-xl shadow-lg p-6">
                       <div className="flex items-center gap-2 mb-4">
                         <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                           <FiAlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                         </div>
                         <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                           Por Vencer
                         </h3>
                         <span className="ml-auto text-lg font-bold text-orange-600 dark:text-orange-400">
                           ${reporteData.totalPorVencer.toFixed(2)}
                         </span>
                       </div>
                       
                       <div className="space-y-3 max-h-64 overflow-y-auto">
                         {reporteData.facturasPorVencer.map((factura: Factura) => (
                           <div key={factura.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                             <div>
                               <div className="font-medium text-gray-900 dark:text-gray-100">
                                 #{factura.numero_factura || 'N/A'}
                               </div>
                               <div className="text-sm text-gray-600 dark:text-gray-400">
                                 {factura.cliente?.nombre || 'Cliente N/A'}
                               </div>
                               {factura.fecha_vencimiento && (
                                 <div className="text-xs text-orange-600 dark:text-orange-400">
                                   Vence: {format(new Date(factura.fecha_vencimiento), 'dd/MM/yyyy', { locale: es })}
                                 </div>
                               )}
                             </div>
                             <div className="text-right">
                               <div className="font-semibold text-gray-900 dark:text-gray-100">
                                 ${(factura.total || 0).toFixed(2)}
                               </div>
                               <div className="text-sm text-gray-600 dark:text-gray-400">
                                 {format(new Date(factura.fecha_factura), 'dd/MM/yyyy', { locale: es })}
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   {/* Facturas Vencidas */}
                   {reporteData.facturasVencidas.length > 0 && (
                     <div className="bg-white dark:bg-gray-700 rounded-xl shadow-lg p-6">
                       <div className="flex items-center gap-2 mb-4">
                         <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                           <FiAlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                         </div>
                         <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                           Vencidas
                         </h3>
                         <span className="ml-auto text-lg font-bold text-red-600 dark:text-red-400">
                           ${reporteData.totalVencidas.toFixed(2)}
                         </span>
                       </div>
                       
                       <div className="space-y-3 max-h-64 overflow-y-auto">
                         {reporteData.facturasVencidas.map((factura: Factura) => (
                           <div key={factura.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                             <div>
                               <div className="font-medium text-gray-900 dark:text-gray-100">
                                 #{factura.numero_factura || 'N/A'}
                               </div>
                               <div className="text-sm text-gray-600 dark:text-gray-400">
                                 {factura.cliente?.nombre || 'Cliente N/A'}
                               </div>
                               {factura.fecha_vencimiento && (
                                 <div className="text-xs text-red-600 dark:text-red-400">
                                   Vencida: {format(new Date(factura.fecha_vencimiento), 'dd/MM/yyyy', { locale: es })}
                                 </div>
                               )}
                             </div>
                             <div className="text-right">
                               <div className="font-semibold text-gray-900 dark:text-gray-100">
                                 ${(factura.total || 0).toFixed(2)}
                               </div>
                               <div className="text-sm text-gray-600 dark:text-gray-400">
                                 {format(new Date(factura.fecha_factura), 'dd/MM/yyyy', { locale: es })}
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>

                {/* Clientes */}
                <div className="bg-white dark:bg-gray-700 rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <FiUsers className="w-5 h-5" />
                    Análisis de Clientes
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {reporteData.clientesActivos.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Activos</div>
                    </div>
                    
                    <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {reporteData.clientesInactivos.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Inactivos</div>
                    </div>
                    
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {reporteData.clientesEnPeriodo.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total en Período</div>
                    </div>
                  </div>

                  {/* Clientes por Origen */}
                  {reporteData.origenesConClientes.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100">
                        Clientes por Origen
                      </h4>
                      
                      {reporteData.origenesConClientes.map(([origen, clientes]: [string, Cliente[]]) => (
                        <div key={origen} className="bg-gray-50 dark:bg-gray-600 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium text-gray-900 dark:text-gray-100">
                              {origen}
                            </h5>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {clientes.length} cliente{clientes.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {clientes.map((cliente: Cliente) => (
                              <div key={cliente.id} className="bg-white dark:bg-gray-700 rounded-lg p-3">
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                  {cliente.nombre}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {cliente.telefono || 'Sin teléfono'}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {cliente.email || 'Sin email'}
                                </div>
                                <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
                                  cliente.categoria === 'activo' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                }`}>
                                  {cliente.categoria}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">No hay datos para mostrar</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
