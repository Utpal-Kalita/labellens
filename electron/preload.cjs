// LabelLens preload: SmartSpectra bridge + local DB API.
// contextIsolation is on; the renderer only sees window.labellens and the
// official SmartSpectra bridge (window.smartspectra / its MessagePort flow).
require('@smartspectra/node-sdk/preload');
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('labellens', {
  createExperiment: (exp) => ipcRenderer.invoke('exp:create', exp),
  listExperiments: () => ipcRenderer.invoke('exp:list'),
  getExperiment: (id) => ipcRenderer.invoke('exp:get', id),
  deleteExperiment: (id) => ipcRenderer.invoke('exp:delete', id),
  defaultTasks: () => ipcRenderer.invoke('exp:defaults'),

  addPackaging: (args) => ipcRenderer.invoke('pack:add', args),
  deletePackaging: (id) => ipcRenderer.invoke('pack:delete', id),
  getPackagingImage: (id) => ipcRenderer.invoke('pack:image', id),

  addTask: (t) => ipcRenderer.invoke('task:add', t),
  deleteTask: (id) => ipcRenderer.invoke('task:delete', id),

  startSession: (experimentId, mode) => ipcRenderer.invoke('session:start', { experimentId, mode }),
  recordConsent: (args) => ipcRenderer.invoke('session:consent', args),
  completeSession: (args) => ipcRenderer.invoke('session:complete', args),
  abandonSession: (args) => ipcRenderer.invoke('session:abandon', args),

  recordResponse: (r) => ipcRenderer.invoke('resp:record', r),
  recordMeasurements: (batch) => ipcRenderer.invoke('meas:batch', batch),
  assignMeasurements: (sessionId, responseId, sinceIso) => ipcRenderer.invoke('meas:assign', { sessionId, responseId, sinceIso }),
  recordBaseline: (b) => ipcRenderer.invoke('baseline:record', b),
  getBaseline: (sessionId) => ipcRenderer.invoke('baseline:get', sessionId),

  experimentAnalytics: (args) => ipcRenderer.invoke('analytics:experiment', args),
  sessionTimeline: (args) => ipcRenderer.invoke('analytics:timeline', args),
  listSessions: (experimentId) => ipcRenderer.invoke('session:listForExperiment', experimentId),
  sessionResponses: (sessionId) => ipcRenderer.invoke('session:responses', sessionId),

  deleteSessionData: (sessionId) => ipcRenderer.invoke('privacy:deleteSession', sessionId),

  // API key is supplied by the user on first run and stored only in
  // localStorage on this machine — never sent anywhere except to the
  // SmartSpectra SDK itself.
});
