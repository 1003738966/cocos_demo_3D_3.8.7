import { _decorator, Component, Node, Vec3, SkeletalAnimation, Prefab, instantiate } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CharacterController')
export class CharacterController extends Component {

	// 角色预制体
	@property(Prefab)
	characterPrefab : Prefab = null!;

	// 房间角色集合
	_roomCharacters : Node[] = [];

	/*** 开始 ***/
	start() {
		this.initializeCharacterCollection();
	}

	/*** 初始化房间角色集合 ***/
	initializeCharacterCollection() {
		this._roomCharacters = [
			{
				id: '1',   // ID
				name: "玩家001",  // 角色名称
				_anim: 'run',  // 动画
				rotation: new Vec3(0, 0, 0),  // 旋转
				position: new Vec3(-1.4105699062347412, 0.0000457763671875, 1.5517001152038574)  // 位置

			},
			{
				id: '2',
				name: "开发002",
				_anim: null,
				rotation: new Vec3(0, 90, 0),
				position: new Vec3(2.5311803817749023, 0.0062029361724853516, -2.4731011390686035)
			}
		] as any
		this.setRoomCharacterPosition();
	}

	/*** 设置房间角色位置 ***/
	setRoomCharacterPosition() {
		this._roomCharacters.forEach((character, index) => {
			const characterNode = instantiate(this.characterPrefab)
			characterNode.setPosition(character.position)
			characterNode['roleName'] = character['name'];
			characterNode['roleId'] = character['id'];
			this.node.addChild(characterNode)
		});
		// 更改ID为1的角色动画
		if (this.node.getChildByName('Role')['roleId'] == '1') {
			let anim = this.node.getChildByName('Role').getComponent(SkeletalAnimation);
			anim.play(this._roomCharacters[0]['_anim']);
		}
		this.scheduleOnce(() => {
			if (this.node.getChildByName('Role')['roleId'] == '1') {
				this.node.getChildByName('Role').setPosition(this._roomCharacters[0]['position'].x, this._roomCharacters[0]['position'].y, this._roomCharacters[0]['position'].z - 1);
				this.node.getChildByName('Role').setRotationFromEuler(this._roomCharacters[0]['rotation'].x, this._roomCharacters[0]['rotation'].y, this._roomCharacters[0]['rotation'].z);
			}
			this.scheduleOnce(() => {
				if (this.node.getChildByName('Role')['roleId'] == '1') {
					this.node.getChildByName('Role').setPosition(this._roomCharacters[0]['position'].x, this._roomCharacters[0]['position'].y, this._roomCharacters[0]['position'].z + 4);
					this.node.getChildByName('Role').setRotationFromEuler(this._roomCharacters[0]['rotation'].x, this._roomCharacters[0]['rotation'].y, this._roomCharacters[0]['rotation'].z + 4);
				}
			}, 5)
		}, 0.5)
	}
}