import fs from 'node:fs';

const property = process.env.AGENT_PROPERTY || '#0108';
const task = process.env.AGENT_TASK || '';

if (property !== '#0108' && property !== 'video') {
  console.log(JSON.stringify({ ok: true, state: 'silent', reason: 'property_not_invoked' }));
  process.exit(0);
}

const activation = {
  property: '#0108',
  name: 'Video Agent',
  owner: '@Seif',
  state: 'active',
  task,
  approval_required_for_consequential_actions: true,
  action_authority: '@Seif'
};

fs.mkdirSync('logs', { recursive: true });
fs.writeFileSync('logs/video-agent.json', JSON.stringify(activation, null, 2));
console.log(JSON.stringify(activation));
