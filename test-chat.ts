
import { generateChat } from './lib/api/chatgpt';

async function test() {
  try {
    const reply = await generateChat('System prompt', [{role: 'user', content: 'hello'}], { model: 'gpt-4o-mini' });
    console.log('REPLY:', reply);
  } catch (err) {
    console.error('ERROR:', err);
  }
}
test();

