import { INote } from './INote';

export interface IRepository {
  add(note: INote): void;
  remove(id: string): boolean;
  findById(id: string): INote | undefined;
  findAll(): INote[];
  update(id: string, note: INote): boolean;
  clear(): void;
}
