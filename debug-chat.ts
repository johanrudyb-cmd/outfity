
import { checkAIUsageLimit, recordAIUsage } from './lib/ai-usage';

async function test() {
  try {
    const res = await checkAIUsageLimit('user-id', 'creator', 'assistant_chat_qa');
    console.log('CHECK:', res);
  } catch (err) {
    console.error('ERROR:', err);
  }
}
test();

