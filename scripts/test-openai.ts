import 'dotenv/config';
import { generateChat } from '../lib/api/chatgpt';

async function test() {
    try {
        const reply = await generateChat(
            'Tu es une IA très serviable.',
            [{ role: 'user', content: 'Bonjour !' }],
            { model: 'gpt-4o-mini' }
        );
        console.log('SUCCESS:', reply);
    } catch (err) {
        console.error('ERROR:', err);
    }
}

test();
