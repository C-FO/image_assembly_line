import * as slack from '../src/slack'
import * as types from '@slack/types'
import {BuildAction} from '../src/types'

if (!process.env.SLACK_CICD_NOTIFICATION_TEST) {
  throw new Error('')
}
const channel = process.env.SLACK_CICD_NOTIFICATION_TEST

describe('postMessage', () => {
  test('post simple message', async () => {
    const result = await slack.postMessage(channel, 'test message')

    expect(result.ok).toBe(true)
    expect(result.channel).toBe(channel)
  })

  test('post message with attachment', async () => {
    const attachment = {
      color: 'danger',
      title: 'ATTACHMENT TITLE',
      fields: [
        {type: 'mrkdwn', title: 'field1', value: '*val1*'},
        {title: 'field2', value: 'val2'},
        {title: 'field3', value: 'val3'},
        {title: 'field4', value: 'val4'}
      ]
    } as types.MessageAttachment

    const result = await slack.postMessage(channel, '*test message*', [
      attachment
    ])

    const message = result.message as any
    expect(result.ok).toBe(true)
    expect(message.attachments).toHaveLength(1)
  })
})

describe('postBuildFailed()', () => {
  test('post message with attachment', async () => {
    const build = new BuildAction({
      repository: 'C-FO/image_assembly_line',
      workflow: 'workflow1',
      commitSHA: '123acf98',
      runID: '987654321'
    })

    const result = await slack.postBuildFailed(build)
    expect(result.ok).toBe(true)

    const message = result.message as any
    expect(message.text).toBe(
      `<${build.githubRepositoryURL}|${build.repository}> のビルドに失敗しました`
    )
  })
})
