import { _decorator, Component, Node, view, sys, Label } from 'cc';
import { UI_ProgressBar } from '../ui/UI_ProgressBar';
const { ccclass, property } = _decorator;

@ccclass('CounterTime')
export class CounterTime extends Component {

    // 总时间
    @property
    public timeToRecover = 0;

    // 计时器文本
    @property(Label)
    labelTimer: Label = null!;

    // 进度条
    @property(Node)
    progress: Node = null!;

    // 计时器
    private _timer = 0;

    /**
     * 初始化
     */
    onLoad() {
        this._timer = 0;
    }

    /**
     * 更新
     */
    update(dt: number) {
        let ratio = this._timer / this.timeToRecover;
        this.progress.getComponents(UI_ProgressBar)[0].node.getComponent(UI_ProgressBar).progress = ratio * 100;
        let timeLeft = Math.floor(this.timeToRecover - this._timer);
        this.labelTimer.string = Math.floor(timeLeft / 60).toString() + ':' + (timeLeft % 60 < 10 ? '0' : '') + timeLeft % 60;
        this._timer += dt;
        if (this._timer >= this.timeToRecover) {
            this._timer = 0;
        }
    }
}


