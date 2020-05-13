IMAGE_NAME ?= image_assembly_line/dev
NODE_VERSION ?= 12

build:
	echo "hello"

test.build_image:
	docker build -f Dockerfile \
		-t ${IMAGE_NAME} .

dev.build_image:
	docker build -f dev.Dockerfile \
		--build-arg NODE_VERSION=${NODE_VERSION} \
		-t ${IMAGE_NAME} .

dev.all:
	docker run --rm \
		-v ${PWD}/lib:/app/lib \
		-v ${PWD}/dist:/app/dist \
		-t ${IMAGE_NAME}:latest \
		sh -c 'npm run all'

dev.test:
	docker run --rm \
		-v ${PWD}/src:/app/src \
		-v ${PWD}/lib:/app/lib \
		-v ${PWD}/__tests__:/app/__tests__ \
		-t ${IMAGE_NAME}:latest \
		sh -c 'npm run build && npm run test'
