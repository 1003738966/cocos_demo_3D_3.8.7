import { _decorator, Node, EventTouch, Touch, Component, UITransform, Input, EventKeyboard, KeyCode, v2, Vec3, input, Scene, director, EventMouse, macro, view, screen, Prefab, instantiate } from 'cc';
import { EasyControllerEvent } from '../utils/EasyController';
const { ccclass, property } = _decorator;

/**
 * 摇杆
 */

@ccclass('UI_Joystick')
export class UI_Joystick extends Component {

	// 摇杆
	@property(Prefab)
	private Joystick : Prefab = null;

	// 实例
	private static _inst : UI_Joystick = null;
	public static get inst() : UI_Joystick {
		return this._inst;
	}

	// 控制根节点
	private _ctrlRoot : UITransform = null;
	// 控制指针节点
	private _ctrlPointer : Node = null;
	// 控制相机节点
	private _checkerCamera : UITransform = null;
	// 按钮节点
	private _buttons : Node = null;

	// 相机灵敏度
	private _cameraSensitivity : number = 0.1;
	// 两个触摸点之间的距离
	private _distanceOfTwoTouchPoint : number = 0;

	// 移动触摸点
	private _movementTouch : Touch = null;
	// 相机触摸点A
	private _cameraTouchA : Touch = null;
	// 相机触摸点B
	private _cameraTouchB : Touch = null;

	// 场景
	private _scene : Scene = null;

	// 按键到按钮的映射
	private _key2buttonMap = {};

	/*** 加载 ***/
	protected onLoad() : void {
		UI_Joystick._inst = this;
	}

	/**
	 *  开始 
	 */
	start() {
		let checkerCamera = this.node.getChildByName('CheckerCamera').getComponent(UITransform);
		checkerCamera.node.on(Input.EventType.TOUCH_START, this.onTouchStart_CameraCtrl, this);
		checkerCamera.node.on(Input.EventType.TOUCH_MOVE, this.onTouchMove_CameraCtrl, this);
		checkerCamera.node.on(Input.EventType.TOUCH_END, this.onTouchUp_CameraCtrl, this);
		checkerCamera.node.on(Input.EventType.TOUCH_CANCEL, this.onTouchUp_CameraCtrl, this);

		let checkerMovement = this.node.getChildByName('CheckerMovement').getComponent(UITransform);
		checkerMovement.node.on(Input.EventType.TOUCH_START, this.onTouchStart_Movement, this);
		checkerMovement.node.on(Input.EventType.TOUCH_MOVE, this.onTouchMove_Movement, this);
		checkerMovement.node.on(Input.EventType.TOUCH_END, this.onTouchUp_Movement, this);
		checkerMovement.node.on(Input.EventType.TOUCH_CANCEL, this.onTouchUp_Movement, this);

		const joystick = instantiate(this.Joystick);
		this.node.addChild(joystick);

		this._checkerCamera = checkerCamera;

		this._ctrlRoot = this.node.getChildByName('Ctrl').getComponent(UITransform);

		this._ctrlPointer = joystick.getChildByName('pointer');

		this._buttons = this.node.getChildByName('buttons');

		this._key2buttonMap[KeyCode.KEY_J] = 'btn_slot_0';
		this._key2buttonMap[KeyCode.KEY_K] = 'btn_slot_1';
		this._key2buttonMap[KeyCode.KEY_L] = 'btn_slot_2';
		this._key2buttonMap[KeyCode.KEY_U] = 'btn_slot_3';
		this._key2buttonMap[KeyCode.KEY_I] = 'btn_slot_4';

		// input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
		input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
		input.on(Input.EventType.MOUSE_WHEEL, this.onMouseWheel, this);

		this._scene = director.getScene();
	}

	/**
	 * 销毁 
	 */
	onDestroy() {
		// input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
		input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
		input.off(Input.EventType.MOUSE_WHEEL, this.onMouseWheel, this);

		UI_Joystick._inst = null;
	}

	/**
	 * 绑定按键到按钮 
	 */
	bindKeyToButton(keyCode : KeyCode, btnName : string) {
		this._key2buttonMap[keyCode] = btnName;
	}

	/**
	 * 设置按钮可见性 
	 */
	setButtonVisible(btnName : string, visible : boolean) {
		let node = this._buttons?.getChildByName(btnName);
		if (node) {
			node.active = visible;
		}
	}

	/**
	 * 获取按钮 
	 */
	getButtonByName(btnName : string) : Node {
		return this._buttons.getChildByName(btnName);
	}

	/**
	 * 移动触摸开始 
	 */
	onTouchStart_Movement(event : EventTouch) {
		let touches = event.getTouches();
		for (let i = 0; i < touches.length; ++i) {
			let touch = touches[i];
			let x = touch.getUILocationX();
			let y = touch.getUILocationY();
			if (!this._movementTouch) {
				let halfWidth = this._checkerCamera.width / 2;
				let halfHeight = this._checkerCamera.height / 2;

				this._ctrlRoot.node.setPosition(x - halfWidth, y - halfHeight, 0);
				this._ctrlPointer.setPosition(0, 0, 0);
				this._movementTouch = touch;
			}
		}
	}

	/**
	 * 移动触摸移动 
	 */
	onTouchMove_Movement(event : EventTouch) {
		let touches = event.getTouches();
		for (let i = 0; i < touches.length; ++i) {
			let touch = touches[i];
			if (this._movementTouch && touch.getID() == this._movementTouch.getID()) {
				let halfWidth = this._checkerCamera.width / 2;
				let halfHeight = this._checkerCamera.height / 2;
				let x = touch.getUILocationX();
				let y = touch.getUILocationY();

				let pos = this._ctrlRoot.node.position;
				let ox = x - halfWidth - pos.x;
				let oy = y - halfHeight - pos.y;

				let len = Math.sqrt(ox * ox + oy * oy);
				if (len <= 0) {
					return;
				}

				let dirX = ox / len;
				let dirY = oy / len;
				let radius = this._ctrlRoot.width / 2;
				if (len > radius) {
					len = radius;
					ox = dirX * radius;
					oy = dirY * radius;
				}

				this._ctrlPointer.setPosition(ox, oy, 0);

				// degree 0 ~ 360 based on x axis.
				let degree = Math.atan(dirY / dirX) / Math.PI * 180;
				if (dirX < 0) {
					degree += 180;
				}
				else {
					degree += 360;
				}

				this._scene.emit(EasyControllerEvent.MOVEMENT, degree, len / radius);
			}
		}
	}

	/**
	 * 移动触摸结束 
	 */
	onTouchUp_Movement(event : EventTouch) {
		let touches = event.getTouches();
		for (let i = 0; i < touches.length; ++i) {
			let touch = touches[i];
			if (this._movementTouch && touch.getID() == this._movementTouch.getID()) {
				this._scene.emit(EasyControllerEvent.MOVEMENT_STOP);
				this._movementTouch = null;
				this._ctrlPointer.setPosition(0, 0, 0);
			}
		}
	}

	/**
	 * 获取两个触摸点之间的距离 
	 */
	private getDistOfTwoTouchPoints() : number {
		let touchA = this._cameraTouchA;
		let touchB = this._cameraTouchB;
		if (!touchA || !touchB) {
			return 0;
		}
		let dx = touchA.getLocationX() - touchB.getLocationX();
		let dy = touchB.getLocationY() - touchB.getLocationY();
		return Math.sqrt(dx * dx + dy * dy);
	}

	/**
	 * 相机触摸开始 
	 */
	private onTouchStart_CameraCtrl(event : EventTouch) {
		let touches = event.getAllTouches();
		this._cameraTouchA = null;
		this._cameraTouchB = null;
		for (let i = touches.length - 1; i >= 0; i--) {
			let touch = touches[i];
			if (this._movementTouch && touch.getID() == this._movementTouch.getID()) {
				continue;
			}
			if (this._cameraTouchA == null) {
				this._cameraTouchA = touches[i];
			}
			else if (this._cameraTouchB == null) {
				this._cameraTouchB = touches[i];
				break;
			}
		}
		this._distanceOfTwoTouchPoint = this.getDistOfTwoTouchPoints();
	}

	/**
	 * 相机触摸移动 
	 */
	private onTouchMove_CameraCtrl(event : EventTouch) {
		let touches = event.getTouches();
		for (let i = 0; i < touches.length; ++i) {
			let touch = touches[i];
			let touchID = touch.getID();
			//two touches, do camera zoom.
			if (this._cameraTouchA && this._cameraTouchB) {
				let needZoom = false;
				if (touchID == this._cameraTouchA.getID()) {
					this._cameraTouchA = touch;
					needZoom = true;
				}
				if (touchID == this._cameraTouchB.getID()) {
					this._cameraTouchB = touch;
					needZoom = true;
				}

				if (needZoom) {
					let newDist = this.getDistOfTwoTouchPoints();
					let delta = this._distanceOfTwoTouchPoint - newDist;
					this._scene.emit(EasyControllerEvent.CAMERA_ZOOM, delta);
					this._distanceOfTwoTouchPoint = newDist;
				}
			}

			else if (this._cameraTouchA && touchID == this._cameraTouchA.getID()) {
				let dt = touch.getDelta();
				let rx = dt.y * this._cameraSensitivity;
				let ry = -dt.x * this._cameraSensitivity;
				this._scene.emit(EasyControllerEvent.CAMERA_ROTATE, rx, ry);
			}
		}
	}

	/**
	 * 相机触摸结束 
	 */
	private onTouchUp_CameraCtrl(event : EventTouch) {
		let touches = event.getAllTouches();
		let hasTouchA = false;
		let hasTouchB = false;
		for (let i = 0; i < touches.length; ++i) {
			let touch = touches[i];
			let touchID = touch.getID();
			if (this._cameraTouchA && touchID == this._cameraTouchA.getID()) {
				hasTouchA = true;
			}
			else if (this._cameraTouchB && touchID == this._cameraTouchB.getID()) {
				hasTouchB = true;
			}
		}

		if (!hasTouchA) {
			this._cameraTouchA = null;
		}
		if (!hasTouchB) {
			this._cameraTouchB = null;
		}
	}

	// 按键
	private _keys = [];
	private _degree : number = 0;
	/**
	 * 按键按下 
	 */
	onKeyDown(event : EventKeyboard) {
		let keyCode = event.keyCode;
		if (keyCode == KeyCode.KEY_A || keyCode == KeyCode.KEY_S || keyCode == KeyCode.KEY_D || keyCode == KeyCode.KEY_W) {
			if (this._keys.indexOf(keyCode) == -1) {
				this._keys.push(keyCode);
				this.updateDirection();
			}
		}
		else {
			let btnName = this._key2buttonMap[keyCode];
			if (btnName) {
				this._scene.emit(EasyControllerEvent.BUTTON, btnName);
			}
		}
	}

	/**
	 * 按键释放 
	 */
	onKeyUp(event : EventKeyboard) {
		let keyCode = event.keyCode;
		if (keyCode == KeyCode.KEY_A || keyCode == KeyCode.KEY_S || keyCode == KeyCode.KEY_D || keyCode == KeyCode.KEY_W) {
			let index = this._keys.indexOf(keyCode);
			if (index != -1) {
				this._keys.splice(index, 1);
				this.updateDirection();
			}
		}
	}

	/**
	 * 鼠标滚轮 
	 */
	onMouseWheel(event : EventMouse) {
		let delta = event.getScrollY() * 0.1;
		this._scene.emit(EasyControllerEvent.CAMERA_ZOOM, delta);
	}

	/**
	 * 按钮槽 
	 */
	onButtonSlot(event) {
		let btnName = event.target.name;
		this._scene.emit(EasyControllerEvent.BUTTON, btnName);
	}

	// 按键到方向的映射
	private _key2dirMap = null;
	/**
	* 更新方向 
	*/
	updateDirection() {
		if (this._key2dirMap == null) {
			this._key2dirMap = {};
			this._key2dirMap[0] = -1;
			this._key2dirMap[KeyCode.KEY_A] = 180;
			this._key2dirMap[KeyCode.KEY_D] = 0;
			this._key2dirMap[KeyCode.KEY_W] = 90;
			this._key2dirMap[KeyCode.KEY_S] = 270;

			this._key2dirMap[KeyCode.KEY_A * 1000 + KeyCode.KEY_W] = this._key2dirMap[KeyCode.KEY_W * 1000 + KeyCode.KEY_A] = 135;
			this._key2dirMap[KeyCode.KEY_D * 1000 + KeyCode.KEY_W] = this._key2dirMap[KeyCode.KEY_W * 1000 + KeyCode.KEY_D] = 45;
			this._key2dirMap[KeyCode.KEY_A * 1000 + KeyCode.KEY_S] = this._key2dirMap[KeyCode.KEY_S * 1000 + KeyCode.KEY_A] = 225;
			this._key2dirMap[KeyCode.KEY_D * 1000 + KeyCode.KEY_S] = this._key2dirMap[KeyCode.KEY_S * 1000 + KeyCode.KEY_D] = 315;

			this._key2dirMap[KeyCode.KEY_A * 1000 + KeyCode.KEY_D] = this._key2dirMap[KeyCode.KEY_D];
			this._key2dirMap[KeyCode.KEY_D * 1000 + KeyCode.KEY_A] = this._key2dirMap[KeyCode.KEY_A];
			this._key2dirMap[KeyCode.KEY_W * 1000 + KeyCode.KEY_S] = this._key2dirMap[KeyCode.KEY_S];
			this._key2dirMap[KeyCode.KEY_S * 1000 + KeyCode.KEY_W] = this._key2dirMap[KeyCode.KEY_W];
		}
		let keyCode0 = this._keys[this._keys.length - 1] || 0;
		let keyCode1 = this._keys[this._keys.length - 2] || 0;
		this._degree = this._key2dirMap[keyCode1 * 1000 + keyCode0];
		if (this._degree == null || this._degree < 0) {
			this._scene.emit(EasyControllerEvent.MOVEMENT_STOP);
		}
		else {
			this._scene.emit(EasyControllerEvent.MOVEMENT, this._degree, 1.0);
		}
	}
}