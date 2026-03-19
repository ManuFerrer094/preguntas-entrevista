export interface Question {
  title: string;
  difficulty: string;
  tags: string[];
  body: string;
}

export interface Segment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
}
