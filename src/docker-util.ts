import {DockerImage} from './docker'
import * as https from 'https'
import * as core from '@actions/core'
import axios from 'axios'
import qs from 'qs'
import * as fs from 'fs'

const httpsAgent = new https.Agent({
  port: 2376,
  path: '/',
  ca: fs.readFileSync('/certs/client/ca.pem'),
  cert: fs.readFileSync('/certs/client/cert.pem'),
  key: fs.readFileSync('/certs/client/key.pem')
})

// Document for docker engine API.
// https://docs.docker.com/engine/api/v1.39/
export const axiosInstance = axios.create({
  httpsAgent
})

export async function latestBuiltImage(
  imageName: string
): Promise<DockerImage> {
  core.debug('latestBuiltImage()')
  const images = await dockerImageLs(imageName)
  if (images.length < 1) {
    throw new Error('No images built')
  }

  const latestImage = images[0]

  const builtImageName = latestImage.RepoTags[0].split(':')[0]
  const builtImageID = latestImage.Id
  const tags: string[] = []
  core.debug(`tags: ${latestImage.RepoTags.toString()}`)
  for (const repoTag of latestImage.RepoTags) {
    const tag = repoTag.split(':').pop() as string
    tags.push(tag)
  }

  return {
    imageName: builtImageName,
    imageID: builtImageID,
    tags
  }
}

/**
 * dockerTagImage creates a tag for a docker image
 * @param {string} imageId The ID of a docker image
 * @param {string} repository The upstream docker repository
 * @param {string} newTag New tag name to be set
 */
export async function dockerImageTag(
  imageId: string,
  repository: string,
  newTag: string
): Promise<void> {
  const res = await axiosInstance.post(
    `images/${imageId}/tag`,
    qs.stringify({tag: newTag, repo: repository})
  )

  if (res.status !== 201 && res.status !== 200) {
    throw new Error(
      `POST images/{name}/tag returns error, status code: ${res.status}`
    )
  }
}

/**
 * dockerImageLs lists docker images
 * @param {string} imageName The name of a docker image
 */
export async function dockerImageLs(
  imageName: string
): Promise<DockerEngineImageResponse[]> {
  const res = await axiosInstance.get('images/json', {
    params: {reference: imageName}
  })

  // Make sure that images are sorted by "Created" desc.
  return (res.data as DockerEngineImageResponse[]).sort((im1, im2) => {
    return im2.Created - im1.Created
  })
}

/**
 * pushDockerImage pushes a docker image to registry
 * @param {string} imageId The ID of a docker image
 * @param {string} newTag New tag name to be set
 * @param {string} registryAuth Base64 encoded registration auth
 */
export async function pushDockerImage(
  imageId: string,
  newTag: string,
  registryAuth: string
): Promise<void> {
  const res = await axiosInstance.post(
    `images/${imageId}/push`,
    qs.stringify({tag: newTag}),
    {headers: {'X-Registry-Auth': registryAuth}}
  )

  core.debug(res.data)
  if (res.status !== 200) {
    throw new Error(
      `POST images/{name}/push returns error, status code: ${res.status}`
    )
  }
}

interface DockerEngineImageResponse {
  Id: string
  RepoTags: string[]
  Created: number
  [key1: string]: string | string[] | number
}
