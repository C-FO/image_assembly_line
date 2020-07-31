import * as core from '@actions/core'
import Docker from './docker'
import {BuildError, ScanError, PushError} from './error'
import {setDelivery} from './deliver'
import * as notification from './notification'
import * as s3 from './s3'
import {BuildAction} from './types'
import Bugsnag from '@bugsnag/js'

async function run(): Promise<void> {
  const env = process.env
  const gitHubRepo = env.GITHUB_REPOSITORY
  const gitHubWorkflow = env.GITHUB_WORKFLOW
  const commitHash = env.GITHUB_SHA
  const gitHubRunID = env.GITHUB_RUN_ID
  const containerkojoEnv = env.CONTAINERKOJO_ENV
  const runNumber = env.GITHUB_RUN_NUMBER
  core.debug(`runNumber: ${runNumber}`)

  const thisAction = new BuildAction({
    repository: gitHubRepo,
    workflow: gitHubWorkflow,
    commitSHA: commitHash,
    runID: gitHubRunID
  })

  const bugsnagApiKey: string | undefined = env.BUGSNAG_API_KEY
  if (!bugsnagApiKey) {
    throw new Error('BUGSNAG_API_KEY not found.')
  }
  Bugsnag.start({
    apiKey: bugsnagApiKey,
    enabledReleaseStages: ['production'],
    appType: 'image_assembly_line',
    releaseStage: containerkojoEnv,
    metadata: {
      actionInformation: {
        repository: gitHubRepo,
        workflow: gitHubWorkflow,
        commitSHA: commitHash,
        runID: gitHubRunID,
        URL: `https://github.com/${gitHubRepo}/runs/${runNumber}`
      }
    }
  })
  const startTime = new Date() // UTC

  try {
    // REGISTRY_NAME はユーザー側から渡せない様にする
    const registry: string | undefined = env.REGISTRY_NAME
    if (!registry) {
      throw new Error('REGISTRY_NAME is not set.')
    }
    core.debug(registry)
    if (env.GITHUB_TOKEN) {
      core.setSecret(env.GITHUB_TOKEN)
    }

    const target = core.getInput('target')
    core.debug(`target: ${target}`)

    const imageName = core.getInput('image_name')
    core.debug(`image_name: ${imageName}`)

    if (!commitHash) {
      throw new Error('GITHUB_SHA not found.')
    }
    core.debug(`commit_hash: ${commitHash}`)

    const severityLevel = core.getInput('severity_level')
    core.debug(`severity_level: ${severityLevel.toString()}`)

    const scanExitCode = core.getInput('scan_exit_code')
    core.debug(`scan_exit_code: ${scanExitCode.toString()}`)

    const noPush = core.getInput('no_push')
    core.debug(`no_push: ${noPush.toString()}`)

    const docker = new Docker(registry, imageName, commitHash)
    core.debug(`docker: ${docker.toString()}`)

    await docker.build(target)

    await docker.scan(severityLevel, scanExitCode)

    if (docker.builtImage && gitHubRunID) {
      if (noPush.toString() === 'true') {
        core.info('no_push: true')
      } else {
        for (const tag of docker.builtImage.tags) {
          await docker.push(tag)
        }
      }
      await setDelivery({
        dockerImage: docker.builtImage,
        gitHubRunID
      })
    }

    const endTime = new Date() // UTC
    s3.uploadBuildTime(startTime, endTime, imageName, 'success', 'NoError')

    const elapsedSec = (endTime.getTime() - startTime.getTime()) / 1000
    const buildTime = `${Math.floor(elapsedSec / 60)}min ${elapsedSec % 60}sec`
    notification.notifyReadyToDeploy(
      thisAction,
      imageName,
      buildTime,
      docker.builtImage?.tags.join(', ')
    )
  } catch (e) {
    let buildReason: string
    Bugsnag.notify(e)
    if (e instanceof BuildError) {
      buildReason = 'BuildError'
      core.error('image build error')
      notification.notifyBuildFailed(thisAction)
    } else if (e instanceof ScanError) {
      buildReason = 'ScanError'
      core.error('image scan error')
    } else if (e instanceof PushError) {
      buildReason = 'PushError'
      core.error('ecr push error')
    } else {
      buildReason = 'UnknownError'
      core.error(e.message)
      core.error('unknown error')
    }

    const endTime = new Date() // UTC
    const imageName = core.getInput('image_name')
    s3.uploadBuildTime(startTime, endTime, imageName, 'fail', buildReason)

    core.setFailed(e)
  }
}

run()
