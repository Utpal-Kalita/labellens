import type { Experiment, Packaging, Task, SessionInfo, Measurement, MeasurementRow, ResponseRecord, SessionRow } from './types';

declare global {
  interface Window { labellens?: any; }
}

const L = () => {
  if (!window.labellens) throw new Error('LabelLens desktop bridge unavailable — run inside the Electron app.');
  return window.labellens;
};

export const api = {
  createExperiment: (exp: Partial<Experiment> & { name: string }): Promise<{ id: string }> => L().createExperiment(exp),
  listExperiments: (): Promise<Experiment[]> => L().listExperiments(),
  getExperiment: (id: string): Promise<{ experiment: Experiment; packaging: Packaging[]; tasks: Task[] }> => L().getExperiment(id),
  deleteExperiment: (id: string) => L().deleteExperiment(id),
  defaultTasks: (): Promise<Array<{ title: string; instruction: string; answer_type: string; options: string[] }>> => L().defaultTasks(),
  addPackaging: (args: { experimentId: string; variantName: string; dataUrl: string }) => L().addPackaging(args),
  deletePackaging: (id: string) => L().deletePackaging(id),
  getPackagingImage: (id: string): Promise<string | null> => L().getPackagingImage(id),
  addTask: (t: any) => L().addTask(t),
  deleteTask: (id: string) => L().deleteTask(id),
  startSession: (experimentId: string): Promise<SessionInfo> => L().startSession({ experimentId }),
  recordConsent: (participantId: string) => L().recordConsent({ participantId }),
  completeSession: (sessionId: string) => L().completeSession({ sessionId }),
  abandonSession: (sessionId: string) => L().abandonSession({ sessionId }),
  recordResponse: (r: any): Promise<{ id: string }> => L().recordResponse(r),
  recordMeasurements: (sessionId: string, responseId: string | null, phase: string, source: string, rows: Measurement[]) =>
    L().recordMeasurements({ sessionId, responseId, phase, source, rows }),
  assignMeasurements: (sessionId: string, responseId: string, sinceIso: string) => L().assignMeasurements(sessionId, responseId, sinceIso),
  recordBaseline: (b: any) => L().recordBaseline(b),
  getBaseline: (sessionId: string) => L().getBaseline(sessionId),
  experimentAnalytics: (id: string): Promise<{ sessions: SessionRow[]; responses: ResponseRecord[]; measStats: any }> => L().experimentAnalytics(id),
  sessionTimeline: (sessionId: string, responseId?: string): Promise<MeasurementRow[]> => L().sessionTimeline({ sessionId, responseId }),
  listSessions: (experimentId: string): Promise<SessionRow[]> => L().listSessions(experimentId),
  sessionResponses: (sessionId: string): Promise<ResponseRecord[]> => L().sessionResponses(sessionId),
  deleteSessionData: (sessionId: string) => L().deleteSessionData(sessionId),
};
