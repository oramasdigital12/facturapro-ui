type FacturaPreviewProps = {
  factura: any;
  mostrarStatus?: boolean;
};

export default function FacturaPreview({ factura, mostrarStatus }: FacturaPreviewProps) {
  // Determinar estado y colores exactos como en el backend
  const estado = factura?.estado === 'pagada' ? 'PAID' : 'PENDING';
  const colorEstado = factura?.estado === 'pagada' ? '#4CAF50' : '#F7E7A6';
  const colorTextoEstado = factura?.estado === 'pagada' ? '#218838' : '#8a6d3b';
  const colorFondoEstado = factura?.estado === 'pagada' ? '#e6f9ec' : '#fdf6d7';
  
  // Usar color personalizado del negocio o azul oscuro por defecto
  const colorNegocio = factura?.negocio?.color_personalizado || '#1e3a8a';
  
  // Datos del negocio con fallbacks más robustos
  const nombreNegocio = factura?.negocio?.nombre || factura?.negocio?.nombre_negocio || factura?.nombre_negocio || '';
  const direccionNegocio = factura?.negocio?.direccion || factura?.negocio?.address || factura?.direccion || '';
  const emailNegocio = factura?.negocio?.email || factura?.negocio?.correo || factura?.email || '';
  const telefonoNegocio = factura?.negocio?.telefono || factura?.negocio?.phone || '';
  const logoUrl = factura?.negocio?.logo_url || factura?.logo_personalizado_url || factura?.negocio?.logo || '';

  // Datos del cliente con fallbacks más robustos
  const clienteNombre = factura?.cliente?.nombre || factura?.cliente?.name || '';
  const clienteEmail = factura?.cliente?.email || factura?.cliente?.correo || '';
  const clienteTelefono = factura?.cliente?.telefono || factura?.cliente?.phone || '';
  const clienteDireccion = factura?.cliente?.direccion || factura?.cliente?.address || '';

  // Datos de la factura
  const numeroFactura = factura?.numero_factura || '';
  const fechaFactura = factura?.fecha_factura || '';
  const fechaVencimiento = factura?.fecha_vencimiento || '';
  const nota = factura?.nota || '';
  const terminos = factura?.terminos || '';

  // Totales
  const subtotal = factura?.subtotal || 0;
  const impuesto = factura?.impuesto || 0;
  const total = factura?.total || 0;
  const deposito = factura?.deposito || 0;
  const balanceRestante = factura?.balance_restante || 0;

  return (
    <div className="invoice-container" style={{
      fontFamily: "'Segoe UI', Arial, sans-serif",
      background: '#fff',
      color: '#222',
      margin: 0,
      padding: 0,
      lineHeight: '1.4',
      maxWidth: '800px',
      marginLeft: 'auto',
      marginRight: 'auto',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <style>
        {`
          @page {
            size: A4;
            margin: 0;
          }
          
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: #fff;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }
          
          /* Header Section */
          .header {
            background: ${colorNegocio};
            color: white;
            padding: 30px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          
          .header-left {
            display: flex;
            align-items: center;
            gap: 20px;
          }
          
          .logo-placeholder {
            width: 80px;
            height: 80px;
            background: rgba(255,255,255,0.2);
            border: 2px dashed rgba(255,255,255,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: rgba(255,255,255,0.7);
            text-align: center;
          }
          
          .logo {
            width: 80px;
            height: 80px;
            object-fit: contain;
            border-radius: 8px;
            background: white;
          }
          
          .invoice-title {
            font-size: 2.5rem;
            font-weight: bold;
            margin: 0;
          }
          
          .business-info {
            text-align: right;
          }
          
          .business-name {
            font-size: 1.3rem;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .business-details {
            font-size: 0.95rem;
            line-height: 1.3;
          }
          
          /* Main Content */
          .main-content {
            padding: 30px;
            flex: 1;
          }
          
          .invoice-details-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #e0e0e0;
          }
          
          .invoice-details {
            flex: 1;
          }
          
          .bill-to {
            flex: 1;
            text-align: right;
          }
          
          .section-title {
            font-weight: bold;
            font-size: 1.1rem;
            margin-bottom: 10px;
            color: ${colorNegocio};
          }
          
          .detail-row {
            margin-bottom: 5px;
            font-size: 0.95rem;
          }
          
          .detail-label {
            font-weight: bold;
            color: #666;
          }
          
          /* Items Table */
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          
          .items-table th {
            background: #f8f9fa;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
            color: ${colorNegocio};
            border-bottom: 2px solid #e0e0e0;
          }
          
          .items-table td {
            padding: 12px 8px;
            border-bottom: 1px solid #f0f0f0;
          }
          
          .items-table tr:nth-child(even) {
            background: #fafafa;
          }
          
          /* Bottom Section */
          .bottom-section {
            display: flex;
            justify-content: space-between;
            gap: 40px;
          }
          
          .terms-section {
            flex: 1;
          }
          
          .terms-content {
            text-align: justify;
            white-space: pre-wrap;
            word-wrap: break-word;
            line-height: 1.5;
            font-size: 0.9rem;
            color: #555;
          }
          
          .totals-section {
            flex: 0 0 200px;
            text-align: right;
          }
          
          .total-row {
            margin-bottom: 8px;
            font-size: 0.95rem;
          }
          
          .total-row.total {
            font-size: 1.1rem;
            font-weight: bold;
            color: ${colorNegocio};
            border-top: 2px solid #e0e0e0;
            padding-top: 8px;
            margin-top: 8px;
          }
          
          .total-label {
            display: inline-block;
            width: 80px;
            text-align: left;
          }
          
          .total-value {
            display: inline-block;
            width: 80px;
            text-align: right;
          }
          
          /* Status Badge */
          .status-badge {
            margin-top: 20px;
            background: ${colorFondoEstado};
            color: ${colorTextoEstado};
            font-weight: bold;
            font-size: 1.2rem;
            padding: 12px 24px;
            border-radius: 25px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            text-align: center;
            display: inline-block;
          }
          
          /* Footer */
          .footer {
            background: ${colorNegocio};
            color: white;
            padding: 15px 30px;
            text-align: center;
            font-size: 0.9rem;
            margin-top: auto;
          }
          
          .footer-logo {
            width: 20px;
            height: 20px;
            object-fit: contain;
            border-radius: 50%;
            background: white;
            padding: 2px;
          }
          
          /* Page Break */
          .page-break {
            page-break-before: always;
          }
          
          /* Ensure footer stays at bottom */
          .invoice-container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }
          
          .main-content {
            flex: 1;
          }
        `}
      </style>

      {/* Header */}
      <div className="header">
        <div className="header-left">
          {logoUrl ? 
            <img src={logoUrl} className="logo" alt="Logo" /> : 
            <div className="logo-placeholder">Your Company<br/>Logo</div>
          }
          <h1 className="invoice-title">INVOICE</h1>
        </div>
        <div className="business-info">
          <div className="business-name">{nombreNegocio || 'Business Name'}</div>
          <div className="business-details">
            {direccionNegocio}<br/>
            {telefonoNegocio}<br/>
            {emailNegocio}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="main-content">
        {/* Invoice Details Section */}
        <div className="invoice-details-section">
          <div className="invoice-details">
            <div className="section-title">INVOICE DETAILS:</div>
            <div className="detail-row">
              <span className="detail-label">Invoice #:</span> {numeroFactura || '0000'}
            </div>
            <div className="detail-row">
              <span className="detail-label">Date of Issue:</span> {fechaFactura || 'MM/DD/YYYY'}
            </div>
            <div className="detail-row">
              <span className="detail-label">Due Date:</span> {fechaVencimiento || 'MM/DD/YYYY'}
            </div>
          </div>
          <div className="bill-to">
            <div className="section-title">BILL TO:</div>
            <div className="detail-row">{clienteNombre || 'CUSTOMER NAME'}</div>
            <div className="detail-row">{clienteDireccion || ''}</div>
            <div className="detail-row">{clienteEmail || ''}</div>
            <div className="detail-row">{clienteTelefono || ''}</div>
          </div>
        </div>
        
        {/* Items Table */}
        <table className="items-table">
          <thead>
            <tr>
              <th>ITEM/SERVICE</th>
              <th>DESCRIPTION</th>
              <th>QTY/HRS</th>
              <th>RATE</th>
              <th>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {factura?.items && factura.items.length > 0 ? factura.items.map((item: any, idx: number) => (
              <tr key={idx}>
                <td>{item.categoria || 'Service'}</td>
                <td>{item.descripcion || 'Description'}</td>
                <td>{item.cantidad || '1'}</td>
                <td>${Number(item.precio_unitario || 0).toFixed(2)}</td>
                <td>${Number(item.total || 0).toFixed(2)}</td>
              </tr>
            )) : (
              <tr>
                <td>Placeholder</td>
                <td>Text</td>
                <td>000</td>
                <td>000</td>
                <td>000</td>
              </tr>
            )}
          </tbody>
        </table>
        
        {/* Bottom Section */}
        <div className="bottom-section">
          <div className="terms-section">
            <div className="section-title">TERMS</div>
            <div className="terms-content">{terminos || 'Text Here'}</div>
            
            <div className="section-title" style={{ marginTop: '20px' }}>CONDITIONS/INSTRUCTIONS</div>
            <div className="terms-content">{nota || 'Text Here'}</div>
          </div>
          
          <div className="totals-section">
            <div className="total-row">
              <span className="total-label">Subtotal:</span>
              <span className="total-value">${Number(subtotal).toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span className="total-label">Tax:</span>
              <span className="total-value">${Number(impuesto).toFixed(2)}</span>
            </div>
            <div className="total-row total">
              <span className="total-label">TOTAL:</span>
              <span className="total-value">${Number(total).toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span className="total-label">Deposit:</span>
              <span className="total-value">${Number(deposito).toFixed(2)}</span>
            </div>
            <div className="total-row total">
              <span className="total-label">BALANCE:</span>
              <span className="total-value">${Number(balanceRestante).toFixed(2)}</span>
            </div>
            
            {/* Status Badge - Más grande y debajo del BALANCE */}
            {mostrarStatus && estado && (
              <div className="status-badge">{estado}</div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {logoUrl ? 
            <img src={logoUrl} className="footer-logo" alt="Logo" /> : 
            <div style={{ 
              width: '20px', 
              height: '20px', 
              background: 'white', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: 'bold', 
              color: colorNegocio, 
              fontSize: '12px' 
            }}>F</div>
          }
          <span>{nombreNegocio || 'FreshBooks'}</span>
        </div>
      </div>
    </div>
  );
} 