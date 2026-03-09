
import { recordAIUsage } from './lib/ai-usage';

async function test() {
  try {
    const res = await recordAIUsage('some_user_uuid_here', 'assistant_chat_qa', { brandId: 'test' });
    console.log('RECORD:', res);
  } catch (err) {
    console.error('ERROR:', err);
  }
}
test();

