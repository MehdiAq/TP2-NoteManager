import { INote } from './INote';

export interface IStorage {
  load(): INote[];
  save(notes: INote[]): void;
  export(path: string, notes: INote[]): void;
  import(path: string): INote[];
}
