
const dotenv = require('dotenv');
dotenv.config();

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_API_URL = 'https://api.resend.com/emails';

async function sendTest(email) {
    console.log('--- TEST RESEND DIRECT FETCH ---');
    console.log('To:', email);
    console.log('From:', 'OUTFITY <send@outfity.fr>');

    const res = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: 'OUTFITY <send@outfity.fr>',
            to: [email],
            subject: 'VERIFICATION DIRECTE',
            html: '<h1>TEST</h1><p>Envoi direct via fetch.</p>'
        }),
    });

    const data = await res.json();
    console.log('STATUS:', res.status);
    console.log('RESULT:', JSON.stringify(data, null, 2));
}

sendTest('johan.biango@gmail.com');
