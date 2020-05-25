import {App} from '@slack/bolt'
import * as core from '@actions/core'

function app(): App {
  return new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET
  })
}

export async function postMessage(message: string): Promise<void> {
  app()
  core.debug(message)
}
