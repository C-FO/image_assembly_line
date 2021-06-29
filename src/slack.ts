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

export async function postReadyToDeploy(
  build: BuildAction,
  imageName: string,
  buildTime: string,
  tags: string | undefined
): Promise<api.WebAPICallResult> {
  const attachments = [
    buildMessageForDeploy(imageName, buildTime, tags, build.repository)
  ]
  const channel = process.env.SLACK_CICD_NOTIFICATION_TEST

  return exports.postMessage(
    channel,
    `<${build.githubRepositoryURL}|${build.repository}> のビルドに成功しました`,
    attachments
  )
}

export function buildMessageForDeploy(
  imageName: string,
  buildTime: string,
  tags: string | undefined,
  repo: string | undefined
): types.MessageAttachment {
  const repositoryBlock = {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'plain_text',
          text: `image-name: ${imageName} build-time: ${buildTime}\ntag: [${tags}] repo: ${repo}`,
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'plain_text',
          text: 'デプロイしますか？',
          emoji: true
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'デプロイへ',
              emoji: true
            },
            value: `${repo}::${imageName}::${tags}`,
            // eslint-disable-next-line @typescript-eslint/camelcase
            action_id: 'ready_to_deploy'
          }
        ]
      }
    ]
  }

  return {
    color: Color.Good,
    blocks: repositoryBlock.blocks
  }
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
  const channel: string = selectChannel(imageName)
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

export async function selectChannel(
  imageName: string
): string {
  // mapの宣言
  var productmap = new Map();

  // 引っ掛けるためのproduct name
  var products = [
    'launch',
    'wolf',
    'ocean',
    'nest-auth',
    'card',
    'goat',
    'mynumber',
    'benefit',
    'cfoalpha-app',
    'ohmu',
    'jigsaw',
    'deal-platform',
    'javelin',
    'ai-lab',
    'convoy',
    'freee-payroll',
    'freee-pm',
    'freee-ctax',
    'freee-accounts',
    'calc',
    'freee-rrweb',
    'ebis',
    'freee-auth',
    'freee-app-store',
    'freee-tax-operation'
  ]
  // image name と対にするchannelID
  var channelIds = [
    'C014FCEJ1DL',
    'C01SURYA4A3',
    'C01T6FHVC7P',
    'C01TN7TND4Z',
    'C01T9LHR7PD',
    'C01T2R4A3UN',
    'C01U61WJX9T',
    'C01T9K6LTU3',
    'C0217FZ1B1N',
    'C015Z5YR3FX',
    'C01TFPTSD7W',
    'C01T9J5QR6W',
    'C01TN7G69GR',
    'C01T2NJRA4W',
    'C01P89JU0BZ',
    'C014AUKCZ50',
    'C014AUKCZ50',
    'CAX1NQNAK',
    'CU8BQ3WAK',
    'C01T9QJT6Q3',
    'C0240AGKPQE',
    'C0137P1TJ5A',
    'CU8BPSFAB',
    'CDHQA8Z4J',
    'CA3UUQRHN'
  ]

  // mapへの登録
  for (var _i = 0; _i < products.length; _i++) {
    var product = products[_i];
    var channelid = channelIds[_i];
    productmap.set(product, channelid)
  }

  // プロダクト名が定義されているか
  var channel = null
  for (var key of productmap.keys()) {
    if imageName.includes(productmap.get(key)) {
      channel = productmap.get(key)
      break;
    }
  }

  // 当てはまるものがなかった場合はtrivy_alertに投げる(例外的な奴)
  if (!channel) {
    channel = process.env.SLACK_TRIVY_ALERT
  }

  // channlIDを返す
  return channel
}