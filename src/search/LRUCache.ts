import { INote } from '../interfaces/INote';

export class LRUCache {
  private cache: Map<string, INote[]> = new Map();

  constructor(private readonly maxSize: number) {}

  get(key: string): INote[] | undefined {
    return this.cache.get(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  set(key: string, value: INote[]): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}
