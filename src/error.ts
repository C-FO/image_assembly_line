export class BaseError extends Error {
  constructor(e?: string) {
    super(e)
    this.name = new.target.name
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class BuildError extends BaseError {}

export class ScanError extends BaseError {}

export class PushError extends BaseError {}

export class NotificationError extends BaseError {}
