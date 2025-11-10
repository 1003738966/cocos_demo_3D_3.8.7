import { _decorator, Camera, Component, Node, UITransform, Vec3, view, macro, Prefab, instantiate, Label } from 'cc'
import { ZIMManager } from '../zim/ZIMManage';
import { Utils } from '../utils/Utils';
import pako from '../utils/Pako.js';
const { ccclass, property } = _decorator

@ccclass('UI_Follow')
export class UI_Follow extends Component {

	// ZIM管理器
	private zimManager: ZIMManager = ZIMManager.getInstance();

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

	// 其他角色昵称映射
	private _otherUserNameMap : Map<string, Node> = new Map()

	/**
	 * 开始
	 */
	start() {
		this.userName = instantiate(this.userNamepre);
		this.zimManager.setRoomCallback('onRoomStateChanged', (data: any) => {
			this.userName.getComponent(Label).string = this.zimManager.getUserInfo().userName;
		});

		this.node.addChild(this.userName);

	    this.setupRoomCallbacks();
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
			!this._canvasUITrans ||
			!this._otherUserNameMap
		)
			return

		// 设置UI节点位置
		this.userName.setPosition(this.calculateRoleHeadWorldPos(this.playerNode));
		this._otherUserNameMap.forEach((nameNode, userID) => {
			const characterNode = this.roomCharacters.children.find((child: Node) => child['userID'] === userID);
			if (characterNode) {
				nameNode.setPosition(this.calculateRoleHeadWorldPos(characterNode));
			}
		});
	}

	/**
	 * 房间成员加入和消息接收回调
	 */
	setupRoomCallbacks() {
		this.zimManager.setRoomCallback('onRoomMemberJoined', (data: any) => {
			data.memberList.forEach((member: any) => {
				this.createOtherUserName(member.userID, member.userName);
			});
		});

		this.zimManager.setRoomCallback('onRoomMemberLeft', (data: any) => {
            if (data.roomID == this.zimManager.getCurrentRoomID()) {
                data.memberList.forEach((member: any) => {
                    this.removeOtherUserName(member.userID);
                });
            }
        });

        this.zimManager.setRoomCallback('onRoomMessageReceived', (data: any) => {
            if (data.messageList && data.messageList.length > 0) {
                data.messageList.forEach((res: any) => {
                    const message = JSON.parse(pako.inflateRaw(new Utils().base64ToUint8Array(res.message), { to: 'string' }))
                    if (message.roomID == this.zimManager.getCurrentRoomID()) {
						if (!this._otherUserNameMap.has(message.userID)) {
							this.createOtherUserName(message.userID, message.userName);
						}
                    }
                });
            }
        });
	}

	/**
	 * 创建指定用户昵称
	 */
	createOtherUserName(userID, userName) {
        const otherName = instantiate(this.otherUserNamepre);
        otherName.getComponent(Label).string = userName;
        this._otherUserNameMap.set(userID, otherName);
		this.scheduleOnce(() => {
			this.node.addChild(otherName);
		}, 0.5)
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

	/**
	 * 删除其他角色昵称
	 */
	removeOtherUserName(userID) {
		// 删除昵称
		const otherName = this._otherUserNameMap.get(userID);
		if (otherName) {
			otherName.destroy();
		}
	}

	/**
	 * 销毁
	 */
	onDestroy() {
		this._otherUserNameMap.forEach((nameNode, userID) => {
			nameNode.destroy();
		});
		this._otherUserNameMap.clear();
	}
}