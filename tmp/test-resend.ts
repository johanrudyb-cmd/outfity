import 'dotenv/config';
import { sendEmail } from '../lib/resend-mail';

async function test() {
    const key = process.env.RESEND_API_KEY;
    console.log("Testing Resend with key:", key ? (key.slice(0, 5) + "..." + key.slice(-5)) : "UNDEFINED");
    const result = await sendEmail({
        to: 'johanrudy.dev@gmail.com', // test recipient
        subject: 'Test connection',
        html: '<p>Test</p>'
    });
    console.log("Result:", result);
}

test();
