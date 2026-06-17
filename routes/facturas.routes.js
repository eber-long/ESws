const express = require('express');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { verificarToken, verificarVendedorOAdmin } = require('../middlewares/auth.middleware');
const { generarFacturaPDF } = require('../utils/factura');

const router = express.Router();

// GET /api/facturas/:pedidoId — Descargar Factura en PDF
router.get('/:pedidoId', verificarToken, verificarVendedorOAdmin, asyncHandler(async (req, res) => {
    const { pedidoId } = req.params;

    const result = await pool.query('SELECT * FROM pedidos WHERE id = $1', [pedidoId]);
    if (result.rows.length === 0) {
        throw new AppError('Pedido no encontrado', 404);
    }

    const pedido = result.rows[0];

    // Obtener email del cliente si tiene usuario_id
    let email = '';
    if (pedido.usuario_id) {
        const userResult = await pool.query('SELECT email FROM usuarios WHERE id = $1', [pedido.usuario_id]);
        if (userResult.rows.length > 0) {
            email = userResult.rows[0].email || '';
        }
    }

    const pdfBuffer = await generarFacturaPDF(pedido, email);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=factura-${pedido.codigo}.pdf`);
    res.send(pdfBuffer);
}));

// POST /api/facturas/:pedidoId/enviar — Enviar Factura por correo al cliente
router.post('/:pedidoId/enviar', verificarToken, verificarVendedorOAdmin, asyncHandler(async (req, res) => {
    const { pedidoId } = req.params;

    const result = await pool.query('SELECT * FROM pedidos WHERE id = $1', [pedidoId]);
    if (result.rows.length === 0) {
        throw new AppError('Pedido no encontrado', 404);
    }

    const pedido = result.rows[0];

    // Obtener email del cliente si tiene usuario_id
    let email = '';
    if (pedido.usuario_id) {
        const userResult = await pool.query('SELECT email FROM usuarios WHERE id = $1', [pedido.usuario_id]);
        if (userResult.rows.length > 0) {
            email = userResult.rows[0].email || '';
        }
    }

    if (!email) {
        throw new AppError('El cliente no tiene un correo electrónico registrado.', 400);
    }

    const pdfBuffer = await generarFacturaPDF(pedido, email);

    let infoMessage = 'Factura enviada correctamente.';
    let nodemailerInstalled = false;
    try {
        require.resolve('nodemailer');
        nodemailerInstalled = true;
    } catch (e) {
        nodemailerInstalled = false;
    }

    if (nodemailerInstalled && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        });

        await transporter.sendMail({
            from: `"ElectroShop" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `Factura de Compra ${pedido.codigo} - ElectroShop`,
            text: `Hola ${pedido.cliente},\n\nAdjuntamos la factura electrónica de tu compra con código ${pedido.codigo} por un monto de C$ ${pedido.total}.\n\nGracias por confiar en ElectroShop.`,
            attachments: [
                {
                    filename: `factura-${pedido.codigo}.pdf`,
                    content: pdfBuffer
                }
            ]
        });
    } else {
        console.log(`[SIMULACIÓN] Correo enviado a ${email} con la factura del pedido ${pedido.codigo}`);
        infoMessage = `Simulación exitosa: Factura enviada al correo ${email}. (Para envío real, instala 'nodemailer' y configura las credenciales SMTP en el archivo .env)`;
    }

    res.json({ success: true, message: infoMessage });
}));

module.exports = router;
