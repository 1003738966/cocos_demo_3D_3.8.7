import ZIMSDK from './ZIMSDK.js';

/**
 * ZIM即时通讯管理器
 */
export class ZIMManager {
    
    // 单例实例
    private static _instance: ZIMManager;
    
    // ZIM SDK实例
    private _zim: any;
    
    // appID
    private _appID: number = 666172192;

    // 用户信息
    private _userInfo: {
        userID?: string;
        userName?: string;
    } = null;

    // 是否连接
    private _isConnected: boolean = false;

    // 当前房间ID
    private _currentRoomID: string = '';
    
    // 事件回调存储
    private _roomCallbacks = {};

    /**
     * 获取单例实例
     */
    public static getInstance(): ZIMManager {
        if (!ZIMManager._instance) {
            ZIMManager._instance = new ZIMManager();
        }
        return ZIMManager._instance;
    }

    /**
     * 初始化ZIM
     */
    initialize() {
        try {
            // 验证ZIM可用性
            if (typeof ZIMSDK?.ZIM?.create !== 'function') {
                return false;
            }

            // 创建ZIM实例
            this._zim = ZIMSDK.ZIM.create({
                appID: this._appID
            });

            this._setupEventListeners();

            return true;
        } catch (error) {

            return false;
        }
    }

    /**
     * 设置事件监听器
     */
   _setupEventListeners() {
        if (!this._zim) return;

        // 连接状态变化 
        // state  0：未连接 1：连接中 2：已连接 3：重新连接中
        this._zim.on('connectionStateChanged', (zim: any, data: any) => {
            this._isConnected = data.state;
            this._executeCallback('onConnectionStateChanged', data);
        });

        // 接收房间消息
        this._zim.on('roomMessageReceived', (zim: any, data: any) => {
            this._executeCallback('onRoomMessageReceived', data);
        });

        // 房间成员变化
        this._zim.on('roomMemberJoined', (zim: any, data: any) => {
            this._executeCallback('onRoomMemberJoined', data);
        });

        // 房间成员离开
        this._zim.on('roomMemberLeft', (zim: any, data: any) => {
            this._executeCallback('onRoomMemberLeft', data);
        });

         // 进入房间
        this._zim.on('roomStateChanged', (zim: any, data: any) => {
            this._executeCallback('onRoomStateChanged', data);
        });

        // Token即将过期
        this._zim.on('tokenWillExpire', (zim: any, data: any) => {
            this._executeCallback('onTokenWillExpire', data);
        });

        // 错误处理
        this._zim.on('error', (zim: any, data: any) => {
            this._executeCallback('onError', data);
        });
    }

    /**
     * 执行回调函数
     * @param callbackName 回调函数名称
     * @param data 回调数据
     */
    _executeCallback(callbackName, data) {
        const arrayKey = callbackName;
        if (this._roomCallbacks[arrayKey] && Array.isArray(this._roomCallbacks[arrayKey])) {
            this._roomCallbacks[arrayKey].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    //
                }
            });
        }
    }

    /**
     * 设置事件回调
     * @param callbackName 回调函数名称
     * @param callback 回调函数
     */
    setRoomCallback(callbackName, callback) {
        const arrayKey = callbackName;
        if (!this._roomCallbacks[arrayKey]) {
            this._roomCallbacks[arrayKey] = [];
        }
        this._roomCallbacks[arrayKey].push(callback);
    }

    /**
     * 用户登录
     * @param userID 用户ID
     * @param token 鉴权Token
     * @param userName 用户名
     */
    async login(userID: string, token: string, userName?: string) {
        if (!this._zim) {
            return false;
        }

        try {
            const userInfo: any = {
                userID: userID,
                userName: userName || `用户_${userID}`
            };

            await this._zim.login(userInfo, token);
            this._userInfo = userInfo;
            this._isConnected = true;
            return true;
        } catch (error) {
            this._isConnected = false;
            return false;
        }
    }

    /**
     * 加入房间
     * @param roomID 房间ID
     * @param roomName 房间名称
     */
    async joinRoom(roomID: string, roomName?: string) {
        if (!this._isConnected) {
            return false;
        }

        try {
            const roomInfo = {
                roomID: roomID,
                roomName: roomName || `房间_${roomID}`
            };

            await this._zim.enterRoom(roomInfo);
            this._currentRoomID = roomID;
            return true;
        } catch (error) {

            return false;
        }
    }

    /**
     * 离开当前房间
     */
    async leaveRoom() {
        if (!this._currentRoomID) {
            return true;
        }

        try {
            await this._zim.leaveRoom(this._currentRoomID);
            this._currentRoomID = '';
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * 发送房间消息
     * @param message 消息内容
     * @param messageType 消息类型 200：自定义消息
     * @param conversationType 会话类型 单聊：0，房间：1，群组：2
     * @param priority 消息优先级
     */
    async sendRoomMessage(message: string, messageType: number = 200, conversationType: number = 1, priority: number = 3){
        if (!this._currentRoomID) {
            return false;
        }

        try {
            const messageObject = {
                type: messageType,
                senderUserID: this._userInfo.userID,
                message: message
            };
            await this._zim.sendMessage(messageObject, this._currentRoomID, conversationType, {priority: priority});
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * 获取用户信息
     */
    getUserInfo() {
        return this._userInfo;
    }

    /**
     * 获取当前房间ID
     */
    getCurrentRoomID() {
        return this._currentRoomID;
    }
}