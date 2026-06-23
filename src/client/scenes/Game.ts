import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { Stickman, StickmanJoint, StickmanBone } from '../rig/Stickman';

const JOINTS: StickmanJoint[] = [
  { id: 'neck',        x: 120, y:  50, z: 120 },
  { id: 'hip',         x: 120, y: 150, z:  70 },
  { id: 'leftElbow',   x:  60, y: 110, z: 150 },
  { id: 'leftWrist',   x:  40, y: 180, z: 175 },
  { id: 'rightElbow',  x: 180, y: 110, z: 130 },
  { id: 'rightWrist',  x: 200, y: 180, z: 185 },
  { id: 'leftKnee',    x:  95, y: 230, z:  95 },
  { id: 'leftAnkle',   x:  85, y: 310, z:  75 },
  { id: 'rightKnee',   x: 145, y: 230, z: 115 },
  { id: 'rightAnkle',  x: 155, y: 310, z: 115 },
  { id: 'clubHead',    x: 215, y: 330, z: 225 },
];

const BONES: StickmanBone[] = [
  { a: 'hip',          b: 'neck'       },
  { a: 'neck',         b: 'leftElbow'  },
  { a: 'leftElbow',    b: 'leftWrist'  },
  { a: 'neck',         b: 'rightElbow' },
  { a: 'rightElbow',   b: 'rightWrist' },
  { a: 'hip',          b: 'leftKnee'   },
  { a: 'leftKnee',     b: 'leftAnkle'  },
  { a: 'hip',          b: 'rightKnee'  },
  { a: 'rightKnee',    b: 'rightAnkle' },
  { a: 'rightWrist',   b: 'clubHead'   },
];

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;

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
        color: '#888888',
      })
      .setOrigin(0.5);

    const stickman = new Stickman(JOINTS, BONES);

    stickman.addView(this, 'side', {
      offsetX: width * 0.14,
      offsetY: height * 0.16,
      scale,
      label: 'Side view',
    });

    stickman.addView(this, 'front', {
      offsetX: width * 0.56,
      offsetY: height * 0.16,
      scale,
      label: 'Front view',
    });
  }
}