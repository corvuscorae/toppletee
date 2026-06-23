import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { Stickman, StickmanBone, StickmanJoint } from '../rig/Stickman';

const BONES: StickmanBone[] = [
  { a: 'hip', b: 'neck' },
  { a: 'neck', b: 'leftElbow' },
  { a: 'leftElbow', b: 'leftWrist' },
  { a: 'neck', b: 'rightElbow' },
  { a: 'rightElbow', b: 'rightWrist' },
  { a: 'hip', b: 'leftKnee' },
  { a: 'leftKnee', b: 'leftAnkle' },
  { a: 'hip', b: 'rightKnee' },
  { a: 'rightKnee', b: 'rightAnkle' },
];

const SIDE_VIEW_POSE: StickmanJoint[] = [
  { id: 'neck', x: 120, y: 50 },
  { id: 'hip', x: 70, y: 150 },
  { id: 'leftElbow', x: 150, y: 110 },
  { id: 'leftWrist', x: 175, y: 170 },
  { id: 'rightElbow', x: 130, y: 130 },
  { id: 'rightWrist', x: 185, y: 175 },
  { id: 'leftKnee', x: 95, y: 230 },
  { id: 'leftAnkle', x: 75, y: 310 },
  { id: 'rightKnee', x: 115, y: 235 },
  { id: 'rightAnkle', x: 115, y: 315 },
];

const FRONT_VIEW_POSE: StickmanJoint[] = [
  { id: 'neck', x: 120, y: 50 },
  { id: 'hip', x: 120, y: 150 },
  { id: 'leftElbow', x: 60, y: 110 },
  { id: 'leftWrist', x: 40, y: 180 },
  { id: 'rightElbow', x: 180, y: 110 },
  { id: 'rightWrist', x: 200, y: 180 },
  { id: 'leftKnee', x: 95, y: 230 },
  { id: 'leftAnkle', x: 85, y: 310 },
  { id: 'rightKnee', x: 145, y: 230 },
  { id: 'rightAnkle', x: 155, y: 310 },
];

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;
  sideStickman: Stickman;
  frontStickman: Stickman;

  constructor() {
    super('Game');
  }

  create() {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x2b2b33);

    this.background = this.add.image(512, 384, 'background').setAlpha(0.12);

    const { width, height } = this.scale;
    const scale = Math.min(width / 1024, height / 768);

    this.add
      .text(width / 2, height * 0.06, 'Drag any joint to set up the swing', {
        fontFamily: 'Arial',
        fontSize: 22,
        color: '#dddddd',
      })
      .setOrigin(0.5);

    this.sideStickman = new Stickman(this, SIDE_VIEW_POSE, BONES, {
      x: width * 0.14,
      y: height * 0.16,
      scale,
      label: 'Side view',
    });

    this.frontStickman = new Stickman(this, FRONT_VIEW_POSE, BONES, {
      x: width * 0.56,
      y: height * 0.16,
      scale,
      label: 'Front view',
    });
  }
}
