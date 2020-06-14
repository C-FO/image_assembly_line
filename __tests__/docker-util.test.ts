import * as dockerUtil from '../src/docker-util'
import * as exec from '@actions/exec'
import axios from 'axios'

describe('latestBuiltImage()', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('returns latest built image', async () => {
    const mock = jest.spyOn(axios, 'get').mockResolvedValueOnce(DOCKRE_RESPONSE)

    const builtImage = await dockerUtil.latestBuiltImage(BUILT_IMAGE_NAME)
    expect(builtImage.imageID).toEqual(BUILT_IMAGE_ID)
    expect(builtImage.imageName).toEqual(BUILT_IMAGE_NAME)
    expect(builtImage.tags).toContain('1.11') // store tags for same ID
  })

  test('throw error if there is no built image', async () => {
    const imageName = 'noimages/app'
    const imageLs = jest
      .spyOn(dockerUtil, 'dockerImageLs')
      .mockImplementation(() => Promise.resolve([]))

    const result = dockerUtil.latestBuiltImage(imageName)
    await expect(result).rejects.toThrowError()
  })
})

describe('imageList()', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('when there is some specified images', async () => {
    const mock = jest.spyOn(axios, 'get').mockResolvedValueOnce(DOCKRE_RESPONSE)
    const imageList = await dockerUtil.dockerImageLs(BUILT_IMAGE_NAME)

    expect(mock).toHaveBeenCalledWith('http:/v1.39/images/json', {
      params: {filter: BUILT_IMAGE_NAME},
      socketPath: '/var/run/docker.sock'
    })

    // sorted
    const latestImageCreated = imageList[0].Created as number
    for (const image of imageList) {
      const created = image.Created as number
      expect(latestImageCreated >= created).toBeTruthy()

      for (const tag of image.RepoTags as string[]) {
        expect(tag.startsWith(BUILT_IMAGE_NAME)).toBeTruthy()
      }
    }
  })

  test('when there is NO any specified images', async () => {
    const mock = jest.spyOn(axios, 'get').mockResolvedValueOnce({data: []})

    const imageList = await dockerUtil.dockerImageLs('noimages/app')
    expect(imageList.length).toBe(0)
  })
})

const BUILT_IMAGE_NAME = 'image_assembly_line/debug'
const BUILT_IMAGE_ID =
  'sha256:446592c964a64e32631e6c8a6a6cfdf7f5efa26127171a72dc82f14736ba0530'

const DOCKRE_RESPONSE = {
  status: 200,
  data: [
    {
      Containers: -1,
      Created: 1590110015,
      Id: BUILT_IMAGE_ID,
      Labels: null,
      ParentId:
        'sha256:0d8129317a9f8bf07521948555d3136ae96efc7cae2d7932da3d1e55db47c2ae',
      RepoDigests: null,
      RepoTags: [
        'image_assembly_line/debug:1.11',
        'image_assembly_line/debug:dev',
        'image_assembly_line/debug:latest'
      ],
      SharedSize: -1,
      Size: 1199289384,
      VirtualSize: 1199289384
    },
    {
      Containers: -1,
      Created: 1589195609,
      Id:
        'sha256:021bf420eb2012013108dc0dced3b6d82f99db61656a38ab7600917efe2e64c1',
      Labels: null,
      ParentId:
        'sha256:fa021e46798bb12114119afed83683d22c5379bde9446571af77d40ebf75934d',
      RepoDigests: null,
      RepoTags: ['image_assembly_line/debug:1.9'],
      SharedSize: -1,
      Size: 1158899521,
      VirtualSize: 1158899521
    }
  ]
}
