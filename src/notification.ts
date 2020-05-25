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
    slack.postMessage('')
    return
  } catch (e) {
    throw new NotificationError(e)
  }
}
