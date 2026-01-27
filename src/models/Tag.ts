export class Tag {
  private name: string;

  constructor(name: string) {
    this.name = name.trim();
  }

  public getName(): string {
    return this.name;
  }

  public equals(other: Tag | string): boolean {
    const otherName = typeof other === 'string' ? other : other.getName();
    return this.name.toLowerCase() === otherName.toLowerCase();
  }

  public toString(): string {
    return this.name;
  }

  public static fromArray(tags: string[]): Tag[] {
    return tags.map(tag => new Tag(tag));
  }

  public static toStringArray(tags: Tag[]): string[] {
    return tags.map(tag => tag.getName());
  }
}
