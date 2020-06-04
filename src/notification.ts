import {Vulnerability, BuildAction} from './types'
import {NotificationError} from './error'
import * as slack from './slack'

export function notifyVulnerability(
  imageName: string,
  vulnerabilities: Vulnerability[]
): void {
  try {
    for (const result of vulnerabilities) {
      if (result.Vulnerabilities != null) {
        for (const vulnerability of result.Vulnerabilities) {
          slack.postVulnerability(imageName, result.Target, vulnerability)
        }
      }
    }
    return
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
