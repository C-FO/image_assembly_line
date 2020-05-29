import {NotificationError} from './error'

export function notifyVulnerability(): void {
  try {
    // slack.postMessage()
    return
    // eslint-disable-next-line no-unreachable
  } catch (e) {
    throw new NotificationError(e)
  }
}
