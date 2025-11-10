import { _decorator, Component, Node, Prefab, instantiate, Vec3, SkeletalAnimation, tween, v3, assetManager, SpriteRenderer, SpriteFrame, Label, Color } from 'cc';
import pako from '../utils/Pako.js';
import { Utils } from '../utils/Utils';
import { ZIMManager } from '../zim/ZIMManage';
const { ccclass, property } = _decorator;

@ccclass('CharacterPits')
export class CharacterPits extends Component {

	// 挖坑次数按钮
	@property([Node])
	DigCountNodes : Node[] = [];

	// 角色
	@property(Node)
	CharacterNode : Node = null;

	// 礼物预制体
	@property(Prefab)
	GiftPrefab : Prefab = null!;

	// 坑
	@property(Prefab)
	HolePrefab : Prefab = null;

	// 散落半径
	@property()
	scatterRadius : number = 1;

	// 散落高度
	@property()
	scatterHeight : number = 2;

	// 散落时长
	@property()
	animationDuration : number = 2.5;

	// 挖坑次数
	private _digCount : number = 0;
	// 检测半径
	private readonly HOLE_DETECTION_RADIUS : number = 0.5;
	// 礼物数量
	private NUM_GIFTS : Node[] = [
		{
			id: 1,
			name: 'gift1',
			url: 'https://yeguo-public.oss-cn-beijing.aliyuncs.com/public/1/resource/base/frame/1_1760084450645_32992-头像框-处女座.png'
		},
		{
			id: 2,
			name: 'gift2',
			url: 'https://yeguo-public.oss-cn-beijing.aliyuncs.com/public/1/resource/base/frame/1_1760084781811_32985-头像框-双鱼座.png'
		},
		{
			id: 3,
			name: 'gift3',
			url: 'https://yeguo-public.oss-cn-beijing.aliyuncs.com/public/1/resource/base/frame/1_1760084865985_32983-头像框-水瓶座.png'
		}
	] as any;

	// ZIM管理器
	private zimManager: ZIMManager = ZIMManager.getInstance();

	// 土坑索引
	private _holeIndex : number = 1;

	// 现有土坑
	private _existingHoles: Map<string, Node> = new Map();

	/**
	 * 开始
	 */
	start() {
		this.DigCountNodes.forEach(node => {
			node.on(Node.EventType.TOUCH_START, this.onDigCountClick, this);
		});
		
		// 处理房间消息
        this.zimManager.setRoomCallback('onRoomMessageReceived', (data: any) => {
            if (data.messageList && data.messageList.length > 0) {
                data.messageList.forEach((res: any) => {
                    const message = JSON.parse(pako.inflateRaw(new Utils().base64ToUint8Array(res.message), { to: 'string' }));
                    if (message.roomID == this.zimManager.getCurrentRoomID()) {
						this.batchUpdatePits(message.pits, message._anim);
                    }
                });
            }
        });
	}

	/**
	 * 挖坑次数按钮点击事件
	 */
	onDigCountClick() {
		this.createPitIfPossible();
	}

	/**
	 * 所有土坑数据更新
	 */
    batchUpdatePits(pitsData, anim) {
		const currentHoleIds = new Set<string>();
        // 更新或创建土坑
        pitsData.forEach(pit => {
            const holeId = pit.holeId.toString();
            currentHoleIds.add(holeId);
            
            let holeNode = this._existingHoles.get(holeId);
            
            if (holeNode) {
                // 更新现有土坑属性
                this.updateExistingHole(holeNode, pit);
            } else {
                // 创建新土坑
                holeNode = this.createNewHole(pit, anim);
                this._existingHoles.set(holeId, holeNode);
            }
        });
		this._holeIndex = Math.max(this._existingHoles.size, pitsData.length) + 1;
    }

	/**
     * 更新现有土坑
     */
    updateExistingHole(holeNode: Node, pitData: any) {
        // 仅更新属性，不更新位置（避免土坑随人物移动）
		holeNode['holeId'] = pitData.holeId;
        holeNode['holeNum'] = pitData.holeNum;
        holeNode['giftData'] = pitData.giftData;
		holeNode['holePosition'] = pitData.holePosition;

        // 更新位置
        holeNode.setPosition(pitData.holePosition);
    }

	/**
	 * 创建新土坑
	 */
    createNewHole(pitData, anim) {
        const hole = instantiate(this.HolePrefab);
        // 设置土坑属性
        hole['holeId'] = pitData.holeId;
        hole['holeNum'] = pitData.holeNum;
        hole['giftData'] = pitData.giftData;
		hole['holePosition'] = pitData.holePosition;
        
        // 设置位置
        const position = new Vec3(
            pitData.holePosition.x,
            pitData.holePosition.y,
            pitData.holePosition.z
        );
        hole.setPosition(position);
		if (anim == 'revive') {
			this.scheduleOnce(() => {
				this.node.addChild(hole);
				this.CharacterNode.getComponent(SkeletalAnimation).play('idle');
				this.CharacterNode['_anim'] = 'idle';
				this.createScatterGifts(hole.position, hole['holeId']);
			}, 1);
		} else {
			this.node.addChild(hole);
		}
        
        return hole;
    }

	// 检测是否可以创建土坑
	createPitIfPossible() {
		// 检查周围是否有土坑
		const existingHoles = this.node.children.filter(child => {
			return child.name.includes('Pit');
		});

		let hasNearbyHole = false;

		// 检查距离
		for (const existingHole of existingHoles) {
			const dx = this.CharacterNode.position.x - existingHole.position.x;
			const dz = this.CharacterNode.position.z - existingHole.position.z;
			const distance = Math.sqrt(dx * dx + dz * dz);
			if (distance < this.HOLE_DETECTION_RADIUS) {
				hasNearbyHole = true;
				break;
			}
		}

		// 如果旁边没有土坑，才创建新的土坑
		if (!hasNearbyHole) {
			this.createNewPit();
		} else {
			console.log('旁边已有土坑，跳过创建播放挖宝动画');
			this.CharacterNode.getComponent(SkeletalAnimation).play('revive');
			this.CharacterNode['_anim'] = 'revive';
			this.scheduleOnce(() => {
				this.CharacterNode.getComponent(SkeletalAnimation).play('idle');
				this.CharacterNode['_anim'] = 'idle';
			}, 1);
		}
	}

	// 创建土坑
	createNewPit() {
		this.CharacterNode.getComponent(SkeletalAnimation).play('revive');
		this.CharacterNode['_anim'] = 'revive';
		const hole = instantiate(this.HolePrefab);
		hole['holeId'] = this._holeIndex;
		hole['holeNum'] = this._digCount;
		hole['giftData'] = this.NUM_GIFTS;
		hole['holePosition'] = this.CharacterNode.position;
		this._existingHoles.set(hole['holeId'].toString(), hole);
		hole.setPosition(
			this.CharacterNode.position.x,
			this.CharacterNode.position.y,
			this.CharacterNode.position.z
		);
		this._holeIndex++;
		this.scheduleOnce(() => {
			this.node.addChild(hole);
			this.CharacterNode.getComponent(SkeletalAnimation).play('idle');
			this.CharacterNode['_anim'] = 'idle';
			this.createScatterGifts(hole.position, hole['holeId']);
		}, 1);
	}

	// 创建散落礼物
	createScatterGifts(centerPos : Vec3, holeId : number) {
		for (let i = 0; i < this.NUM_GIFTS.length; i++) {
			this.createSingleGift(centerPos, i, holeId);
		}
		// 删除礼物
		this.scheduleOnce(() => {
			this.node.children.forEach(child => {
				if (child['giftId'] && child['holeId'] == holeId) {
					child.destroy();
				}
			});
		}, this.animationDuration + 5);
	}

	// 创建单个礼物
	createSingleGift(centerPos : Vec3, index : number, holeId : number) {
		const gift = instantiate(this.GiftPrefab);
		gift['giftId'] = this.NUM_GIFTS[index]['id'];
		gift['holeId'] = holeId;
		// 加载精灵图
		assetManager.loadRemote(this.NUM_GIFTS[index]['url'], (err, texture) => {
			if (!err) {
				const spriteFrame = SpriteFrame.createWithImage(texture as any);
				gift.getComponent(SpriteRenderer).spriteFrame = spriteFrame;
			}
		});
		this.node.addChild(gift);

		const angleStep = 360 / this.NUM_GIFTS.length;
		const angle = index * angleStep;
		// 转换为弧度
		const radian = angle * Math.PI / 180;

		// 计算目标位置（极坐标转笛卡尔坐标）
		const radius = this.scatterRadius * (0.8 + Math.random() * 0.4); // 随机半径偏移
		const targetX = centerPos.x + radius * Math.cos(radian);
		const targetZ = centerPos.z + radius * Math.sin(radian);
		const targetY = centerPos.y + this.scatterHeight;

		// 设置初始位置（土坑中心）
		gift.setPosition(centerPos);

		// 执行散落动画
		tween(gift)
			.to(this.animationDuration,
				{
					position: new Vec3(targetX, targetY, targetZ)
				},
				{
					easing: 'backOut' // 弹性效果
				}
			)
			.call(() => {
				// 落地后的小幅弹跳
				tween(gift)
					.to(0.2, { position: new Vec3(targetX, centerPos.y + 1, targetZ) })
					.to(0.1, { position: new Vec3(targetX, centerPos.y, targetZ) })
					.start();
			})
			.start();
	}
}