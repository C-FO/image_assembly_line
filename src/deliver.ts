import * as core from '@actions/core'
import {DockerImage} from './docker'

export interface Delivery {
  dockerImage: DockerImage
  gitHubRunID: string
}

export async function setDelivery(delivery: Delivery): Promise<void> {
  core.setOutput('built_image_name', delivery.dockerImage.imageName)
  core.setOutput('built_image_id', delivery.dockerImage.imageID)
  core.setOutput('git_hub_run_id', delivery.gitHubRunID)
}
