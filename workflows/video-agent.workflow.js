import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const property = process.env.AGENT_PROPERTY || '#0108';
const task = process.env.AGENT_TASK || 'Video Factory acceptance render';

if (property !== '#0108' && property !== 'video') {
  console.log(JSON.stringify({ ok: true, state: 'silent', reason: 'property_not_invoked' }));
  process.exit(0);
}

const durationInput = Number(process.env.VIDEO_DURATION_SECONDS || '3');
const durationSeconds = Number.isFinite(durationInput)
  ? Math.min(30, Math.max(1, durationInput))
  : 3;

const artifactDir = path.resolve(process.env.VIDEO_ARTIFACT_DIR || 'artifacts/video-factory');
const requestedOutput = process.env.VIDEO_OUTPUT_PATH;
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputPath = path.resolve(requestedOutput || path.join(artifactDir, `video-agent-${timestamp}.mp4`));
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.mkdirSync(artifactDir, { recursive: true });
fs.mkdirSync('logs', { recursive: true });

// Keep the first production slice input-driven without exposing the task to shell
// parsing. FFmpeg reads the display text from a file, so arbitrary task strings do
// not become command arguments. Later provider/render stages can replace this
// deterministic acceptance renderer while keeping the same artifact contract.
const displayTask = task.replace(/\s+/g, ' ').trim().slice(0, 80) || 'Video Factory render';
const taskFile = path.join(artifactDir, 'render-title.txt');
fs.writeFileSync(taskFile, displayTask, 'utf8');

const videoFilter = [
  `drawtext=textfile=${taskFile}`,
  'fontcolor=white',
  'fontsize=46',
  'box=1',
  'boxcolor=black@0.55',
  'boxborderw=24',
  'x=(w-text_w)/2',
  'y=(h-text_h)/2'
].join(':');

const args = [
  '-hide_banner',
  '-loglevel', 'error',
  '-y',
  '-f', 'lavfi',
  '-i', 'testsrc2=size=1280x720:rate=30',
  '-f', 'lavfi',
  '-i', 'sine=frequency=880:sample_rate=48000',
  '-t', String(durationSeconds),
  '-vf', videoFilter,
  '-c:v', 'libx264',
  '-preset', 'veryfast',
  '-pix_fmt', 'yuv420p',
  '-c:a', 'aac',
  '-b:a', '128k',
  '-shortest',
  '-movflags', '+faststart',
  outputPath
];

const render = spawnSync(ffmpeg, args, { encoding: 'utf8' });

if (render.error) {
  const report = {
    ok: false,
    property: '#0108',
    name: 'Video Agent',
    state: 'blocked',
    reason: render.error.code === 'ENOENT' ? 'ffmpeg_not_available' : 'ffmpeg_spawn_failed',
    error: render.error.message,
    task
  };
  fs.writeFileSync('logs/video-agent.json', JSON.stringify(report, null, 2));
  console.error(JSON.stringify(report));
  process.exit(2);
}

if (render.status !== 0) {
  const report = {
    ok: false,
    property: '#0108',
    name: 'Video Agent',
    state: 'failed',
    reason: 'ffmpeg_render_failed',
    exit_code: render.status,
    stderr: render.stderr?.trim() || '',
    task
  };
  fs.writeFileSync('logs/video-agent.json', JSON.stringify(report, null, 2));
  console.error(JSON.stringify(report));
  process.exit(render.status || 1);
}

const stat = fs.statSync(outputPath);
const header = Buffer.alloc(16);
const fd = fs.openSync(outputPath, 'r');
fs.readSync(fd, header, 0, header.length, 0);
fs.closeSync(fd);

const hasMp4Signature = header.toString('latin1').includes('ftyp');
if (stat.size < 10_000 || !hasMp4Signature) {
  const report = {
    ok: false,
    property: '#0108',
    name: 'Video Agent',
    state: 'failed',
    reason: 'invalid_video_artifact',
    artifact: outputPath,
    bytes: stat.size,
    mp4_signature: hasMp4Signature,
    task
  };
  fs.writeFileSync('logs/video-agent.json', JSON.stringify(report, null, 2));
  console.error(JSON.stringify(report));
  process.exit(3);
}

const activation = {
  ok: true,
  property: '#0108',
  name: 'Video Agent',
  owner: '@Seif',
  state: 'rendered',
  task,
  rendered_title: displayTask,
  artifact: outputPath,
  content_type: 'video/mp4',
  bytes: stat.size,
  duration_seconds: durationSeconds,
  runtime: 'ffmpeg',
  input_driven: true,
  validation: {
    mp4_signature: true,
    minimum_size_bytes: 10_000,
    playable_media_probe_required_in_ci: true
  },
  approval_required_for_consequential_actions: true,
  action_authority: '@Seif'
};

fs.writeFileSync('logs/video-agent.json', JSON.stringify(activation, null, 2));
console.log(JSON.stringify(activation));
