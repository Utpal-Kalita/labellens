// feed-face.mjs — feed a GENERATED (fictional-person) face image with subtle
// per-frame motion through the real SmartSpectra SDK at 30fps.
// Purpose: prove genuine SDK face processing (landmarks / expression / blinking
// decode) in a headless environment. Input is an AI-generated static face with
// synthetic jitter — physiological readings (pulse) are NOT expected from a
// still image and any value produced would be an artifact, not a measurement.
import { SmartSpectraSDK, FrameTransform, PixelFormat, faceMetrics, cardioMetrics, SmartSpectraLogLevel } from '@smartspectra/node-sdk';
import { decodeMetrics } from '@smartspectra/node-sdk/messages';
import fs from 'node:fs';
const apiKey = fs.readFileSync(process.env.SMARTSPECTRA_KEY_FILE, 'utf8').trim();
const W=640,H=480,FPS=30,SECONDS=35;
const base = fs.readFileSync('test-assets/face-640x480.rgb');
const out = {metricsEvents:0, landmarks:0, expressions:[], blinks:0, pulseValues:[], validations:{}, errors:[]};
const sdk = new SmartSpectraSDK({ apiKey, requestedMetrics:[...faceMetrics,...cardioMetrics], logLevel: SmartSpectraLogLevel.kError });
sdk.on('metrics',(buf,ts)=>{
  out.metricsEvents++;
  const m = decodeMetrics(buf);
  if (Buffer.isBuffer(m)) return;
  const lm = m.face?.landmarks?.at(-1); if (lm?.value?.length) out.landmarks++;
  const ex = m.face?.expression?.at(-1);
  if (ex?.scores?.length) {
    const top = ex.scores.reduce((a,b)=> (b.confidence > a.confidence ? b : a));
    if (out.expressions.length < 8) out.expressions.push({t:ex.timestamp, top: top.type ?? top.expressionType, conf: +(top.confidence?.toFixed?.(3))});
  }
  if (m.face?.blinking?.at(-1)?.detected) out.blinks++;
  const pr = m.cardio?.pulseRate?.at(-1);
  if (pr && pr.value !== undefined) out.pulseValues.push(+pr.value.toFixed(1));
});
sdk.on('validationStatus',(c)=>{ out.validations[c]=(out.validations[c]||0)+1; });
sdk.on('error',(c,m)=>{ out.errors.push({c,m}); console.log('[error]',c,m); });
sdk.useCustomInput(FrameTransform.kNone);
sdk.start();
const t0=process.hrtime.bigint();
let sent=0, died=false;
await new Promise((resolve)=>{
  const timer=setInterval(()=>{
    const el=Number(process.hrtime.bigint()-t0)/1e9;
    if(el>=SECONDS||died){clearInterval(timer);resolve();return;}
    // subtle synthetic motion: shift the image horizontally by -2..2 px sinusoidally
    const shift = Math.round(2*Math.sin(sent/15));
    const f = Buffer.allocUnsafe(base.length);
    for (let y=0;y<H;y++){
      const rowStart=y*W*3;
      const srcStart = rowStart + Math.max(0,-shift)*3;
      const dstStart = rowStart + Math.max(0,shift)*3;
      base.copy(f, dstStart, srcStart, srcStart + (W-Math.abs(shift))*3);
    }
    try{ sdk.sendFrame(f,W,H,W*3,PixelFormat.kRGB,process.hrtime.bigint()/1000n); sent++; }
    catch(e){ died=true; }
  },1000/FPS);
});
try{ await sdk.stopAsync(); }catch{}
try{ await sdk.destroy(); }catch{}
console.log('FACE TEST ' + JSON.stringify({sent, ...out, pulseValues: out.pulseValues.slice(0,10)}, null, 1));
