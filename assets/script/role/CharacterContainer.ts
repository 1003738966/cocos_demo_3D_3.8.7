import { _decorator, Component, Node, Vec3, SkeletalAnimation, Prefab, instantiate, tween, Quat } from 'cc';
import pako from '../utils/Pako.js';
import { Utils } from '../utils/Utils';
import { ZIMManager } from '../zim/ZIMManage';
const { ccclass, property } = _decorator;

@ccclass('CharacterController')
export class CharacterController extends Component {

    // ZIM管理器
    private zimManager: ZIMManager = ZIMManager.getInstance();

    // 角色预制体
    @property(Prefab)
    characterPrefab: Prefab = null!;

    // 房间角色数据集合
    private _roomCharacters: any[] = [];
    
    // 角色映射表
    private _characterNodes: Map<string, Node> = new Map();

    // 总动画时长
    private totalAnimationDuration: number = 1.0;

    // 初始坐标
    private defaultPosition = {
		roomID: this.zimManager.getCurrentRoomID(),
        position: new Vec3(-1.008, 29.8, 2.493),
        rotation: new Vec3(0, 0, 0),
		scale: new Vec3(3, 3, 3),
        _anim: 'idle'
    }

    /**
     * 开始
     */
    start() {
        this.setupRoomCallbacks();
    }

	/**
	 * 房间成员加入和消息接收回调
	 */
    setupRoomCallbacks() {
        // 处理房间成员加入
        this.zimManager.setRoomCallback('onRoomMemberJoined', (data: any) => {
            if (data.roomID == this.zimManager.getCurrentRoomID()) {
                data.memberList.forEach((member: any) => {
                    this.addOrUpdateCharacter({
                        ...member,
                        ...this.defaultPosition
                    });
                });
            }
        });

        // 处理房间成员离开
        this.zimManager.setRoomCallback('onRoomMemberLeft', (data: any) => {
            if (data.roomID == this.zimManager.getCurrentRoomID()) {
                data.memberList.forEach((member: any) => {
                    this.removeCharacter(member.userID);
                });
            }
        });

        // 处理房间消息
        this.zimManager.setRoomCallback('onRoomMessageReceived', (data: any) => {
            if (data.messageList && data.messageList.length > 0) {
                data.messageList.forEach((res: any) => {
                    const message = JSON.parse(pako.inflateRaw(new Utils().base64ToUint8Array(res.message), { to: 'string' }));
                    if (message.roomID == this.zimManager.getCurrentRoomID()) {
                        this.addOrUpdateCharacter(message);
                    }
                });
            }
        });
    }

	/**
	 * 添加或更新角色
	 */
    addOrUpdateCharacter(characterData) {
        const existingIndex = this._roomCharacters.findIndex(
            char => char.userID === characterData.userID
        );

        if (existingIndex !== -1) {
            // 更新现有角色
            this.updateCharacter(existingIndex, characterData);
        } else {
            // 创建新角色
            this.createCharacter(characterData);
        }
    }

	/**
	 * 更新角色
	 */
    updateCharacter(index, characterData) {
        // 更新角色数据
        this._roomCharacters[index] = characterData;

        // 更新对应的节点
        const characterNode = this._characterNodes.get(characterData.userID);
        if (characterNode) {

            this.executeSmoothAnimation(characterNode, characterData);
        }
    }

    /**
     * 执行平滑动画
     */
    executeSmoothAnimation(characterNode, characterData) {
        // 停止之前的动画
        tween(characterNode).stop();
        if (characterData.dataArray && characterData.dataArray.length > 0) {
            // 处理数据数组
            this.executeSequenceAnimation(characterNode, characterData.dataArray);
        }
    }

    /**
     * 执行序列
     */
    executeSequenceAnimation(characterNode, characterData) {
        const dataArray = characterData;
        const frameCount = dataArray.length;
        const durationPerFrame = this.totalAnimationDuration / frameCount;

        // 停止之前的动画避免叠加
        tween(characterNode).stop();

        let sequenceTween = tween(characterNode);
        
        // 构建动画序列
        dataArray.forEach((frameData: any, frameIndex: number) => {

            sequenceTween = sequenceTween
                .to(durationPerFrame, {
                    position: frameData.position,
                    rotation: frameData.rotation,
                })
                .call(() => {
                    if (frameData._anim && characterNode['_anim'] !== frameData._anim) {
                        const anim = characterNode.getComponent(SkeletalAnimation);
                        if (anim) {
                            anim.crossFade(frameData._anim);
                            characterNode['_anim'] = frameData._anim;
                        }
                    }
                });
        });
        
        sequenceTween.start();
    }

    /**
     * 旋转补偿
     */
    applyRotationCompensation(characterNode, ratio) {
        const spineNode = characterNode.getChildByName('Spine');
        if (spineNode) {
            const compensationAngle = Math.sin(ratio * Math.PI) * 0.08;
            spineNode.setRotationFromEuler(0, compensationAngle, 0);
        }
    }

	/**
	 * 创建角色
	 */
    createCharacter(characterData) {
        // 添加到角色数据列表
        this._roomCharacters.push(characterData);
        
        // 创建角色节点
        const characterNode = instantiate(this.characterPrefab);
		if (characterNode) {
			characterNode.setPosition(characterData.position);
			characterNode.setRotation(characterData.rotation);
			characterNode.setScale(characterData.scale);
            characterNode['_anim'] = characterData._anim;
			characterNode['userID'] = characterData.userID;
			
			this.node.addChild(characterNode);
			this._characterNodes.set(characterData.userID, characterNode);
		}
    }

	/**
	 * 删除角色
	 */
    removeCharacter(userID) {
        const index = this._roomCharacters.findIndex(char => char.userID === userID);
        if (index !== -1) {
            this._roomCharacters.splice(index, 1);
            
            const node = this._characterNodes.get(userID);  
            if (node) {
                node.destroy();
                this._characterNodes.delete(userID);
            }
        }
    }


	/**
	 * 销毁
	 */
    onDestroy() {
        // 清理所有角色节点
        this._characterNodes.forEach((node, userID) => {
            node.destroy();
        });
        this._characterNodes.clear();
        this._roomCharacters = [];
    }
}