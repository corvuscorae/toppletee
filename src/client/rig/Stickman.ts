import { Scene } from 'phaser';
import * as Phaser from 'phaser';

export interface StickmanJoint {
  id: string;
  x: number;
  y: number;
}

export interface StickmanBone {
  a: string;
  b: string;
}

export interface StickmanOptions {
  x?: number; 
  y?: number;
  scale?: number;
  nodeRadius?: number;
  nodeColor?: number;
  boneColor?: number;
  showClub?: boolean;
  label?: string;
}

interface Node {
  x: number;
  y: number;
}

interface BoneInternal extends StickmanBone {
  length: number;
}

const RELAX_ITERATIONS = 12;

export class Stickman {
  private scene: Scene;
  private nodes: Record<string, Node> = {};
  private bones: BoneInternal[] = [];
  private circles: Record<string, Phaser.GameObjects.Arc> = {};
  private graphics: Phaser.GameObjects.Graphics;
  private nodeRadius: number;
  private boneColor: number;
  private showClub: boolean;

  constructor(
    scene: Scene,
    joints: StickmanJoint[],
    bones: StickmanBone[],
    options: StickmanOptions = {}
  ) {
    this.scene = scene;

    const offsetX = options.x ?? 0;
    const offsetY = options.y ?? 0;
    const scale = options.scale ?? 1;
    this.nodeRadius = (options.nodeRadius ?? 14) * scale;
    this.boneColor = options.boneColor ?? 0x1a1a1a;
    const nodeColor = options.nodeColor ?? 0xff4d3d;
    this.showClub = options.showClub ?? true;

    joints.forEach((j) => {
      this.nodes[j.id] = { x: offsetX + j.x * scale, y: offsetY + j.y * scale };
    });

    this.bones = bones.map((bone) => {
      const a = this.getNode(bone.a);
      const b = this.getNode(bone.b);
      return { ...bone, length: Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y) };
    });

    this.graphics = scene.add.graphics();

    if (options.label) {
      scene.add
        .text(offsetX, offsetY - 30 * scale, options.label, {
          fontFamily: 'Arial',
          fontSize: 20,
          color: '#ffffff',
        })
        .setOrigin(0, 0.5);
    }

    joints.forEach((j) => this.createJointCircle(j.id, nodeColor));

    this.redraw();
  }

  private getNode(id: string): Node {
    const node = this.nodes[id];
    if (!node) throw new Error(`Stickman: unknown joint id "${id}"`);
    return node;
  }

  private hasNode(id: string): boolean {
    return id in this.nodes;
  }

  private createJointCircle(id: string, color: number) {
    const node = this.getNode(id);
    const circle = this.scene.add.circle(node.x, node.y, this.nodeRadius, color);
    circle.setStrokeStyle(2, 0x000000, 0.55);
    circle.setInteractive({ useHandCursor: true });
    this.scene.input.setDraggable(circle);

    circle.on('dragstart', () => circle.setScale(1.15));
    circle.on('dragend', () => circle.setScale(1));

    circle.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      const node = this.getNode(id);
      node.x = dragX;
      node.y = dragY;
      this.relax(id);
      this.syncCircles();
      this.redraw();
    });

    this.circles[id] = circle;
  }

  private relax(pinnedId: string) {
    for (let i = 0; i < RELAX_ITERATIONS; i++) {
      for (const bone of this.bones) {
        const a = this.getNode(bone.a);
        const b = this.getNode(bone.b);

        const aPinned = bone.a === pinnedId;
        const bPinned = bone.b === pinnedId;
        if (aPinned && bPinned) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        const diff = (dist - bone.length) / dist;

        const moveA = aPinned ? 0 : bPinned ? 1 : 0.5;
        const moveB = bPinned ? 0 : aPinned ? 1 : 0.5;

        a.x += dx * diff * moveA;
        a.y += dy * diff * moveA;
        b.x -= dx * diff * moveB;
        b.y -= dy * diff * moveB;
      }
    }
  }

  private syncCircles() {
    for (const id in this.circles) {
      const node = this.getNode(id);
      const circle = this.circles[id];
      if (circle) circle.setPosition(node.x, node.y);
    }
  }

  private redraw() {
    const g = this.graphics;
    g.clear();

    g.lineStyle(5, this.boneColor, 1);
    this.bones.forEach((bone) => {
      const a = this.getNode(bone.a);
      const b = this.getNode(bone.b);
      g.lineBetween(a.x, a.y, b.x, b.y);
    });

    if (this.hasNode('neck') && this.hasNode('hip')) {
      const neck = this.getNode('neck');
      const hip = this.getNode('hip');
      let dx = neck.x - hip.x;
      let dy = neck.y - hip.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      dx /= len;
      dy /= len;
      const headRadius = this.nodeRadius * 1.9;
      const headX = neck.x + dx * (headRadius + this.nodeRadius * 0.4);
      const headY = neck.y + dy * (headRadius + this.nodeRadius * 0.4);
      g.lineStyle(3, this.boneColor, 1);
      g.strokeCircle(headX, headY, headRadius);
    }

    if (this.showClub && this.hasNode('rightElbow') && this.hasNode('rightWrist')) {
      const elbow = this.getNode('rightElbow');
      const wrist = this.getNode('rightWrist');
      let dx = wrist.x - elbow.x;
      let dy = wrist.y - elbow.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      dx /= len;
      dy /= len;
      const clubLength = this.nodeRadius * 10;
      const headX = wrist.x + dx * clubLength;
      const headY = wrist.y + dy * clubLength;
      g.lineStyle(4, 0x8a8a8a, 1);
      g.lineBetween(wrist.x, wrist.y, headX, headY);
      g.fillStyle(0x8a8a8a, 1);
      g.fillEllipse(headX, headY, this.nodeRadius * 1.8, this.nodeRadius * 1.1);
    }
  }
}
