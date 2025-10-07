export interface FlexTemplate {
  [key: string]: unknown;
}

export interface GenerateFlexMessageRequest {
  type: 'GENERATE_FLEX_MESSAGE';
  prompt?: string;
  baseTemplate?: FlexTemplate | null;
}

export interface GenerateFlexMessageResponse {
  ok: boolean;
  error?: string;
  template?: FlexTemplate;
  prettyJson?: string;
}
