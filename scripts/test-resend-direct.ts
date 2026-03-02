import { sendEmail } from '../lib/resend-mail';
import { getTemplates } from '../lib/email-templates';
import { config } from 'dotenv';
config();

async function main() {
    const email = 'joada22@icloud.com'; // Or an email the user used, let's try a common test address or ask the user.
    const name = 'Test User';
    const verificationUrl = 'https://outfity.fr/auth/verify-email?token=test1234';

    console.log(`Sending email to ${email}...`);

    // Test 1: Using no-reply@send.outfity.fr
    const result1 = await sendEmail({
        to: email,
        subject: 'OUTFITY — Test Verification 1',
        html: getTemplates.emailVerification(name, verificationUrl),
    });

    console.log('Result 1:', result1);
}

main().catch(console.error);
