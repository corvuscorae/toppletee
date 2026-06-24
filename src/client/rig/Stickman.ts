import { Scene } from 'phaser';
import * as Phaser from 'phaser';

export interface StickmanJoint {
  id: string;
  x: number;
  y: number;
  z: number;
}

export interface StickmanBone {
  a: string;
  b: string;
}

export type ViewType = 'front' | 'side';

export interface StickmanOptions {
  offsetX: number;
  offsetY: number;
  scale?: number;
  label?: string;
  nodeRadius?: number;
  nodeColor?: number;
  clubNodeColor?: number;
  boneColor?: number;
}

interface Node3D { 
  x: number; 
  y: number; 
  z: number; 
}

interface BoneInternal extends StickmanBone { 
  length: number; 
}

const RELAX_ITERATIONS = 16;

export class StickmanView {
  readonly type: ViewType;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly scale: number;

  private owner: Stickman;
  private graphics: Phaser.GameObjects.Graphics;
  private circles = new Map<string, Phaser.GameObjects.Arc>();
  private boneColor: number;
  private nodeRadius: number;
  private labelText: Phaser.GameObjects.Text | null = null;

  constructor(
    scene: Scene, 
    owner: Stickman, 
    type: ViewType, 
    options: StickmanOptions
  ) {
    this.owner = owner;
    this.type = type;
    this.offsetX = options.offsetX;
    this.offsetY = options.offsetY;
    this.scale = options.scale ?? 1;
    this.nodeRadius = (options.nodeRadius ?? 14) * this.scale;
    this.boneColor = options.boneColor ?? 0x1a1a1a;

    const nodeColor = options.nodeColor ?? 0xff4d3d;
    const clubColor = options.clubNodeColor ?? 0x777777;

    this.graphics = scene.add.graphics();

    if (options.label) {
      this.labelText = scene.add
        .text(options.offsetX, options.offsetY - 30, options.label, {
          fontFamily: 'Arial',
          fontSize: 20,
          color: '#999999',
        })
        .setOrigin(0, 0.5);
    }

    for (const id of owner.jointIds) {
      const isClub = id === 'clubHead';
      const radius = isClub ? this.nodeRadius * 1.5 : this.nodeRadius;
      const color = isClub ? clubColor : nodeColor;

      const pos = this.project(owner.getNode(id));
      const circle = scene.add.circle(pos.x, pos.y, radius, color);
      circle.setStrokeStyle(2, 0x000000, 0.35);
      circle.setInteractive({ useHandCursor: true });
      scene.input.setDraggable(circle);

      circle.on('dragstart', () => circle.setScale(1.12));
      circle.on('dragend', () => circle.setScale(1));
      circle.on('drag', (_ptr: Phaser.Input.Pointer, sx: number, sy: number) => {
        owner.moveAndRelax(id, this, sx, sy);
      });

      this.circles.set(id, circle);
    }

    this.redraw();
  }

  project(n: Node3D): { x: number; y: number } {
    return {
      x: this.offsetX + (this.type === 'front' ? n.x : n.z) * this.scale,
      y: this.offsetY + n.y * this.scale,
    };
  }

  unproject(screenX: number, screenY: number): Partial<Node3D> {
    const axis = (screenX - this.offsetX) / this.scale;
    const y = (screenY - this.offsetY) / this.scale;
    return this.type === 'front' ? { x: axis, y } : { z: axis, y };
  }

  setVisible(visible: boolean): void {
    this.graphics.setVisible(visible);
    if (this.labelText) this.labelText.setVisible(visible);
    for (const [, circle] of this.circles) {
      circle.setVisible(visible);
      if (visible) {
        circle.setInteractive({ useHandCursor: true });
      } else {
        circle.disableInteractive();
      }
    }
  }

  redraw() {
    const g = this.graphics;
    g.clear();

    for (const bone of this.owner.getBones()) {
      const isShaft = bone.a === 'rightWrist' && bone.b === 'clubHead';
      g.lineStyle(isShaft ? 3 : 5, isShaft ? 0x888888 : this.boneColor, 1);
      const a = this.project(this.owner.getNode(bone.a));
      const b = this.project(this.owner.getNode(bone.b));
      g.lineBetween(a.x, a.y, b.x, b.y);
    }

    if (this.owner.hasNode('neck') && this.owner.hasNode('hip')) {
      const neck = this.project(this.owner.getNode('neck'));
      const hip = this.project(this.owner.getNode('hip'));
      const dx = neck.x - hip.x;
      const dy = neck.y - hip.y;
      const l = Math.hypot(dx, dy) || 1;
      const r = this.nodeRadius * 1.9;
      const hx = neck.x + (dx / l) * (r + this.nodeRadius * 0.4);
      const hy = neck.y + (dy / l) * (r + this.nodeRadius * 0.4);
      g.lineStyle(3, this.boneColor, 1);
      g.strokeCircle(hx, hy, r);
    }

    for (const [id, circle] of this.circles) {
      const pos = this.project(this.owner.getNode(id));
      circle.setPosition(pos.x, pos.y);
    }
  }
}

export class Stickman {
  readonly jointIds: readonly string[];

  private nodes = new Map<string, Node3D>();
  private bones: BoneInternal[];
  private views: StickmanView[] = [];

  constructor(joints: StickmanJoint[], boneDefs: StickmanBone[]) {
    joints.forEach((j) => this.nodes.set(j.id, { x: j.x, y: j.y, z: j.z }));
    this.jointIds = joints.map((j) => j.id);

    this.bones = boneDefs.map((def) => {
      const a = this.getNode(def.a);
      const b = this.getNode(def.b);
      const length = Math.sqrt(
        (b.x - a.x) ** 2 + (b.y - a.y) ** 2 + (b.z - a.z) ** 2
      );
      return { ...def, length };
    });
  }

  getNode(id: string): Node3D {
    const n = this.nodes.get(id);
    if (!n) throw new Error(`Stickman: unknown joint "${id}"`);
    return n;
  }

  hasNode(id: string): boolean {
    return this.nodes.has(id);
  }

  getBones(): readonly BoneInternal[] {
    return this.bones;
  }

  addView(scene: Scene, type: ViewType, opts: StickmanOptions): StickmanView {
    const view = new StickmanView(scene, this, type, opts);
    this.views.push(view);
    return view;
  }

  moveAndRelax(
    id: string,
    fromView: StickmanView,
    screenX: number,
    screenY: number
  ): void {
    const delta = fromView.unproject(screenX, screenY);
    const node = this.getNode(id);
    if (delta.x !== undefined) node.x = delta.x;
    if (delta.y !== undefined) node.y = delta.y;
    if (delta.z !== undefined) node.z = delta.z;

    this.relax(id);
    for (const view of this.views) view.redraw();
  }

  private relax(pinnedId: string): void {
    for (let i = 0; i < RELAX_ITERATIONS; i++) {
      for (const bone of this.bones) {
        const a = this.getNode(bone.a);
        const b = this.getNode(bone.b);
        const aPinned = bone.a === pinnedId;
        const bPinned = bone.b === pinnedId;
        if (aPinned && bPinned) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dz = b.z - a.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.0001;
        const diff = (dist - bone.length) / dist;
        const mA = aPinned ? 0 : bPinned ? 1 : 0.5;
        const mB = bPinned ? 0 : aPinned ? 1 : 0.5;

        a.x += dx * diff * mA;
        a.y += dy * diff * mA;
        a.z += dz * diff * mA;
        b.x -= dx * diff * mB;
        b.y -= dy * diff * mB;
        b.z -= dz * diff * mB;
      }
    }
  }
}