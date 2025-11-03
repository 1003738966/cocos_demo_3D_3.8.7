import { _decorator, Component, Node, Vec3, v3 } from 'cc';
import { EasyController, EasyControllerEvent } from './utils/EasyController';
const { ccclass, property } = _decorator;

// 临时变量
const v3_1 = v3();
const v3_2 = v3();

// 旋转灵敏度
const ROTATION_STRENGTH = 20.0;

/**
 *  第三人称相机
 */
@ccclass('ThirdPersonCamera')
export class ThirdPersonCamera extends Component {
	// 目标
	@property(Node)
	target : Node;

	// 偏移
	@property
	lookAtOffset : Vec3 = v3();

	// 最小长度
	@property
	lenMin : number = 1.0;

	// 最大长度
	@property
	lenMax : number = 10.0;

	// 长度
	@property
	len : number = 5;

	// 是否分别旋转
	@property
	rotateVHSeparately : boolean = false;

	// 插值时间
	@property
	tweenTime : number = 0.2;

	// 目标长度
	private _targetLen : number = 0;
	// 目标角度
	private _targetAngles : Vec3 = v3();


	/**
	*  开始
	*/
	start() {
		// 绑定相机旋转事件
		EasyController.on(EasyControllerEvent.CAMERA_ROTATE, this.onCameraRotate, this);

		// 设置目标长度
		this._targetLen = this.len;
		// 设置目标角度
		this._targetAngles.set(this.node.eulerAngles);
	}

	/**
	*  销毁
	*/
	onDestroy() {
		// 解绑相机旋转事件
		EasyController.off(EasyControllerEvent.CAMERA_ROTATE, this.onCameraRotate, this);
	}

	/**
	*  更新
	*/
	lateUpdate(deltaTime : number) {
		// 如果目标不存在，则返回
		if (!this.target) {
			return;
		}
		const t = Math.min(deltaTime / this.tweenTime, 1.0);
		v3_1.set(this.node.eulerAngles);
		Vec3.lerp(v3_1, v3_1, this._targetAngles, t);
		// 设置当前角度
		this.node.setRotationFromEuler(v3_1);

		// 设置lookat
		v3_1.set(this.target.worldPosition);
		v3_1.add(this.lookAtOffset);

		// 设置长度
		this.len = this.len * (1.0 - t) + this._targetLen * t;
		v3_2.set(this.node.forward);
		v3_2.multiplyScalar(this.len);

		// 设置位置
		v3_1.subtract(v3_2);
		this.node.setPosition(v3_1);
	}

	/**
	*  相机旋转
	*/
	onCameraRotate(deltaX : number, deltaY : number) {
		// 设置当前角度
		let eulerAngles = this.node.eulerAngles;
		// 如果分别旋转，则设置Y轴为0
		if (this.rotateVHSeparately) {
			if (Math.abs(deltaX) > Math.abs(deltaY)) {
				deltaY = 0;
			}
			else {
				deltaX = 0;
			}
		}
		this._targetAngles.set(eulerAngles.x + deltaX * ROTATION_STRENGTH, eulerAngles.y + deltaY * ROTATION_STRENGTH, eulerAngles.z);
	}
}