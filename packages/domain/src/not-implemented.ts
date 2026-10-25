export class NotImplemented extends Error {
  readonly code = 'not_implemented' as const;

  constructor(feature: string) {
    super(`${feature} is not implemented`);
    this.name = 'NotImplemented';
  }
}
