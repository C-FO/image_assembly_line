import Docker from '../src/docker'
import * as dockerUtil from '../src/docker-util'
import * as exec from '@actions/exec'

describe('constructor', () => {
  test('registry and imageName is given', async () => {
    const docker = new Docker(
      '1234567890.dkr.ecr.ap-northeast-1.amazonaws.com',
      'imagename/app'
    )
    expect(docker).toBeInstanceOf(Docker)
  })

  test('registry is empty', () => {
    expect(() => {
      new Docker('', 'imagename/app')
    }).toThrowError()
  })
})

describe('Docker#build()', () => {
  const docker = new Docker(
    '1234567890.dkr.ecr.ap-northeast-1.amazonaws.com/',
    'imagename/app'
  )

  test('build', async () => {
    jest.spyOn(dockerUtil, 'noBuiltImage').mockResolvedValue(true)
    jest.spyOn(dockerUtil, 'latestBuiltImage').mockResolvedValueOnce({
      imageID: '1234567890',
      imageName: 'build-image/debug',
      tags: ['latest']
    })
    const result = await docker.build('build')
    expect(result).toEqual({
      imageID: '1234567890',
      imageName: 'build-image/debug',
      tags: ['latest']
    })
  })

  test('throw error when built image exists on the machine', async () => {
    jest.spyOn(dockerUtil, 'noBuiltImage').mockResolvedValue(false)
    await expect(docker.build('build')).rejects.toThrowError()
  })
})

describe('Docker#scan()', () => {
  const docker = new Docker(
    '1234567890.dkr.ecr.ap-northeast-1.amazonaws.com/',
    'imagename/app'
  )

  beforeAll(async () => {
    jest.spyOn(dockerUtil, 'noBuiltImage').mockResolvedValue(true)
    jest.spyOn(dockerUtil, 'latestBuiltImage').mockResolvedValueOnce({
      imageID: '1234567890',
      imageName: 'build-image/debug',
      tags: ['latest']
    })
    await docker.build('build')
  })

  test('scan passed', async () => {
    jest.spyOn(exec, 'exec').mockResolvedValueOnce(0)
    const result = await docker.scan()
    expect(result).toEqual(0)
  })

  test('scan failed', async () => {
    jest.spyOn(exec, 'exec').mockResolvedValueOnce(1)
    const result = await docker.scan()
    expect(result).toEqual(1)
  })
})
