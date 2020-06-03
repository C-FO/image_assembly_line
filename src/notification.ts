import {NotificationError} from './error'
import * as slack from './slack'
import {BuildAction} from './types'

export function notifyVulnerability(): void {
  try {
    // slack.postMessage()
    return
    // eslint-disable-next-line no-unreachable
  } catch (e) {
    throw new NotificationError(e)
  }
}

/*
 *
 */
export async function notifyBuildFailed(build: BuildAction): Promise<void> {
  slack.postBuildFailed(build)
}
