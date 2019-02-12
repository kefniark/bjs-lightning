// default css
import './index.css';
import '@babylonjs/inspector';

// use modern es6 import for tree shaking
import { Engine } from '@babylonjs/core/Engines/engine';
import { AssetsManager } from '@babylonjs/core/Misc/assetsManager';
import { Scene } from '@babylonjs/core/scene';
import { Vector3, Color3 } from '@babylonjs/core/Maths/math';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { VertexBuffer } from '@babylonjs/core/Meshes/buffer';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';

// create canvas
const canvas = document.createElement('canvas');
canvas.id = 'renderCanvas';
canvas.width = 1280;
canvas.height = 720;

// append body
const body = document.getElementsByTagName('body')[0];
body.appendChild(canvas);

// create scene
const engine: Engine = new Engine(canvas, true);
const models: {[id: string]: AbstractMesh } = {};
const textures: {[id: string]: Texture } = {};

function createMesh (name: string, s: Scene, m: StandardMaterial) {
	const sourceModel = models[name];

	const positions = sourceModel.getVerticesData(VertexBuffer.PositionKind);
	const indices = sourceModel.getIndices();
	const colors: number[] = [];
	const uv1 = sourceModel.getVerticesData(VertexBuffer.UVKind);
	const uv2 = sourceModel.getVerticesData(VertexBuffer.UV2Kind);

	if (!positions) throw new Error('no positions');
	for (let c = 0; c < positions.length / 3; c++) {
		colors.push(1, 1, 1, 1);
	}
	const newMesh = new Mesh('mesh_' + Math.random(), s);

	const vertexData = new VertexData();
	vertexData.positions = positions;
	vertexData.indices = indices;
	vertexData.colors = colors;
	vertexData.uvs = uv1;
	vertexData.uvs2 = uv2;

	const normals = [];
	VertexData.ComputeNormals(positions, indices, normals);
	vertexData.normals = normals;

	vertexData.applyToMesh(newMesh);

	// newMesh.freezeWorldMatrix();
	// newMesh.freezeNormals();
	newMesh.isVisible = true;

	newMesh.material = m;

	return newMesh;
}

// tslint:disable-next-line:max-line-length
function lightBfs (queue: number[][], collisions: number[][][], probes: number[][][][], visited: number[][][], bounds: number[][]) {
	const diffusion = 15;
	const diffusionDiag = 21;
	while (queue.length > 0) {
		const pos = queue.shift();
		if (!pos) continue;
		if (!collisions[pos[1]] || !collisions[pos[1]][pos[0]]) continue; // if outside
		if (collisions[pos[1]][pos[0]][pos[2]] === undefined) continue; // if outside
		if (collisions[pos[1]][pos[0]][pos[2]] === 1) continue; // if collisions
		if (pos[3] <= 0 && pos[4] <= 0 && pos[5] <= 0) continue; // no more list

		// avoid array index undefined
		if (probes[pos[1]] === undefined) probes[pos[1]] = [];
		if (probes[pos[1]][pos[0]] === undefined) probes[pos[1]][pos[0]] = [];
		if (probes[pos[1]][pos[0]][pos[2]] === undefined) probes[pos[1]][pos[0]][pos[2]] = [0, 0, 0];

		if (visited[pos[1]] === undefined) visited[pos[1]] = [];
		if (visited[pos[1]][pos[0]] === undefined) visited[pos[1]][pos[0]] = [];
		if (visited[pos[1]][pos[0]][pos[2]] === undefined) visited[pos[1]][pos[0]][pos[2]] = 0;

		// already visited
		if (visited[pos[1]][pos[0]][pos[2]] === 1) continue;

		queue.push([
			pos[0], pos[1] + 1, pos[2],
			Math.round(pos[3] - diffusion), Math.round(pos[4] - diffusion), Math.round(pos[5] - diffusion)
		]);
		queue.push([
			pos[0], pos[1] - 1, pos[2],
			Math.round(pos[3] - diffusion), Math.round(pos[4] - diffusion), Math.round(pos[5] - diffusion)
		]);

		queue.push([
			pos[0] - 1, pos[1], pos[2],
			Math.round(pos[3] - diffusion), Math.round(pos[4] - diffusion), Math.round(pos[5] - diffusion)
		]);
		queue.push([
			pos[0] + 1, pos[1], pos[2],
			Math.round(pos[3] - diffusion), Math.round(pos[4] - diffusion), Math.round(pos[5] - diffusion)
		]);

		queue.push([
			pos[0], pos[1], pos[2] - 1,
			Math.round(pos[3] - diffusion), Math.round(pos[4] - diffusion), Math.round(pos[5] - diffusion)
		]);
		queue.push([
			pos[0], pos[1], pos[2] + 1,
			Math.round(pos[3] - diffusion), Math.round(pos[4] - diffusion), Math.round(pos[5] - diffusion)
		]);

		queue.push([
			pos[0] - 1, pos[1], pos[2] - 1,
			Math.round(pos[3] - diffusionDiag), Math.round(pos[4] - diffusionDiag), Math.round(pos[5] - diffusionDiag)
		]);
		queue.push([
			pos[0] - 1, pos[1], pos[2] + 1,
			Math.round(pos[3] - diffusionDiag), Math.round(pos[4] - diffusionDiag), Math.round(pos[5] - diffusionDiag)
		]);

		queue.push([
			pos[0] + 1, pos[1], pos[2] - 1,
			Math.round(pos[3] - diffusionDiag), Math.round(pos[4] - diffusionDiag), Math.round(pos[5] - diffusionDiag)
		]);
		queue.push([
			pos[0] + 1, pos[1], pos[2] + 1,
			Math.round(pos[3] - diffusionDiag), Math.round(pos[4] - diffusionDiag), Math.round(pos[5] - diffusionDiag)
		]);

		bounds[0][0] = Math.min(bounds[0][0], pos[0]);
		bounds[0][1] = Math.max(bounds[0][1], pos[0]);
		bounds[1][0] = Math.min(bounds[1][0], pos[1]);
		bounds[1][1] = Math.max(bounds[1][1], pos[1]);
		bounds[2][0] = Math.min(bounds[2][0], pos[2]);
		bounds[2][1] = Math.max(bounds[2][1], pos[2]);

		probes[pos[1]][pos[0]][pos[2]] = [pos[3], pos[4], pos[5]];
		visited[pos[1]][pos[0]][pos[2]] = 1;
	}
}

// babylon scene
function createScene (s: Scene) {
	const camera = new ArcRotateCamera('Camera', Math.PI / 2, Math.PI / 2, 2, Vector3.Zero(), s);
	camera.alpha = 7.1;
	camera.beta = 1.84;
	camera.radius = -18;
	camera.attachControl(canvas, true);

	const light = new HemisphericLight('light1', new Vector3(1, 1, 0), s);

	// tslint:disable-next-line:no-console
	console.log(models.ground);
	const probe = MeshBuilder.CreateSphere('Probe', { diameter: 0.1 }, scene);

	const meshes: AbstractMesh[] = [];
	const collisions: number[][][] = [];
	const probes: number[][][][] = [];
	for (let y = -2; y <= 8; y++) {
		if (!probes[y]) probes[y] = [];
		if (!collisions[y]) collisions[y] = [];
		for (let x = -12; x <= 12; x++) {
			if (!probes[y][x]) probes[y][x] = [];
			if (!collisions[y][x]) collisions[y][x] = [];
			for (let z = -12; z <= 12; z++) {
				probes[y][x][z] = [0, 0, 0];
				collisions[y][x][z] = 0;
			}
		}
	}

	// Materials
	const wallMat = new StandardMaterial('groundMat', s);
	wallMat.diffuseTexture = textures.wall;
	wallMat.specularColor = new Color3(0.05, 0.05, 0.05);

	const groundMat = new StandardMaterial('groundMat', s);
	groundMat.diffuseTexture = textures.ground;
	groundMat.specularColor = new Color3(0.05, 0.05, 0.05);

	// Create wall
	for (let z = -2; z <= 2; z += 2) {
		const wall = createMesh('ground', s, wallMat);
		wall.rotation.x = Math.PI / 2;
		wall.rotation.z = Math.PI / 2;
		wall.position.set(-5, 1, z);
		wall.computeWorldMatrix();
		meshes.push(wall);
		for (let i = -1; i <= 1; i++) {
			for (let j = -1; j <= 1; j++) {
				collisions[1 + i][-5][z + j] = 1;
			}
		}
	}

	for (let z = -8; z <= -4; z += 2) {
		const wall = createMesh('ground', s, wallMat);
		wall.rotation.x = Math.PI / 2;
		wall.rotation.z = Math.PI / 2;
		wall.position.set(-3, 1, z);
		wall.computeWorldMatrix();
		meshes.push(wall);
		for (let i = -1; i <= 1; i++) {
			for (let j = -1; j <= 1; j++) {
				collisions[1 + i][-3][z + j] = 1;
			}
		}
	}

	for (let z = -4; z <= -4; z += 2) {
		const wall = createMesh('ground', s, wallMat);
		wall.rotation.x = Math.PI / 2;
		wall.rotation.z = Math.PI / 2;
		wall.position.set(-3, 3, z);
		wall.computeWorldMatrix();
		meshes.push(wall);
		for (let i = -1; i <= 1; i++) {
			for (let j = -1; j <= 1; j++) {
				collisions[3 + i][-3][z + j] = 1;
			}
		}
	}

	for (let x = -4; x <= 2; x += 2) {
		const wall = createMesh('ground', s, wallMat);
		wall.rotation.x = Math.PI / 2;
		wall.position.set(x, 1, -3);
		wall.computeWorldMatrix();
		meshes.push(wall);
		for (let i = -1; i <= 1; i++) {
			for (let j = -1; j <= 1; j++) {
				collisions[1 + i][x + j][-3] = 1;
			}
		}
	}

	for (let x = -2; x <= 2; x += 2) {
		const wall = createMesh('ground', s, wallMat);
		wall.rotation.x = Math.PI / 2;
		wall.position.set(x, 3, -3);
		wall.computeWorldMatrix();
		meshes.push(wall);
		for (let i = -1; i <= 1; i++) {
			for (let j = -1; j <= 1; j++) {
				collisions[3 + i][x + j][-3] = 1;
			}
		}
	}

	for (let x = -2; x <= 2; x += 2) {
		const wall = createMesh('ground', s, wallMat);
		wall.rotation.x = Math.PI / 2;
		wall.position.set(x, 3, -1);
		wall.computeWorldMatrix();
		meshes.push(wall);
		for (let i = -1; i <= 1; i++) {
			for (let j = -1; j <= 1; j++) {
				collisions[3 + i][x + j][-1] = 1;
			}
		}
	}

	// Create ground
	for (let x = -10; x <= 10; x += 2) {
		for (let z = -10; z <= 10; z += 2) {
			const ground = createMesh('ground', s, groundMat);
			ground.position.set(x, 0, z);
			ground.computeWorldMatrix();
			meshes.push(ground);
			for (let i = -1; i <= 1; i++) {
				for (let j = -1; j <= 1; j++) {
					collisions[0][x + i][z + j] = 1;
				}
			}
		}
	}

	for (let x = -4; x <= 2; x += 2) {
		for (let z = -2; z <= 2; z += 2) {
			const ground = createMesh('ground', s, groundMat);
			ground.position.set(x, 2, z);
			ground.computeWorldMatrix();
			meshes.push(ground);
			for (let i = -1; i <= 1; i++) {
				for (let j = -1; j <= 1; j++) {
					collisions[2][x + i][z + j] = 1;
				}
			}
		}
	}

	for (let x = -8; x <= 2; x += 2) {
		for (let z = -6; z <= 0; z += 2) {
			const ground = createMesh('ground', s, groundMat);
			ground.position.set(x, 4, z);
			ground.computeWorldMatrix();
			meshes.push(ground);
			for (let i = -1; i <= 1; i++) {
				for (let j = -1; j <= 1; j++) {
					collisions[4][x + i][z + j] = 1;
				}
			}
		}
	}

	for (let x = 2; x <= 6; x += 2) {
		for (let z = -2; z <= 4; z += 2) {
			const ground = createMesh('ground', s, groundMat);
			ground.position.set(x, 5, z);
			ground.computeWorldMatrix();
			meshes.push(ground);
			for (let i = -1; i <= 1; i++) {
				for (let j = -1; j <= 1; j++) {
					collisions[5][x + i][z + j] = 1;
				}
			}
		}
	}

	const sphere = MeshBuilder.CreateSphere('Source1', { diameter: 0.4 }, scene);
	sphere.position.x = 2;
	sphere.position.y = 4;
	sphere.position.z = 3;

	const sphere2 = MeshBuilder.CreateSphere('Source2', { diameter: 0.4 }, scene);
	sphere2.position.x = -6;
	sphere2.position.y = 1;
	sphere2.position.z = -4;

	// tslint:disable:no-console
	console.time('light');

	const lights = [
		[2, 4, 3, 128, 0, 0],
		[-6, 1, -4, 128 * 1.25, 128 * 1.25, 255 * 1.25],
		[7, 7, -7, 255, 255, 180]
	];

	// calculate lighting
	for (const l of lights) {
		const bounds = [[0, 0], [0, 0], [0, 0]];
		const val: number[][][][] = [];
		const visited = [];
		lightBfs([l], collisions, val, visited, bounds);
		for (let y = bounds[1][0]; y <= bounds[1][1]; y++) {
			for (let x = bounds[0][0]; x < bounds[0][1]; x++) {
				for (let z = bounds[2][0]; z < bounds[2][1]; z++) {
					if (!val[y] || !val[y][x] || !val[y][x][z]) continue;
					if (val[y][x][z][0] > 0) probes[y][x][z][0] = Math.max(0, Math.min(255, probes[y][x][z][0] + val[y][x][z][0]));
					if (val[y][x][z][1] > 0) probes[y][x][z][1] = Math.max(0, Math.min(255, probes[y][x][z][1] + val[y][x][z][1]));
					if (val[y][x][z][2] > 0) probes[y][x][z][2] = Math.max(0, Math.min(255, probes[y][x][z][2] + val[y][x][z][2]));
				}
			}
		}
	}

	console.timeEnd('light');
	console.time('vertices data');

	// set color vertices
	for (const mesh of meshes) {
		const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
		const colors = mesh.getVerticesData(VertexBuffer.ColorKind);
		const matrix = mesh.getWorldMatrix();
		if (!positions || !colors) continue;

		for (let idx = 0; idx < positions.length / 3; idx += 1) {
			const pos = new Vector3(positions[idx * 3], positions[idx * 3 + 1], positions[idx * 3 + 2]);
			const worldPos = Vector3.TransformCoordinates(pos, matrix);

			const val1 = probes[Math.floor(worldPos.y)][Math.round(worldPos.x)][Math.round(worldPos.z)];
			const val2 = probes[Math.ceil(worldPos.y)][Math.round(worldPos.x)][Math.round(worldPos.z)];
			const val3 = probes[Math.round(worldPos.y)][Math.floor(worldPos.x)][Math.round(worldPos.z)];
			const val4 = probes[Math.round(worldPos.y)][Math.ceil(worldPos.x)][Math.round(worldPos.z)];
			const val5 = probes[Math.round(worldPos.y)][Math.round(worldPos.x)][Math.floor(worldPos.z)];
			const val6 = probes[Math.round(worldPos.y)][Math.round(worldPos.x)][Math.ceil(worldPos.z)];

			// tslint:disable:max-line-length
			colors[idx * 4] = Math.min(Math.max(0, val1[0], val2[0], val3[0], val4[0], val5[0], val6[0]) / 255, 1); // * 0.95 + 0.05;
			colors[idx * 4 + 1] = Math.min(Math.max(0, val1[1], val2[1], val3[1], val4[1], val5[1], val6[1]) / 255, 1); // * 0.95 + 0.05;
			colors[idx * 4 + 2] = Math.min(Math.max(0, val1[2], val2[2], val3[2], val4[2], val5[2], val6[2]) / 255, 1); // * 0.95 + 0.05;

			colors[idx * 4] = Math.min(1, 0.05 + colors[idx * 4] * 1.1);
			colors[idx * 4 + 1] = Math.min(1, 0.05 + colors[idx * 4 + 1] * 1.1);
			colors[idx * 4 + 2] = Math.min(1, 0.05 + colors[idx * 4 + 2] * 1.1);
		}

		mesh.setVerticesData(VertexBuffer.ColorKind, colors);
	}

	console.timeEnd('vertices data');
}

function loadAssets (s: Scene, cb: () => void) {
	const assetsManager = new AssetsManager(s);

	const meshTask = assetsManager.addMeshTask('skull task', '', 'assets/models/', 'ground.babylon');
	meshTask.onSuccess = (task) => {
		models.ground = task.loadedMeshes[0];
		models.ground.setEnabled(false);
	};

	const textureTask1 = assetsManager.addTextureTask('image task', 'assets/textures/wall.jpg');
	textureTask1.onSuccess = (task) => {
		textures.wall = task.texture;
	};

	const textureTask2 = assetsManager.addTextureTask('image task', 'assets/textures/ground.jpg');
	textureTask2.onSuccess = (task) => {
		textures.ground = task.texture;
	};

	assetsManager.onFinish = (tasks) => cb();
	assetsManager.onTaskErrorObservable.add((task) => {
		// tslint:disable-next-line:no-console
		console.log('task failed', task.errorObject.message, task.errorObject.exception);
	});
	assetsManager.load();
}

const scene = new Scene(engine);

loadAssets(scene, () => {
	createScene(scene);

	// start render loop
	engine.runRenderLoop(() => scene.render());

	// debug panel
	scene.debugLayer.show({
		overlay: true,
		embedMode: true
	});
});
