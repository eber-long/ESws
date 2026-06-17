const PDFDocument = require('pdfkit');

/**
 * Genera un buffer PDF con la factura del pedido.
 * @param {Object} pedido - Objeto del pedido desde la BD.
 * @param {string} emailCliente - Email del cliente si está disponible.
 * @returns {Promise<Buffer>}
 */
function generarFacturaPDF(pedido, emailCliente = '') {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const buffers = [];

            doc.on('data', chunk => buffers.push(chunk));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });
            doc.on('error', err => reject(err));

            // Colores del diseño
            const colorPrimario = '#1a73e8'; // Azul premium
            const colorTexto = '#202124'; // Gris oscuro
            const colorSecundario = '#5f6368'; // Gris medio

            // Cabecera / Logo
            doc.fillColor(colorPrimario)
               .fontSize(26)
               .text('ElectroShop', 50, 50, { align: 'left' });

            doc.fillColor(colorSecundario)
               .fontSize(10)
               .text('Lo mejor en tecnología y componentes electrónicos', 50, 80);

            doc.fillColor(colorTexto)
               .fontSize(12)
               .text('FACTURA ELECTRÓNICA', 350, 50, { align: 'right' })
               .fontSize(10)
               .text(`N° Factura: ${pedido.factura_numero || 'PENDIENTE'}`, 350, 70, { align: 'right' })
               .text(`Fecha: ${new Date(pedido.fecha).toLocaleDateString('es-NI')}`, 350, 85, { align: 'right' });

            // Línea divisoria
            doc.moveTo(50, 110).lineTo(545, 110).strokeColor('#e8eaed').strokeWidth(2).stroke();

            // Información de Facturación
            doc.fillColor(colorTexto)
               .fontSize(12)
               .text('Detalles del Cliente', 50, 130)
               .fontSize(10)
               .fillColor(colorSecundario)
               .text(`Nombre: ${pedido.cliente}`, 50, 150)
               .text(`Email: ${emailCliente || 'No registrado'}`, 50, 165)
               .text(`Código Pedido: ${pedido.codigo}`, 50, 180);

            if (pedido.fecha_confirmacion) {
                doc.text(`Confirmado el: ${new Date(pedido.fecha_confirmacion).toLocaleString('es-NI')}`, 50, 195);
            }

            // Línea divisoria de tabla
            doc.moveTo(50, 220).lineTo(545, 220).strokeColor('#e8eaed').strokeWidth(1).stroke();

            // Encabezados de Tabla
            let y = 235;
            doc.fillColor(colorPrimario)
               .fontSize(10)
               .text('Descripción del Producto', 50, y)
               .text('Cantidad', 380, y, { width: 50, align: 'center' })
               .text('Total', 480, y, { width: 65, align: 'right' });

            doc.moveTo(50, y + 15).lineTo(545, y + 15).strokeColor(colorPrimario).strokeWidth(1.5).stroke();
            y += 25;

            // Productos
            doc.fillColor(colorTexto);
            const productos = Array.isArray(pedido.productos) ? pedido.productos : [];
            
            productos.forEach((prod) => {
                // Parsear formato "Cantx Producto" o similar
                let cantidad = 1;
                let nombreProd = prod;
                
                const match = prod.match(/^(\d+)x\s+(.+)$/);
                if (match) {
                    cantidad = parseInt(match[1]);
                    nombreProd = match[2];
                }

                doc.text(nombreProd, 50, y, { width: 320 });
                doc.text(cantidad.toString(), 380, y, { width: 50, align: 'center' });
                // El total se muestra al final
                y += 20;

                // Salto de página simple si se llena
                if (y > 700) {
                    doc.addPage();
                    y = 50;
                }
            });

            // Línea antes del total
            doc.moveTo(50, y).lineTo(545, y).strokeColor('#e8eaed').strokeWidth(1).stroke();
            y += 15;

            // Total Facturado
            doc.fillColor(colorTexto)
               .fontSize(14)
               .text(`Total Pagado: C$ ${parseFloat(pedido.total).toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 50, y, { align: 'right' });

            // Pie de página
            doc.fillColor(colorSecundario)
               .fontSize(8)
               .text('Gracias por su compra en ElectroShop.', 50, 750, { align: 'center' })
               .text('Esta es una factura generada electrónicamente.', 50, 762, { align: 'center' });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = { generarFacturaPDF };
