import { _decorator, Node, Component, UITransform, view } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameMarquee')
export class GameMarquee extends Component {

	// 跑马灯文本
	@property(UITransform)
	textLabel : UITransform = null!;

	// 跑马灯移动速度(px/秒)
	@property
	speed : number = 50;

	// 遮罩宽度
	private _maskWidth : number = 0;
	// 文本宽度
	private _textWidth : number = 0;

	/**
	 * 开始
	 */
	start() {
		// 获取遮罩宽度（屏幕适配后）
		this._maskWidth = view.getCanvasSize().width;
		// 计算文本实际宽度
		this._textWidth = this.textLabel.width;
		// 初始位置：从遮罩右侧外开始
		this.textLabel.node.x = this._maskWidth / 2;
	}

	/**
	 * 更新
	 */
	update(dt : number) {
		// 每帧向左移动
		this.textLabel.node.x -= this.speed * dt;
		// 文本完全移出左边界时，重置到右侧
		if (this.textLabel.node.x + this._maskWidth / 2 < -this._textWidth) {
			this.textLabel.node.x = this._maskWidth / 2;
		}
	}
}