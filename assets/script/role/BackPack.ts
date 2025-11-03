import { _decorator, Component, Node, UITransform, Widget } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BackPack')
export class BackPack extends Component {
    
    /**
     * 开始
     */
    start() {
        this.node.on(Node.EventType.TOUCH_START, this.closeOperation, this)
        this.node.children.forEach(child => {
            if (child.name === 'Item') {
                child.on(Node.EventType.TOUCH_START, () => this.onItemClick(child), this)
            }
        })
    }

    /**
     * 点击物品
     */
    onItemClick(item: Node) {
        const operation = this.node.parent.getChildByName('Operation')
        operation.getComponent(Widget).left = item.getComponent(Widget).left
        operation.getComponent(Widget).top = item.getComponent(Widget).top + item.getComponent(UITransform).height
        operation.active = true
    }

    /**
     * 关闭弹窗
     */
    closeOperation(event) {
        if (event.target.name === 'Operation') {
            return
        } else if (event.target.name !== 'Item') {
            this.node.parent.getChildByName('Operation').active = false
        }
    }
}


