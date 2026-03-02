import fetch from 'node-fetch';
import { config } from 'dotenv';
config();

async function checkStatus() {
    const messageId = '225e0c35-fc56-4b80-b4da-abe785709edb';
    const apiKey = process.env.RESEND_API_KEY;

    try {
        const res = await fetch(`https://api.resend.com/emails/${messageId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        const data = await res.json();
        console.log(`ID: ${data.id}`);
        console.log(`Status: ${data.last_event}`);
        console.log(`Created: ${data.created_at}`);
        if (data.last_event === 'bounced') {
            console.log('Reason: Bounced, likely due to sender verification mismatch or spam block');
        }
    } catch (err) {
        console.error(err);
    }
}
checkStatus();
