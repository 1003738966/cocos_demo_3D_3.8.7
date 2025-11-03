import { _decorator, Camera, Component, Node, UITransform, Vec3, view, macro, Prefab, instantiate, Label } from 'cc'
const { ccclass, property } = _decorator

@ccclass('HoleLabel')
export class HoleLabel extends Component {

	// 礼物数量预制体
	@property({ type: Prefab })
	GiftLabelpre : Prefab = null

	// 礼物容器
	@property(Node)
	GiftContainers : Node = null

	// 摄像机
	@property({ type: Camera })
	mainCamera : Camera = null

	// Canvas节点
	@property({ type: Node })
	canvasNode : Node = null

	// 位置偏移
	private _offset : Vec3 = new Vec3(0.1, 0.2, 0)

	// 分辨率适配相关变量
	private _canvasUITrans : UITransform = null

	//礼物数量
	GiftLabels : Node[] = []

	/**
	 * 开始
	 */
	start() {
		if (this.canvasNode) {
			this._canvasUITrans = this.canvasNode.getComponent(UITransform)
		}
	}

	/**
	 * 更新
	 */
	update(dt : number) {
		if (
			!this.GiftLabelpre ||
			!this.mainCamera ||
			!this.canvasNode ||
			!this._canvasUITrans
		)
			return

		// 礼物数量更新
		this.node.removeAllChildren();
		this.GiftLabels = [];
		const giftChildren = this.GiftContainers.children.filter(child => child['name'] == 'Gift');
		giftChildren.forEach((giftChild, giftIndex) => {
			const GiftLabel = instantiate(this.GiftLabelpre);
			GiftLabel.children[0].getComponent(Label).string = '×18';
			this.GiftLabels.push(GiftLabel);
			this.node.addChild(GiftLabel);
			this.GiftLabels[giftIndex].setPosition(this.calculateRoleHeadWorldPos(giftChild));
		});
	}

	/**
	 * 设置礼物数量世界坐标 
	 */
	calculateRoleHeadWorldPos(Node) {
		// 计算礼物数量世界坐标
		const headWorldPos = Node.getWorldPosition().add(new Vec3(this._offset))

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