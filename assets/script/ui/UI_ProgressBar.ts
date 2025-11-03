import { _decorator, Component, Node, Vec2, Color, Graphics } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 圆形进度条
 */
@ccclass('UI_ProgressBar')
export class UI_ProgressBar extends Component {
    // 进度值0~100
    @property
    progress = 0;

    // 圆环半径
    @property
    radius = 50;

    // 圆环厚度
    @property
    thickness = 5;

    // 进度条颜色
    @property(Color)
    color = Color.WHITE;

    // 背景颜色
    @property(Color)
    backgroundColor = new Color(100, 100, 100, 128);

    // Graphics组件
    private graphics: Graphics = null;

    /**
     * 初始化
     */
    onLoad() {
        this.graphics = this.node.getComponent(Graphics);
        if (!this.graphics) {
            this.graphics = this.node.addComponent(Graphics);
        }
        this.updateProgress();
    }

    /**
     * 更新
     */
    update(dt: number) {
        this.updateProgressSmoothly(this.progress);
    }

    /**
     * 更新进度条
     */
    updateProgress() {
        if (this.graphics) {
            this.graphics.clear();
            
            const center = Vec2.ZERO;
            
            // 绘制背景圆环
            this.graphics.lineWidth = this.thickness - 1;
            this.graphics.strokeColor = this.backgroundColor;
            this.graphics.circle(center.x, center.y, this.radius);
            this.graphics.stroke();
            
            // 绘制进度圆弧
            if (this.progress > 0 && this.progress <= 100) {
                const startAngle = Math.PI / 2;
                const endAngle = startAngle + (2 * Math.PI * (this.progress / 100));
                
                this.graphics.lineWidth = this.thickness;
                this.graphics.strokeColor = this.color;
                
                // 使用moveTo定位到起点，然后绘制圆弧
                const startX = center.x + this.radius * Math.cos(startAngle);
                const startY = center.y + this.radius * Math.sin(startAngle);
                this.graphics.moveTo(startX, startY);
                this.graphics.arc(center.x, center.y, this.radius, startAngle, endAngle, false);
                this.graphics.stroke();
            }
        }
    }

    /**
     * 设置进度
     */
    setProgress(value: number) {
        this.progress = Math.max(0, Math.min(100, value));
        this.updateProgress();
    }

    /**
     * 动态更新
     */
    updateProgressSmoothly(targetValue: number, duration: number = 0.5) {
        if (duration <= 0) {
            this.setProgress(targetValue);
            return;
        }
        this.setProgress(targetValue);
    }
}