import { _decorator, Component, Node, isValid, view, sys } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MethodTools')
export class MethodTools extends Component {
    
    //偏移方向
    @property()
    offsetDirection : string = '';

    /**
     * 开始
     */
    start() {
        // 如果偏移方向为空，则不进行偏移
        if (!this.offsetDirection) {
            return;
        }
        // 获取设计分辨率和可见区域尺寸 
        let designSize = view.getDesignResolutionSize();
        
        // 计算当前屏幕宽高比与设计宽高比
        let scale = window.innerHeight / designSize.height;
        let effectiveWidth = designSize.width * scale;
        let offsetX = (window.innerWidth - effectiveWidth) / 2;
        
        // 根据偏移方向应用水平偏移
        if (this.offsetDirection === 'left') {
            this.node.setPosition(this.node.position.x - offsetX, this.node.position.y, this.node.position.z);
        } else if (this.offsetDirection === 'right') {
            this.node.setPosition(this.node.position.x + offsetX, this.node.position.y, this.node.position.z);
        }
    }
    

    /**
     * 关闭页面
     */
    closePage(node: Node) {
        // 销毁组件
        if (isValid(this.node)) {
            this.node.destroy();
        }
    }
}


