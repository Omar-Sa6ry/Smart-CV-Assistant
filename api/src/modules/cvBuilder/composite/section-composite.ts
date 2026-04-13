import { ICvComponent } from '../interfaces/ICvComponent.intrface';

export class CvItem implements ICvComponent {
  constructor(
    private name: string,
    private data: any,
  ) {}

  getName(): string {
    return this.name;
  }

  render(): any {
    return this.data;
  }
}

export class CvSection implements ICvComponent {
  private children: ICvComponent[] = [];

  constructor(private name: string) {}

  getName(): string {
    return this.name;
  }

  add(component: ICvComponent): void {
    this.children.push(component);
  }

  remove(component: ICvComponent): void {
    const index = this.children.indexOf(component);
    if (index !== -1) {
      this.children.splice(index, 1);
    }
  }

  render(): any {
    return {
      section: this.name,
      items: this.children.map((child) => child.render()),
    };
  }
}
