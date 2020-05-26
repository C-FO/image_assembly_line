import {App} from '@slack/bolt'
import * as core from '@actions/core'
import * as api from '@slack/web-api'
import * as types from '@slack/types'
import {Repository} from './types'
import {} from '@slack/web-api/dist/methods'

const client = new api.WebClient(process.env.SLACK_BOT_TOKEN)
enum Color {
  Danger = 'danger',
  Good = 'good'
}

enum Channel {
  CICD_CONTAINERS_DEV = 'CUSLUDWS2',
  CONTAINERS_NOTIFICATION = 'CTM72DVCJ'
}

export async function postBuildFailed(
  repository: Repository,
  actionID: string
): Promise<void> {
  const attachments = {color: Color.Danger} as types.MessageAttachment
  exports.postMessage('ビルドに失敗しました', attachments)
}

export async function postMessage(
  message: string,
  attachments: types.MessageAttachment[]
): Promise<void> {
  client.chat.postMessage({
    channel: Channel.CONTAINERS_NOTIFICATION,
    text: message,
    attachments
  })
}
