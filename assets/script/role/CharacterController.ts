import { _decorator, Component, Node, v3, RigidBody, Vec3, find, Camera, SkeletalAnimation, AnimationClip, Collider, ICollisionEvent, Prefab, instantiate } from 'cc';
import { EasyController, EasyControllerEvent } from '../utils/EasyController';
const { ccclass, property } = _decorator;

const v3_1 = v3();

@ccclass('CharacterController')
export class CharacterController extends Component {

	// 主相机
	@property(Camera)
	mainCamera : Camera;

	// 速度
	@property
	velocity = 1.0;

	// 跳跃速度
	@property
	jumpVelocity = 1.0;

	// 最大跳跃次数
	@property
	maxJumpTimes : number = 0;
	// 当前跳跃次数
	private _curJumpTimes : number = 0;

	// 闲置动画
	@property(AnimationClip)
	idleAnimClip : AnimationClip;

	// 移动动画
	@property(AnimationClip)
	moveAnimClip : AnimationClip;

	// 跳跃开始动画
	@property(AnimationClip)
	jumpBeginAnimClip : AnimationClip;

	// 跳跃循环动画
	@property(AnimationClip)
	jumpLoopAnimClip : AnimationClip;

	// 跳跃落地动画
	@property(AnimationClip)
	jumpLandAnimClip : AnimationClip;

	// 刚体
	_rigidBody : RigidBody;
	// 是否移动
	_isMoving : boolean = false;
	// 速度缩放
	_velocityScale : number = 1.0;
	// 是否在空中
	_isInTheAir : boolean = false;
	// 当前垂直速度
	_currentVerticalVelocity : number = 0.0;
	// 动画
	private _anim : SkeletalAnimation;

	/*** 开始 ***/
	start() {
		if (!this.mainCamera) {
			this.mainCamera = find('Main Camera')?.getComponent(Camera);
		}
		this._rigidBody = this.node.getComponent(RigidBody);
		this._anim = this.node.getComponent(SkeletalAnimation);
		if (this._anim) {
			let clipArr = [
				this.idleAnimClip,
				this.moveAnimClip,
				this.jumpBeginAnimClip,
				this.jumpLoopAnimClip,
				this.jumpLandAnimClip
			];
			for (let i = 0; i < clipArr.length; ++i) {
				let clip = clipArr[i];
				if (clip) {
					if (!this._anim.getState(clip.name)) {
						this._anim.addClip(clip);
					}
				}
			}
			if (this.idleAnimClip) {
				this._anim.play(this.idleAnimClip.name);
			}
		}

		EasyController.on(EasyControllerEvent.MOVEMENT, this.onMovement, this);
		EasyController.on(EasyControllerEvent.MOVEMENT_STOP, this.onMovementRelease, this);

		let myCollider = this.getComponent(Collider);
		myCollider?.on('onCollisionEnter', (target : ICollisionEvent) => {
			if (target.otherCollider != target.selfCollider) {
				this.onLand();
			}
		});
	}

	/*** 更新 ***/
	update(deltaTime : number) {
		if (this._isMoving) {
			this._tmp.set(this.node.forward);
			this._tmp.multiplyScalar(-1.0);
			this._tmp.multiplyScalar(this.velocity * this._velocityScale);
			if (this._rigidBody) {
				this._rigidBody.getLinearVelocity(v3_1);
				this._tmp.y = v3_1.y;
				this._rigidBody.setLinearVelocity(this._tmp);
			} else {
				this._tmp.multiplyScalar(deltaTime);
				this._tmp.add(this.node.position);
				this.node.setPosition(this._tmp);
			}
		}

		if (this._isInTheAir) {
			if (this.jumpBeginAnimClip && this._anim) {
				let state = this._anim.getState(this.jumpBeginAnimClip.name);
				if (state.isPlaying && state.current >= state.duration) {
					if (this.jumpLoopAnimClip) {
						this._anim.crossFade(this.jumpLoopAnimClip.name);
					}
				}
			}

			if (!this._rigidBody) {
				this._currentVerticalVelocity -= 9.8 * deltaTime;

				let oldPos = this.node.position;
				let nextY = oldPos.y + this._currentVerticalVelocity * deltaTime;
				if (nextY <= 0) {
					this.onLand();
					nextY = 0.0;
				}
				this.node.setPosition(oldPos.x, nextY, oldPos.z);
			}
		}
	}

	/*** 落地 ***/
	onLand() {
		this._isInTheAir = false;
		this._currentVerticalVelocity = 0.0;
		this._curJumpTimes = 0;
		if (this.moveAnimClip) {
			if (this._isMoving) {
				this._anim.crossFade(this.moveAnimClip.name, 0.5);
			}
			else {
				this._anim.crossFade(this.idleAnimClip.name, 0.5);
			}
		}
	}

	/*** 临时变量 ***/
	private _tmp = v3();
	// 移动
	onMovement(degree : number, offset : number) {
		let cameraRotationY = 0;
		if (this.mainCamera) {
			cameraRotationY = this.mainCamera.node.eulerAngles.y;
		}
		this._velocityScale = offset;
		//2D界面是 正X 为 0， 3D场景是 正前方为0，所以需要 - 90 度。（顺时针转90度）
		this._tmp.set(0, cameraRotationY + degree - 90 + 180, 0);
		this.node.setRotationFromEuler(this._tmp);
		if (this._anim) {
			if (!this._isMoving && !this._isInTheAir) {
				if (this.moveAnimClip) {
					this._anim.crossFade(this.moveAnimClip.name, 0.1);
				}
			}
			if (this.moveAnimClip) {
				this._anim.getState(this.moveAnimClip.name).speed = this._velocityScale;
			}
		}
		this._isMoving = true;

	}

	/*** 移动释放 ***/
	onMovementRelease() {
		if (!this._isInTheAir && this.idleAnimClip) {
			this._anim?.crossFade(this.idleAnimClip.name, 0.5);
		}
		this._isMoving = false;
		if (this._rigidBody) {
			this._rigidBody.setLinearVelocity(Vec3.ZERO);
		}
	}
}