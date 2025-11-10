import { _decorator, Component, Node, v3, RigidBody, Vec3, find, Camera, SkeletalAnimation, AnimationClip, Collider, ICollisionEvent, Prefab, instantiate } from 'cc';
import { EasyController, EasyControllerEvent } from '../utils/EasyController';
import { Utils } from '../utils/Utils';
import pako from '../utils/Pako.js';
import { ZIMManager } from '../zim/ZIMManage';
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

	// ZIM管理器
	private zimManager: ZIMManager = ZIMManager.getInstance();
	// 传输数据
	private _transmitDataArray : any[] = [];

	// 土坑
	private _pits : any[] = [];
	/**
	 * 开始
	 */
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

		// 每1秒传输一次数据
		this.schedule(this.transmitData, 1);
	}

	/**
	 * 更新
	 */
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
		if (this.zimManager.getCurrentRoomID() && this.zimManager.getUserInfo().userID) {
			this.node['userId'] = this.zimManager.getUserInfo().userID;
			this._transmitDataArray.push({
				roomID: this.zimManager.getCurrentRoomID(),
				userID: this.zimManager.getUserInfo().userID,
				userName: this.zimManager.getUserInfo().userName,
				position: this.node.getPosition(),
				rotation: this.node.rotation,
				scale: this.node.scale,
				_anim: this._isMoving ? this.moveAnimClip.name : this.node['_anim'] || this.idleAnimClip.name,
			});
		}
	}

	/**
	 * 落地
	 */
	onLand() {
		this._isInTheAir = false;
		this._currentVerticalVelocity = 0.0;
		if (this.moveAnimClip) {
			if (this._isMoving) {
				this._anim.crossFade(this.moveAnimClip.name, 0.5);
			}
			else {
				this._anim.crossFade(this.idleAnimClip.name, 0.5);
			}
		}
	}

	/**
	 * 临时变量
	 */
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

	/**
	 * 移动释放
	 */
	onMovementRelease() {
		if (!this._isInTheAir && this.idleAnimClip) {
			this._anim?.crossFade(this.idleAnimClip.name, 0.5);
		}
		this._isMoving = false;
		if (this._rigidBody) {
			this._rigidBody.setLinearVelocity(Vec3.ZERO);
		}
	}

	/**
	 * 传输数据
	 */
	transmitData() {
		if (this._transmitDataArray?.length > 0 && this._transmitDataArray[0]?.roomID) {
			this._pits = this.node.parent!.getChildByName('Pits').children.filter(child => {
				return child.name.includes('Pit');
			});
			const data = {
				roomID: this._transmitDataArray[0].roomID,
				userID: this._transmitDataArray[0].userID,
				userName: this._transmitDataArray[0].userName,
				position: this._transmitDataArray[0].position,
				rotation: this._transmitDataArray[0].rotation,
				scale: this._transmitDataArray[0].scale,
				_anim: this._transmitDataArray[0]._anim,
				dataArray: this._transmitDataArray,
				pits: this._pits.map(pit => {
					return {
						holeId: pit['holeId'],
						holePosition: pit['holePosition'],
						holeNum: pit['holeNum'],
						giftData: pit['giftData']
					}
				})
			}
			this.zimManager.sendRoomMessage(new Utils().uint8arrayToBase64(pako.deflateRaw(JSON.stringify(data), { to: 'string' })));
			this._transmitDataArray = [];
		}
    }

	/**
	 * 销毁
	 */
	onDestroy() {
		EasyController.off(EasyControllerEvent.MOVEMENT, this.onMovement, this);
		EasyController.off(EasyControllerEvent.MOVEMENT_STOP, this.onMovementRelease, this);
        
		let myCollider = this.getComponent(Collider);
		myCollider?.off('onCollisionEnter', (target : ICollisionEvent) => {
			if (target.otherCollider != target.selfCollider) {
				this.onLand();
			}
		});
		this.unschedule(this.transmitData);
		this._transmitDataArray = [];
		this._pits = [];
	}
}