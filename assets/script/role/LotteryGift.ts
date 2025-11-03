import { Prefab, resources, Sprite, Vec3, UITransform, SpriteFrame, instantiate, NodePool, _decorator, Component, tween } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 抽奖模块
 */
@ccclass('LotteryGift')
export class LotteryGift extends Component {

    // 图片预制体(目前先用静态图片，后面可以换成动态图片)
    @property(Prefab)
    lotteryScrollItem: Prefab = new Prefab()
    lotteryScrollItemNodePool: NodePool = new NodePool()
    lotteryScrollItemSpritePathArray = [
        "lottery/32981-头像框-天蝎座/spriteFrame",
        "lottery/32982-头像框-天秤座/spriteFrame",
        "lottery/32983-头像框-水瓶座/spriteFrame",
        "lottery/32984-头像框-双子座/spriteFrame",
        "lottery/32985-头像框-双鱼座/spriteFrame",
        "lottery/32986-头像框-狮子座/spriteFrame",
        "lottery/32987-头像框-射手座/spriteFrame",
        "lottery/32988-头像框-白羊座/spriteFrame",
        "lottery/32989-头像框-摩羯座/spriteFrame",
        "lottery/32990-头像框-巨蟹座/spriteFrame",
        "lottery/32991-头像框-金牛座/spriteFrame",
        "lottery/32992-头像框-处女座/spriteFrame"
    ]

    // 抽奖滚动数量
    lotteryScrollCount = 12

    // 是否是第一次滚动
    isFirstRoll = true

    // 是否正在滚动
    isRolling = false

    // 结果
    resultArray = [0,1,2]

    /**
     * 开始
     */
    start() {
        // 预加载图片
        this.lotteryScrollItemSpritePathArray.forEach((spritePath)=>{
            resources.preload(spritePath, SpriteFrame)
        })
        this.setLayoutContent()
        // 滚动抽奖
        this.scheduleOnce(()=>{
            this.handleRolling()
        }, 0.5)
    }

    /**
     * 设置滚动内容
     */
    setLayoutContent() {
        // 清空窗口内容
        this.node.children.forEach((child)=>{
            while (child.children[0].children.length > 0) {
                this.lotteryScrollItemNodePool.put(child.children[0].children[child.children[0].children.length-1])
            }
        })

        // 重设窗口位置
        this.node.children.forEach((child)=>{
            child.children[0].setPosition(0, -90, 0)
        })

        // 中奖结果
        this.node.children.forEach((child)=>{
            for (let i=0; i<this.resultArray.length; i++) {
                let item = this.spawnItem(this.lotteryScrollItemSpritePathArray[this.resultArray[i]])
                child.children[0].addChild(item)
            }
        })

        // 设置滚动内容
        this.node.children.forEach((child,index)=>{
            for (let i=0; i<this.lotteryScrollCount*(index+1)-3; i++) {
                let item = this.spawnItem(this.lotteryScrollItemSpritePathArray[this.getRandomIndex()])
                child.children[0].addChild(item)
            }
        })

        // 设置默认图片
        this.node.children.forEach((child)=>{
            for (let i=0; i<3; i++) {
                let path = this.lotteryScrollItemSpritePathArray[this.getRandomIndex()]
                child.children[0].addChild(this.spawnItem(path))
            }
        })
    }

    /**
     * 生成item
     */
    spawnItem(spritePath) {
        // 生成item
        let item = null
        if (this.lotteryScrollItemNodePool.size() > 0) {
            item = this.lotteryScrollItemNodePool.get()
        } else {
            item = instantiate(this.lotteryScrollItem)
        }

        // 设置图片
        resources.load(spritePath, SpriteFrame, (err, asset)=>{
            if (!err) {
                try {
                    item.getComponent(Sprite).spriteFrame = asset;
                    item.getComponent(UITransform).width = 60
                    item.getComponent(UITransform).height = 60 
                } catch (error) {}
            }
        })
        return item
    }

    /**
     * 随机获取一张图片的索引
     */
    getRandomIndex() {
        let index = Math.floor(Math.random() * this.lotteryScrollItemSpritePathArray.length)
        return index
    }

    /**
     * 处理滚动
     */
    handleRolling() {
        // 如果正在滚动，不能进行操作
        if (this.isRolling) {
            return
        }

        // 设置为正在滚动
        this.isRolling = true

        // 设置窗口滚动内容
        if (this.isFirstRoll) {
            this.isFirstRoll = false
        } else {
            this.setLayoutContent()
        }

        // 滚动窗口
        this.node.children.forEach((child,index)=>{
            let itemHeight = child.children[0].children[0].getComponent(UITransform).height
            tween(child.children[0])
                .by(3*(index+1), {position: new Vec3(0, -(this.lotteryScrollCount*(index+1))*itemHeight, 0)}, {easing: 'sineInOut'})
                .start()
        })
    }
}




