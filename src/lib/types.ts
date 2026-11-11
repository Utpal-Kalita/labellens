export interface Experiment {
  id: string;
  name: string;
  objective: string;
  product_category: string;
  description: string;
  participant_target: number;
  status: string;
  created_at: string;
  packaging_count?: number;
  task_count?: number;
  completed_sessions?: number;
}
export interface Packaging {
  id: string;
  experiment_id: string;
  variant_name: string;
  image_path: string;
}
export type AnswerType = 'multiple_choice' | 'numeric' | 'short_text';
export interface Task {
  id: string;
  experiment_id: string;
  packaging_id: string | null;
  title: string;
  instruction: string;
  expected_answer: string;
  answer_type: AnswerType;
  options: string; // JSON array
  time_limit_s: number;
  sort_order: number;
}
export interface SessionInfo {
  sessionId: string;
  participantId: string;
  code: string;
  variantOrder: string[];
}
export interface Measurement {
  timestamp: string; // ISO
  pulse: number | null;
  hrvRmssd: number | null;
  expression: string | null;
  expressionConfidence: number | null;
  blinking: boolean | null;
  talking: boolean | null;
  signalQuality: string | null;
}
export interface MeasurementRow extends Measurement {
  id: string;
  session_id: string;
  response_id: string | null;
  phase: string;
  source: string;
}
export interface ResponseRecord {
  id: string;
  session_id: string;
  task_id: string;
  packaging_id: string | null;
  answer: string;
  is_correct: number | null;
  started_at: string;
  completed_at: string;
  completion_time_ms: number | null;
  difficulty_rating: number | null;
  difficulty_note: string;
  task_title?: string;
  variant_name?: string;
}
export interface SessionRow {
  id: string;
  participant_id: string;
  variant_order: string;
  start_time: string;
  end_time: string | null;
  status: string;
  anonymous_code?: string;
}
