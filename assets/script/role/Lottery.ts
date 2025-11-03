import { _decorator, Component, Node, Prefab, instantiate } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Lottery')
export class Lottery extends Component {

    // 抽奖按钮
    @property(Node)
    lotteryButton: Node = null

    // 抽奖面板
    @property(Prefab)
    lotteryPanel: Prefab = null

    // 背包按钮
    @property(Node)
    bagButton: Node = null

    //背包面板
    @property(Prefab)
    bagPanel: Prefab = null

    start() {
        this.lotteryButton.on(Node.EventType.TOUCH_START, () => this.openPanel('lottery'), this)
        this.bagButton.on(Node.EventType.TOUCH_START, () => this.openPanel('bag'), this)
    }

    /**
     * 打开
     */
    openPanel(panelType: string) {
        let node = null
        switch (panelType) {
            case 'lottery':
                node = instantiate(this.lotteryPanel)
                break
            case 'bag':
                node = instantiate(this.bagPanel)
                break
            default:
                break
        }
        this.node.addChild(node)
    }
}


