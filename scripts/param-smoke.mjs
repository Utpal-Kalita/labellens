// param-smoke.mjs — probe which frame params sustain the SDK (error 14 hunt)
import { SmartSpectraSDK, FrameTransform, PixelFormat, faceMetrics, cardioMetrics, breathingMetrics, SmartSpectraLogLevel } from '@smartspectra/node-sdk';
import fs from 'node:fs';
const apiKey = fs.readFileSync(process.env.SMARTSPECTRA_KEY_FILE, 'utf8').trim();
const [mode, W, H, FPS, SECONDS] = [process.argv[2]||'face', +process.argv[3]||320, +process.argv[4]||240, +process.argv[5]||30, +process.argv[6]||15];
const metrics = mode==='face' ? faceMetrics : mode==='cardio' ? cardioMetrics : mode==='all' ? [...faceMetrics, ...cardioMetrics] : breathingMetrics;
const frame = Buffer.alloc(W*H*3); for (let i=0;i<W*H;i++){frame[i*3]=i%251;frame[i*3+1]=(i*7)%253;frame[i*3+2]=(i*13)%255;}
const errs=[]; let metricCount=0, valCount=0;
const sdk = new SmartSpectraSDK({ apiKey, requestedMetrics: metrics, logLevel: SmartSpectraLogLevel.kError });
sdk.on('metrics', ()=>metricCount++);
sdk.on('validationStatus', ()=>valCount++);
sdk.on('error', (c,m,r)=>{ errs.push(c); console.log('[error]',c,m); });
sdk.useCustomInput(FrameTransform.kNone);
sdk.start();
const t0=process.hrtime.bigint(); let sent=0, died=false;
await new Promise((resolve)=>{
  const timer=setInterval(()=>{
    const el=Number(process.hrtime.bigint()-t0)/1e9;
    if(el>=SECONDS||died){clearInterval(timer);resolve();return;}
    try{ sdk.sendFrame(frame,W,H,W*3,PixelFormat.kRGB,process.hrtime.bigint()/1000n); sent++; }
    catch(e){ died=true; }
  },1000/FPS);
});
const actualFps=(sent/(Number(process.hrtime.bigint()-t0)/1e9)).toFixed(1);
try{ await sdk.stopAsync(); }catch{}
try{ await sdk.destroy(); }catch{}
console.log(`RESULT mode=${mode} ${W}x${H}@${FPS}fps sent=${sent} actualFps=${actualFps} metrics=${metricCount} validations=${valCount} errors=${JSON.stringify(errs)} sustained=${!errs.includes(14)}`);
