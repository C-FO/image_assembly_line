import * as api from '@slack/web-api'
import * as types from '@slack/types'
import {BuildAction, CVE} from './types'
import * as core from '@actions/core'

const client = new api.WebClient(process.env.SLACK_BOT_TOKEN)
enum Color {
  Danger = '#b22222',
  Good = 'good'
}

export async function postBuildFailed(
  build: BuildAction
): Promise<api.WebAPICallResult> {
  const attachments = [failedAttachment(build)]
  const channel = process.env.SLACK_CONTAINERS_NOTIFICATION
  return exports.postMessage(
    channel,
    `<${build.githubRepositoryURL}|${build.repository}> のビルドに失敗しました`,
    attachments
  )
}

export function failedAttachment(build: BuildAction): types.MessageAttachment {
  const repositoryBlock: types.SectionBlock = {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*Action:* <${build.runURL}|${build.repository}>\n*Workflow:* ${build.workflow}\n`
    }
  }

  return {
    color: Color.Danger,
    blocks: [repositoryBlock]
  }
}

export async function postVulnerability(
  imageName: string,
  target: string,
  cve: CVE
): Promise<api.WebAPICallResult> {
  if (!process.env.SLACK_TRIVY_ALERT) {
    throw new Error('No channel to post.')
  }
  const channel: string = process.env.SLACK_TRIVY_ALERT
  core.debug(`Channel: ${channel}`)

  const attachment = {
    color: Color.Danger,
    fields: [
      {
        title: 'Image Name',
        value: imageName,
        short: true
      },
      {
        title: 'Target',
        value: target,
        short: true
      },
      {
        title: 'Package Name',
        value: cve.PkgName,
        short: true
      },
      {
        title: 'CVE',
        value: cve.VulnerabilityID,
        short: true
      },
      {
        title: 'Severity',
        value: cve.Severity,
        short: true
      },
      {
        title: 'Installed Version',
        value: `"${cve.InstalledVersion}"`,
        short: true
      },
      {
        title: 'Fixed Version',
        value: `"${cve.FixedVersion}"`,
        short: true
      }
    ]
  } as types.MessageAttachment

  const message = 'ビルドされた Docker イメージに脆弱性が見つかりました。'
  return postMessage(channel, message, [attachment])
}

export async function postMessage(
  channel: string,
  message: string,
  attachments?: types.MessageAttachment[]
): Promise<api.WebAPICallResult> {
  const args: api.ChatPostMessageArguments = {
    channel,
    text: message,
    mrkdwn: true,
    attachments
  }

  return client.chat.postMessage(args)
}
