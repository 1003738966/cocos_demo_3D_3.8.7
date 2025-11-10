import { _decorator, Component, game,Prefab, instantiate, director, Label } from 'cc';
import { ZIMManager } from './zim/ZIMManage';
import { Utils } from './utils/Utils'
const { ccclass, property } = _decorator;

@ccclass('Game')
export class Game extends Component {

	// ZIM管理器
	private zimManager: ZIMManager = ZIMManager.getInstance();

	// 房间成员集合
	private roomMembers: any[] = [];

	// 用户信息
	private userInfo: any = {
		userID: 'wuchao3',
		userName: 'wuchao3',
		token: '04AAAAAGkSjpIADMZ+0cl+4gGREGVmBQCxSobA7VgHTjTkunRLJIcGtqUTrSLUwC//pFSd/hfD2AmniiFEvNKXlcwtZUkLJZJ9yJklWKDtkuyW7uszRZTWX/Yfki0k9e+7pSQqYvEWgTMuKzC06nsvkk6EJ90VJ1UxaCEnDCZXnj45ZB4zkqGtHwG0WLNuyr0hkmrDmU1ACXKFjpWKMiK8Y1iyU62QxHy1DL6DndfCJrrP4X94NwBQASJyEqlYudKHc46h+mIyySF3AQ==',
		roomID: '123456'
	};

	/**
	 * 初始化
	 */
	async onLoad() {
		// 设置游戏帧率
		game.setFrameRate(30);
        // 初始化ZIM
        await this.zimManager.initialize();
		// 登录ZIM
		await this.zimManager.login(this.userInfo.userID, this.userInfo.token, this.userInfo.userName);
		// 加入房间
		await this.zimManager.joinRoom(this.userInfo.roomID);
		// 监听unload事件
        window.addEventListener('unload', this.onUnload.bind(this))
	}
	

	/**
	 * 开始
	 */
	start() {
		// 禁用console
		// new Utils().rewirteLog()
		// 移除loading
		let loading = document.getElementById('loading');
		if (loading) {
			loading.remove();
		}
	}

	/**
	 * 页面卸载
	 */
	onUnload() {
		// 离开房间
		this.zimManager.leaveRoom();
	}

	/**
	 * 销毁
	 */
	onDestroy() {
		// 离开房间
		this.zimManager.leaveRoom();
	}
}