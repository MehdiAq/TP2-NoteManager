import { INote } from './INote';

export interface ISearchEngine {
  search(notes: INote[], query: string): INote[];
  searchByTag(notes: INote[], tag: string): INote[];
  searchByTitle(notes: INote[], title: string): INote[];
  searchByContent(notes: INote[], content: string): INote[];
}
