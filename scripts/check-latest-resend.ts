import fetch from 'node-fetch';
import { config } from 'dotenv';
config();

async function checkStatus() {
    const apiKey = process.env.RESEND_API_KEY;

    try {
        const res = await fetch(`https://api.resend.com/emails`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        const data = await res.json();

        console.log('--- RECENT EMAILS ---');
        data.data.slice(0, 5).forEach(email => {
            console.log(`To: ${email.to}`);
            console.log(`From: ${email.from}`);
            console.log(`Subject: ${email.subject}`);
            console.log(`Status: ${email.last_event}`);
            console.log(`Created: ${email.created_at}`);
            console.log('---------------------');
        });
    } catch (err) {
        console.error(err);
    }
}
checkStatus();
