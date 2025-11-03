import { _decorator, director } from 'cc';

/**
 * 事件类型
 */
export class EasyControllerEvent {

	// 相机旋转
	public static CAMERA_ROTATE : string = 'EasyControllerEvent.CAMERA_ROTATE';

	// 相机缩放
	public static CAMERA_ZOOM : string = 'EasyControllerEvent.CAMERA_ZOOM';

	// 移动
	public static MOVEMENT : string = 'EasyControllerEvent.MOVEMENT';

	// 移动停止
	public static MOVEMENT_STOP : string = 'EasyControllerEvent.MOVEMENT_STOP';

	// 按钮
	public static BUTTON : string = 'EasyControllerEvent.BUTTON';
}

/**
 * 事件管理器
 */
export class EasyController {

	/*** 绑定事件 ***/
	public static on(type : string, callback : Function, target ?: any) {
		director.getScene().on(type, callback, target);
	}

	/*** 解绑事件 ***/
	public static off(type : string, callback ?: Function, target ?: any) {
		director.getScene()?.off(type, callback, target);
	}
}