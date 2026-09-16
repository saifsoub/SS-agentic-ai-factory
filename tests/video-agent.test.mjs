import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const output = path.resolve('artifacts/video-factory/acceptance-test.mp4');
fs.rmSync(output, { force: true });

const run = spawnSync(process.execPath, ['workflows/video-agent.workflow.js'], {
  encoding: 'utf8',
  env: {
    ...process.env,
    AGENT_PROPERTY: 'video',
    AGENT_TASK: 'CI acceptance: render a real playable MP4',
    VIDEO_DURATION_SECONDS: '1',
    VIDEO_OUTPUT_PATH: output
  }
});

if (run.status !== 0) {
  throw new Error(`video workflow failed (${run.status}): ${run.stderr || run.stdout}`);
}

if (!fs.existsSync(output)) {
  throw new Error('video workflow did not create an MP4 artifact');
}

const stat = fs.statSync(output);
if (stat.size < 10_000) {
  throw new Error(`video artifact is unexpectedly small: ${stat.size} bytes`);
}

const header = Buffer.alloc(16);
const fd = fs.openSync(output, 'r');
fs.readSync(fd, header, 0, header.length, 0);
fs.closeSync(fd);

if (!header.toString('latin1').includes('ftyp')) {
  throw new Error('video artifact does not contain an MP4 ftyp signature');
}

const probe = spawnSync(process.env.FFPROBE_PATH || 'ffprobe', [
  '-v', 'error',
  '-select_streams', 'v:0',
  '-show_entries', 'stream=codec_name,width,height,r_frame_rate',
  '-show_entries', 'format=duration,size',
  '-of', 'json',
  output
], { encoding: 'utf8' });

if (probe.status !== 0) {
  throw new Error(`ffprobe could not validate the generated MP4: ${probe.stderr}`);
}

const media = JSON.parse(probe.stdout);
const stream = media.streams?.[0];
const duration = Number(media.format?.duration || 0);

if (!stream || stream.codec_name !== 'h264' || stream.width !== 1280 || stream.height !== 720) {
  throw new Error(`unexpected video stream: ${JSON.stringify(stream)}`);
}

if (!(duration >= 0.9 && duration <= 1.2)) {
  throw new Error(`unexpected duration: ${duration}`);
}

console.log(JSON.stringify({
  ok: true,
  artifact: output,
  bytes: stat.size,
  codec: stream.codec_name,
  width: stream.width,
  height: stream.height,
  duration_seconds: duration
}));
