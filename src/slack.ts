import * as api from '@slack/web-api'
import * as types from '@slack/types'
import {Repository, VulnerabilityIssue} from './types'
import * as core from '@actions/core'

const client = new api.WebClient(process.env.SLACK_BOT_TOKEN)
enum Color {
  Danger = 'danger',
  Good = 'good'
}

export async function postBuildFailed(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  repository: Repository,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  actionID: string
): Promise<void> {
  const attachments = {color: Color.Danger} as types.MessageAttachment
  exports.postMessage('ビルドに失敗しました', attachments)
}

export async function postVulnerability(
  issue: VulnerabilityIssue
): Promise<void> {
  if (!process.env.SLACK_TRIVY_ALERT) {
    throw new Error('No Channel to post.')
  }
  const channel: string = process.env.SLACK_TRIVY_ALERT
  core.debug(issue.name)
  postMessage(channel, 'Security Issue が発生しました', [{}])
}

export async function postMessage(
  channel: string,
  message: string,
  attachments?: types.MessageAttachment[]
): Promise<api.WebAPICallResult> {
  const args = {
    channel,
    text: message,
    mrkdwn: true,
    attachments
  } as api.ChatPostMessageArguments

  return client.chat.postMessage(args)
}
