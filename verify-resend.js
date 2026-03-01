
import { sendEmail } from './lib/resend-mail';
import { getTemplates } from './lib/email-templates';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    const email = process.argv[2];
    if (!email) {
        console.error('Usage: node verify-resend.js user@example.com');
        process.exit(1);
    }

    console.log('--- TESTING RESEND WITH SIGNUP TEMPLATE ---');
    console.log('Target:', email);

    const result = await sendEmail({
        to: email,
        subject: 'OUTFITY — Test Inscription',
        html: getTemplates.emailVerification('Test User', 'http://localhost:3000/auth/verify-email?token=test&email=' + email),
    });

    console.log('RESULT:', JSON.stringify(result, null, 2));
}

run();
