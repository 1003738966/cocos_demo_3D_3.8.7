import { _decorator, Camera, Component, Node, UITransform, Vec3, view, macro, Prefab, instantiate, Label } from 'cc'
const { ccclass, property } = _decorator

@ccclass('UI_Follow')
export class UI_Follow extends Component {

	// 玩家节点
	@property({ type: Node })
	playerNode : Node = null

	// 用户昵称预制体
	@property({ type: Prefab })
	userNamepre : Prefab = null

	// 其他角色昵称预制体
	@property(Prefab)
	otherUserNamepre : Prefab = null

	// 角色容器
	@property(Node)
	roomCharacters : Node = null

	// 摄像机
	@property({ type: Camera })
	mainCamera : Camera = null

	// Canvas节点
	@property({ type: Node })
	canvasNode : Node = null

	// 头顶偏移
	private _offset : Vec3 = new Vec3(0, 1.8, 0)

	// 分辨率适配相关变量
	private _canvasUITrans : UITransform = null

	// 用户昵称
	userName : Node = null

	//其他角色昵称
	otherUserName : Node[] = []

	/**
	 * 开始
	 */
	start() {
		this.userName = instantiate(this.userNamepre);
		this.node.addChild(this.userName);
		this.roomCharacters.children.forEach((child) => {
			const otherName = instantiate(this.otherUserNamepre);
			otherName.getComponent(Label).string = child['roleName'];
			this.otherUserName.push(otherName);
			this.node.addChild(otherName);
		});
		if (this.canvasNode) {
			this._canvasUITrans = this.canvasNode.getComponent(UITransform)
		}
	}

	/**
	 * 更新
	 */
	update(dt : number) {
		if (
			!this.playerNode ||
			!this.userNamepre ||
			!this.mainCamera ||
			!this.canvasNode ||
			!this._canvasUITrans
		)
			return

		// 设置UI节点位置
		this.userName.setPosition(this.calculateRoleHeadWorldPos(this.playerNode))
		this.roomCharacters.children.forEach((child, index) => {
			this.otherUserName[index].setPosition(this.calculateRoleHeadWorldPos(child))
		});
	}

	/**
	 * 设置角色头顶世界坐标 
	 */
	calculateRoleHeadWorldPos(playerNode) {
		// 计算头顶世界坐标
		const headWorldPos = playerNode.getWorldPosition().add(new Vec3(this._offset))

		// 世界坐标转屏幕坐标
		const screenPos = new Vec3()
		this.mainCamera.worldToScreen(headWorldPos, screenPos)

		// 修正屏幕坐标，确保X轴居中
		const correctedScreenPos = this.correctScreenPosition(screenPos)

		// 屏幕坐标转UI坐标
		const uiPos = new Vec3()
		this._canvasUITrans.convertToNodeSpaceAR(correctedScreenPos, uiPos)

		return uiPos
	}

	/**
	 * 修正屏幕坐标，解决X轴不居中问题
	 */
	correctScreenPosition(screenPos : Vec3) {
		const canvasSize = this.getCanvasSize()
		const designSize = view.getDesignResolutionSize()

		// 基于设计分辨率的简单修正
		const scaleX = canvasSize.width / designSize.width
		const scaleY = canvasSize.height / designSize.height

		// 使用统一的缩放因子（选择较小的那个，确保内容完全显示）
		const scale = Math.min(scaleX, scaleY)

		// 计算居中偏移
		const offsetX = (canvasSize.width - designSize.width * scale) / 2
		const offsetY = (canvasSize.height - designSize.height * scale) / 2

		// 应用修正
		const correctedX = (screenPos.x - offsetX) / scale
		const correctedY = (screenPos.y - offsetY) / scale

		return new Vec3(correctedX, correctedY, 0)
	}

	/**
	 * 获取当前Canvas的实际尺寸
	 */
	getCanvasSize() {
		return {
			width: view.getCanvasSize().width,
			height: view.getCanvasSize().height
		}
	}
}