import { UITransform, v3, EventTouch, _decorator, Component, Node, Prefab, instantiate, Widget, view, sys } from 'cc';
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

	// 其他精灵
	otherSprite : Node[] = []

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
		this.roomCharacters.children.forEach((child) => {
			const otherSprite = instantiate(this.miniMapSprite);
			this.otherSprite.push(otherSprite);
			this.node.addChild(otherSprite);
		});
	}

	/**
	 * 更新
	 */
	update(dt : number) {
		/** 小地图角色位置 */
		this.smallRole.setPosition(this.calculateSmallRolePosition(this.node_role).smallRoleX, -this.calculateSmallRolePosition(this.node_role).smallRoleY, 0);
		/** 其他精灵位置 */
		this.roomCharacters.children.forEach((child, index) => {
			this.otherSprite[index].setPosition(this.calculateSmallRolePosition(child).smallRoleX, -this.calculateSmallRolePosition(child).smallRoleY, 0);
		});
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
}