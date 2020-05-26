import {NotificationError} from './error'
import * as slack from './slack'

/**
 * image の push が終わったらそれについて notification を行う
 * まずは slack への通知を想定するが、Workflow によって issue を作るなど動作を変更可能にする
 * usage:
 * ```
 * import * as notification from './notification'
 * notification.notityImagePushed()
 * ```
 *
 * notification が失敗すると業務的に困るので error を throw する
 */
export function notifyImagePushed(): void {
  try {
<<<<<<< HEAD
    slack.postMessage()
=======
    slack.postMessage('')
>>>>>>> 4efd417434370502695ac080a0f6710dc2bec0b0
    return
  } catch (e) {
    throw new NotificationError(e)
  }
}

export async function notifyImageBuildFailed(): Promise<void> {
  slack.postBuildFailed()
  return
}
