import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { Stickman, StickmanView, StickmanJoint, StickmanBone } from '../rig/Stickman';

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

const TOP_H = 52;   
const BOT_H = 60;   

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;

  private sideView!: StickmanView;
  private frontView!: StickmanView;
  private activeView: 'front' | 'side' = 'side';

  constructor() {
    super('Game');
  }

  create() {
    const { width, height } = this.scale;
    const MAIN_H = height - TOP_H - BOT_H;

    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x1a1a1f);
    this.background = this.add.image(width / 2, height / 2, 'background').setAlpha(0.05);

    const scale = Math.min(
      (width * 0.80) / 200,
      (MAIN_H * 0.87) / 340
    );

    const offsetX = width / 2 - 128 * scale;
    const offsetY = TOP_H + MAIN_H / 2 - 170 * scale;

    const stickman = new Stickman(JOINTS, BONES);

    this.sideView = stickman.addView(this, 'side', {
      offsetX, offsetY, scale,
      boneColor: 0xaaaaaa,
    });
    this.frontView = stickman.addView(this, 'front', {
      offsetX, offsetY, scale,
      boneColor: 0xaaaaaa,
    });

    this.frontView.setVisible(false);

    const chrome = this.add.graphics();
    chrome.fillStyle(0x14141a, 1);
    chrome.fillRect(0, 0, width, TOP_H);
    chrome.fillRect(0, height - BOT_H, width, BOT_H);
    chrome.lineStyle(1, 0xffffff, 0.07);
    chrome.lineBetween(0, TOP_H, width, TOP_H);
    chrome.lineBetween(0, height - BOT_H, width, height - BOT_H);

    const TAB_W = 80, TAB_H = 34, tabGap = 8;
    const tabCY = TOP_H / 2;
    const frontCX = width / 2 - TAB_W / 2 - tabGap / 2;
    const sideCX   = width / 2 + TAB_W / 2 + tabGap / 2;

    const buildTab = (cx: number, label: string, startsActive: boolean) => {
      const gfx = this.add.graphics();
      const txt = this.add.text(cx, tabCY, label, {
        fontFamily: 'Arial',
        fontSize: 15,
        color: '#666666',
      }).setOrigin(0.5);

      const draw = (active: boolean) => {
        gfx.clear();
        if (active) {
          gfx.fillStyle(0xffffff, 1);
          gfx.fillRoundedRect(cx - TAB_W / 2, tabCY - TAB_H / 2, TAB_W, TAB_H, 7);
          txt.setColor('#111111');
        } else {
          gfx.fillStyle(0xffffff, 0.06);
          gfx.fillRoundedRect(cx - TAB_W / 2, tabCY - TAB_H / 2, TAB_W, TAB_H, 7);
          txt.setColor('#666666');
        }
      };

      draw(startsActive);

      gfx.setInteractive(
        new Phaser.Geom.Rectangle(cx - TAB_W / 2, tabCY - TAB_H / 2, TAB_W, TAB_H),
        Phaser.Geom.Rectangle.Contains
      );

      return { draw, gfx };
    };

    const frontTab = buildTab(frontCX, 'front', false);
    const sideTab  = buildTab(sideCX,  'side',  true);

    const switchView = (to: 'front' | 'side') => {
      if (to === this.activeView) return;
      this.activeView = to;
      this.sideView.setVisible(to === 'side');
      this.frontView.setVisible(to === 'front');
      frontTab.draw(to === 'front');
      sideTab.draw(to === 'side');
    };

    frontTab.gfx.on('pointerup', () => switchView('front'));
    sideTab.gfx.on('pointerup',  () => switchView('side'));

    const ACT_W = 96, ACT_H = 38, actGap = 12;
    const botCY  = height - BOT_H / 2;
    const adjCX  = width / 2 - ACT_W / 2 - actGap / 2;
    const hitCX  = width / 2 + ACT_W / 2 + actGap / 2;

    const buildActionBtn = (cx: number, label: string, highlighted: boolean) => {
      const gfx = this.add.graphics();
      this.add.text(cx, botCY, label, {
        fontFamily: 'Arial',
        fontSize: 16,
        color: highlighted ? '#111111' : '#888888',
      }).setOrigin(0.5);

      if (highlighted) {
        gfx.fillStyle(0xffffff, 1);
        gfx.fillRoundedRect(cx - ACT_W / 2, botCY - ACT_H / 2, ACT_W, ACT_H, 8);
      } else {
        gfx.lineStyle(1, 0xffffff, 0.22);
        gfx.strokeRoundedRect(cx - ACT_W / 2, botCY - ACT_H / 2, ACT_W, ACT_H, 8);
      }

      gfx.setInteractive(
        new Phaser.Geom.Rectangle(cx - ACT_W / 2, botCY - ACT_H / 2, ACT_W, ACT_H),
        Phaser.Geom.Rectangle.Contains
      );

      return gfx;
    };

    buildActionBtn(adjCX, 'adjust', true);
    const hitGfx = buildActionBtn(hitCX, 'hit', false);
    hitGfx.on('pointerup', () => this.scene.start('GameOver'));
  }
}