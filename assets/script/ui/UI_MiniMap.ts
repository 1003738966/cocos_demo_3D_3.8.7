import { UITransform, v3, EventTouch, _decorator, Component, Node, Prefab, instantiate, Widget, view, sys } from 'cc';
import pako from '../utils/Pako.js';
import { Utils } from '../utils/Utils';
import { ZIMManager } from '../zim/ZIMManage';
const { ccclass, property } = _decorator;

/** 
 * 
 * 角色移动时，小地图上的角色也会跟着移动
 * */
@ccclass('MiniMap')
export class MiniMap extends Component {

	// 地图宽度
	@property()
	MapWidth : number = 0

	@property()
	// 地图高度
	MapHeight : number = 0

	// 角色节点
	@property(Node)
	node_role : Node = null

	// 小地图节点
	@property(UITransform)
	trans_smallMap : UITransform = null

	// 小地图角色精灵
	@property(Prefab)
	node_smallRole : Prefab = null

	// 角色容器
	@property(Node)
	roomCharacters : Node = null

	// 其他精灵
	@property(Prefab)
	miniMapSprite : Prefab = null

	// 地图中心点位置
	mapCenterX : number
	mapCenterY : number

	// 小地图宽高
	smallMapWidth : number
	smallMapHeight : number

	// 小地图的中心位置
	smallMapCenterX : number
	smallMapCenterY : number

	// 小地图角色精灵
	smallRole : Node = null

	// ZIM管理器
	private zimManager: ZIMManager = ZIMManager.getInstance();
	// 角色映射表
	private _characterNodes: Map<string, Node> = new Map();

	/**
	 * onLoad
	 */
	onLoad() {
		this.mapCenterX = this.MapWidth / 2;
		this.mapCenterY = this.MapHeight / 2;

		this.smallMapWidth = this.trans_smallMap.width;
		this.smallMapHeight = this.trans_smallMap.height;
		this.smallMapCenterX = this.smallMapWidth / 2;
		this.smallMapCenterY = this.smallMapHeight / 2;
	}

	/**
	 * 开始
	 */
	start() {
		this.smallRole = instantiate(this.node_smallRole);
		this.node.addChild(this.smallRole);
		this.setupRoomCallbacks();
	}

	/**
	 * 更新
	 */
	update(dt : number) {
		/** 小地图角色位置 */
		this.smallRole.setPosition(this.calculateSmallRolePosition(this.node_role).smallRoleX, -this.calculateSmallRolePosition(this.node_role).smallRoleY, 0);
		/** 其他精灵位置 */
		this._characterNodes.forEach((nameNode, userID) => {
			const characterNode = this.roomCharacters.children.find((child: Node) => child['userID'] === userID);
			if (characterNode) {
				nameNode.setPosition(this.calculateSmallRolePosition(characterNode).smallRoleX, -this.calculateSmallRolePosition(characterNode).smallRoleY, 0)
			}
		});
	}

	/**
	 * 房间成员加入和消息接收回调
	 */
	setupRoomCallbacks() {
		this.zimManager.setRoomCallback('onRoomMemberJoined', (data: any) => {
			data.memberList.forEach((member: any) => {
				this.createOtherSprite(member.userID);
			});
		});

		this.zimManager.setRoomCallback('onRoomMemberLeft', (data: any) => {
            if (data.roomID == this.zimManager.getCurrentRoomID()) {
                data.memberList.forEach((member: any) => {
                    this.removeOtherSprite(member.userID);
                });
            }
        });

        this.zimManager.setRoomCallback('onRoomMessageReceived', (data: any) => {
            if (data.messageList && data.messageList.length > 0) {
                data.messageList.forEach((res: any) => {
                    const message = JSON.parse(pako.inflateRaw(new Utils().base64ToUint8Array(res.message), { to: 'string' }))
                    if (message.roomID == this.zimManager.getCurrentRoomID()) {
                        if (!this._characterNodes.has(message.userID)) {
							this.createOtherSprite(message.userID);
                        }
                    }
                });
            }
        });
	}

	/**
	 * 创建其他精灵
	 */
	createOtherSprite(userID: string) {
		const otherSprite = instantiate(this.miniMapSprite);
		this._characterNodes.set(userID, otherSprite);
		this.node.addChild(otherSprite);
	}

	/**
	 * 计算小地图角色位置
	 */
	calculateSmallRolePosition(role) {
		let offsetX = role.position.x - this.mapCenterX;
		let offsetY = role.position.z - this.mapCenterY;

		let percentX = (offsetX / this.mapCenterX) * 100;
		let percentY = (offsetY / this.mapCenterY) * 100;

		let smallRoleX = this.smallMapCenterX * percentX / 100 + this.smallMapCenterX;
		let smallRoleY = this.smallMapCenterY * percentY / 100 + this.smallMapCenterY;
		return {
			smallRoleX: smallRoleX,
			smallRoleY: smallRoleY
		}
	}

	/**
	 * 删除指定用户精灵
	 */
	removeOtherSprite(userID) {
		const otherSprite = this._characterNodes.get(userID);
		if (otherSprite) {
			otherSprite.destroy();
		}
	}

	/**
	 * 销毁
	 */
	onDestroy() {
		this._characterNodes.forEach((nameNode, userID) => {
			nameNode.destroy();
		});
		this._characterNodes.clear();
	}
}