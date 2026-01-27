export interface INoteData {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface INote {
  getId(): string;
  getTitle(): string;
  getContent(): string;
  getTags(): string[];
  getCreatedAt(): Date;
  getUpdatedAt(): Date;
  setTitle(title: string): void;
  setContent(content: string): void;
  addTag(tag: string): void;
  removeTag(tag: string): void;
  setTags(tags: string[]): void;
  hasTag(tag: string): boolean;
  matches(query: string): boolean;
  toJSON(): INoteData;
}
