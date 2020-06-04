import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as im from '@actions/exec/lib/interfaces'
import {latestBuiltImage, noBuiltImage, imageTag} from './docker-util'
import {BuildError, ScanError, PushError} from './error'
import {Vulnerability} from './types'
import {notifyVulnerability} from './notification'

export default class Docker {
  private registry: string
  private imageName: string
  private commitHash: string
  private _builtImage?: DockerImage

  constructor(registry: string, imageName: string, commitHash: string) {
    if (!registry) {
      throw new Error('registry is empty')
    }
    if (!imageName) {
      throw new Error('imageName is empty')
    }

    // remove the last '/'
    this.registry = sanitizedDomain(registry)
    this.imageName = imageName
    this.commitHash = commitHash
  }

  get builtImage(): DockerImage | undefined {
    return this._builtImage
  }

  async build(target: string): Promise<DockerImage> {
    try {
      if (!(await noBuiltImage())) {
        throw new Error('Built image exists')
      }
      await exec.exec('make', [
        `REGISTRY_NAME=${this.registry}`,
        `IMAGE_NAME=${this.imageName}`,
        target
      ])

      return this.update()
    } catch (e) {
      core.debug('build() error')
      throw new BuildError(e)
    }
  }

  async scan(severityLevel: string, scanExitCode: string): Promise<number> {
    try {
      if (!this._builtImage) {
        throw new Error('No built image to scan')
      }

      if (!severityLevel.includes('CRITICAL')) {
        severityLevel = `CRITICAL,${severityLevel}`
      }

      let trivyScanReport = '[]'
      const options: im.ExecOptions = {
        silent: true,
        listeners: {
          stdout: (data: Buffer) => {
            trivyScanReport = data.toString()
          }
        }
      }

      const imageName = `${this._builtImage.imageName}:${this._builtImage.tags[0]}`
      const result = await exec.exec(
        'trivy',
        [
          '--light',
          '--no-progress',
          '--quiet',
          '--format',
          'json',
          '--exit-code',
          scanExitCode,
          '--severity',
          severityLevel,
          imageName
        ],
        options
      )

      const vulnerabilities: Vulnerability[] = JSON.parse(trivyScanReport)
      if (vulnerabilities.length > 0) {
        notifyVulnerability(imageName, vulnerabilities)
      }

      return result
    } catch (e) {
      core.error('scan() error')
      throw new ScanError(e)
    }
  }

  private async login(): Promise<void> {
    core.debug('login()')

    // aws ecr get-login-password
    let ecrLoginPass = ''
    let ecrLoginError = ''
    const options: im.ExecOptions = {
      // set silent, not to log the password
      silent: true,
      listeners: {
        stdout: (data: Buffer) => {
          ecrLoginPass += data.toString()
        },
        stderr: (data: Buffer) => {
          ecrLoginError += data.toString()
        }
      }
    }
    try {
      await exec.exec('aws', ['ecr', 'get-login-password'], options)
    } catch (e) {
      core.error(ecrLoginError.trim())
      throw e
    }

    // docker login
    let stderr = ''
    try {
      options.ignoreReturnCode = true
      options.listeners = {
        stderr: (data: Buffer) => {
          stderr += data.toString()
        }
      }
      await exec.exec(
        'docker login',
        ['--username', 'AWS', '-p', ecrLoginPass, this.registry],
        options
      )
      core.debug('logged in')
    } catch (e) {
      core.error('login() failed')
      core.error(stderr)
      throw e
    }
  }

  async push(): Promise<number> {
    try {
      if (!this._builtImage) {
        throw new Error('No built image to push')
      }
      await this.login()
      for (const tag of this._builtImage.tags) {
        imageTag(
          `${this._builtImage.imageName}:${tag}`,
          `${this.upstreamRepository()}:${tag}`
        )
      }

      const result = exec.exec('docker', [
        'image',
        'push',
        this.upstreamRepository()
      ])
      return result
    } catch (e) {
      core.error('push() error')
      throw new PushError(e)
    }
  }

  upstreamRepository(): string {
    if (this._builtImage) {
      return `${this.registry}/${this._builtImage.imageName}`
    } else {
      throw new Error('No image built')
    }
  }

  private async update(): Promise<DockerImage> {
    this._builtImage = await latestBuiltImage(this.imageName)
    this._builtImage.tags.push(this.commitHash)
    core.debug(this._builtImage.toString())
    return this._builtImage
  }
}

function sanitizedDomain(str: string): string {
  return str.endsWith('/') ? str.substr(0, str.length - 1) : str
}

export interface DockerImage {
  imageID: string
  imageName: string
  tags: string[]
}
