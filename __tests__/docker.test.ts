import Docker from '../src/docker'
import * as dockerUtil from '../src/docker-util'
import * as exec from '@actions/exec'

const commitHash = '869e3295e921af04e150efb1521d318ce99e353c'

describe('constructor', () => {
  test('registry and imageName, commitHash are given', async () => {
    const docker = new Docker(
      '1234567890.dkr.ecr.ap-northeast-1.amazonaws.com',
      'imagename/app',
      commitHash
    )
    expect(docker).toBeInstanceOf(Docker)
  })

  test('registry is empty', () => {
    expect(() => {
      new Docker('', 'imagename/app', commitHash)
    }).toThrowError()
  })
})

describe('Docker#build()', () => {
  const docker = new Docker(
    '1234567890.dkr.ecr.ap-northeast-1.amazonaws.com/',
    'imagename/app',
    commitHash
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
      tags: ['latest', commitHash]
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
    'imagename/app',
    commitHash
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
    const result = await docker.scan('CRITICAL', '0')
    expect(result).toEqual(0)
  })

  test('scan passed', async () => {
    jest.spyOn(exec, 'exec').mockResolvedValueOnce(0)
    const result = await docker.scan('HIGH', '0')
    expect(result).toEqual(0)
  })

  test('scan failed', async () => {
    jest.spyOn(exec, 'exec').mockResolvedValueOnce(1)
    const result = await docker.scan('CRITICAL', '1')
    expect(result).toEqual(1)
  })
})
