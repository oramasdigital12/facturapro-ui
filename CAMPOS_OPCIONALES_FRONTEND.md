# Campos Opcionales en Facturas - Frontend (Actualizado)

## Resumen de Cambios

Se han actualizado todos los componentes del frontend para que los campos de fecha de vencimiento, términos y condiciones, y notas sean completamente opcionales, siguiendo las especificaciones actualizadas de la API.

## Problemas Solucionados

### ✅ **Problema 1: Fecha de vencimiento no se guardaba**

- **Causa**: La validación era demasiado estricta con el placeholder "mm/dd/yyyy"
- **Solución**: Simplificada la validación para solo verificar si el campo tiene contenido y es una fecha válida

### ✅ **Problema 2: Términos y condiciones aparecían en PDF aunque estuvieran vacíos**

- **Causa**: Se enviaban los términos del negocio en el objeto `negocio`
- **Solución**: Removidos los términos del negocio del objeto enviado al backend

## Cambios Realizados

### 1. **Formulario de Factura** (`src/pages/FacturaForm.tsx`)

#### **Validación Actualizada:**

- ✅ **Removidas validaciones obligatorias** de `nota` y `terminos`
- ✅ **Fecha de vencimiento** sigue siendo opcional
- ✅ **Campos de entrada** ya no muestran asterisco (\*) de obligatorio
- ✅ **Validación simplificada** de fecha de vencimiento

#### **Envío de Datos:**

- ✅ **Fecha de vencimiento**: Se envía como `undefined` si está vacía
- ✅ **Nota**: Se envía como `undefined` si está vacía o solo espacios
- ✅ **Términos**: Se envía como `undefined` si está vacío o solo espacios
- ✅ **Objeto negocio**: Ya no incluye términos del negocio

#### **Preview del Formulario:**

- ✅ **Fecha de vencimiento**: Se envía como `undefined` si está vacía
- ✅ **Nota y términos**: Se envían como `undefined` si están vacíos

### 2. **Preview de Factura** (`src/components/FacturaPreview.tsx`)

#### **Lógica de Visualización:**

```typescript
// Verificar si los campos opcionales tienen contenido
const tieneFechaVencimiento =
  fechaVencimiento &&
  fechaVencimiento.trim() !== "" &&
  fechaVencimiento !== "1999-99-99" &&
  fechaVencimiento !== "mm/dd/yyyy";
const tieneNota = nota && nota.trim() !== "";
const tieneTerminos = terminos && terminos.trim() !== "";
```

#### **Comportamiento:**

- ✅ **Fecha de vencimiento**: Solo se muestra si tiene contenido válido y no es `'1999-99-99'` o `'mm/dd/yyyy'`
- ✅ **Sección de términos**: Solo aparece si `tieneTerminos` es true
- ✅ **Sección de notas**: Solo aparece si `tieneNota` es true
- ✅ **Títulos de sección**: Solo se muestran si hay contenido

### 3. **Detalle de Factura** (`src/pages/FacturaDetalle.tsx`)

#### **Visualización Condicional:**

- ✅ **Fecha de vencimiento**: Solo se muestra si no es `'1999-99-99'` o `'mm/dd/yyyy'`
- ✅ **Nota**: Solo se muestra si tiene contenido
- ✅ **Términos**: Solo se muestra si tiene contenido

## Implementación Técnica

### **Valores por Defecto:**

```typescript
// En el formulario
fecha_vencimiento: fechaVencimiento && fechaVencimiento.trim() !== '' ? fechaVencimiento : undefined,
nota: nota && nota.trim() !== '' ? nota : undefined,
terminos: terminos && terminos.trim() !== '' ? terminos : undefined,
```

### **Validación en Preview:**

```typescript
// Verificar contenido válido
const tieneFechaVencimiento =
  fechaVencimiento &&
  fechaVencimiento.trim() !== "" &&
  fechaVencimiento !== "1999-99-99" &&
  fechaVencimiento !== "mm/dd/yyyy";
const tieneNota = nota && nota.trim() !== "";
const tieneTerminos = terminos && terminos.trim() !== "";
```

### **Renderizado Condicional:**

```typescript
// Solo mostrar secciones si tienen contenido
{
  (tieneTerminos || tieneNota) && (
    <div className="terms-section">
      {tieneTerminos && (
        <>
          <div className="section-title">TERMS</div>
          <div className="terms-content">{terminos}</div>
        </>
      )}

      {tieneNota && (
        <>
          <div className="section-title">CONDITIONS/INSTRUCTIONS</div>
          <div className="terms-content">{nota}</div>
        </>
      )}
    </div>
  );
}
```

## Beneficios de la Actualización

1. **Flexibilidad**: Los usuarios pueden crear facturas sin completar campos opcionales
2. **Limpieza Visual**: Solo se muestran secciones con contenido real
3. **Consistencia**: El frontend y backend manejan los campos opcionales de la misma manera
4. **Experiencia de Usuario**: No se muestran campos vacíos o con texto por defecto
5. **Compatibilidad**: Maneja correctamente el placeholder "mm/dd/yyyy" del input de fecha
6. **Corrección de Bugs**: Solucionados los problemas de validación y términos duplicados

## Verificación

Para verificar que los cambios funcionan correctamente:

1. **Crear factura sin campos opcionales**:

   - ✅ No se muestran errores de validación
   - ✅ Se puede guardar sin problemas
   - ✅ Preview no muestra secciones vacías

2. **Crear factura con fecha de vencimiento vacía**:

   - ✅ Se trata como campo vacío
   - ✅ No aparece en el PDF
   - ✅ No genera errores de validación

3. **Crear factura con términos vacíos**:

   - ✅ No aparecen términos en el PDF
   - ✅ Solo se envían términos específicos de la factura
   - ✅ No se duplican términos del negocio

4. **Crear factura con algunos campos opcionales**:

   - ✅ Solo se muestran las secciones con contenido
   - ✅ Los campos vacíos no aparecen en el PDF

5. **Editar factura existente**:
   - ✅ Los campos opcionales se cargan correctamente
   - ✅ Se pueden limpiar campos opcionales

## Compatibilidad

- ✅ **Facturas existentes**: Mantienen su funcionalidad
- ✅ **API**: Compatible con los nuevos valores por defecto
- ✅ **PDF**: Solo muestra campos con contenido real
- ✅ **Preview**: Consistente con el PDF final
- ✅ **Placeholder**: Maneja correctamente "mm/dd/yyyy"
- ✅ **Validación**: Simplificada y más robusta

## Notas Importantes

1. **Valor especial**: `'1999-99-99'` se usa para identificar fechas de vencimiento vacías
2. **Placeholder**: `'mm/dd/yyyy'` se trata como campo vacío
3. **Cadenas vacías**: Se usan para notas y términos vacíos
4. **Validación**: Solo se valida que los campos tengan formato correcto si se proporcionan
5. **Backend**: Maneja los valores por defecto según las especificaciones de la API
6. **Envío**: Los campos vacíos se envían como `undefined` en lugar de cadenas vacías
7. **Términos del negocio**: Ya no se envían automáticamente, solo los específicos de la factura
