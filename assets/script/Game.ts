import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('game')
export class game extends Component {

	start() {
		// 移除loading
		let loading = document.getElementById('loading');
		if (loading) {
			loading.remove();
		}
	}

	update(deltaTime : number) {

	}
}