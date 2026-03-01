
import { sendEmail } from './lib/resend-mail';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    const result = await sendEmail({
        to: 'johan.biango@gmail.com',
        subject: 'VERIFICATION DE L\'EXPEDITEUR',
        html: '<h1>TEST</h1><p>Si ce mail arrive, c\'est que send@outfity.fr est OK.</p>',
    });
    console.log(JSON.stringify(result, null, 2));
}

run();
