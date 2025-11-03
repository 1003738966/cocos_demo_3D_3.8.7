import { _decorator, Component, Node, WebView, Prefab, instantiate } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('JumpEventClick')
export class JumpEventClick extends Component {

    // 容器
    @property(Node)
    container: Node = null;

    // Webview面板
    @property(Prefab)
    webView: Prefab = null;

    // webViewUrl
    @property()
    webViewUrl: string = '';
    
    /**
     * 开始
     */
    start() {
        this.node.on(Node.EventType.TOUCH_START, this.goWebView, this);
    }

    /**
     * 打开WebView
     */
    goWebView() {
        // 打开WebView
        const webView = instantiate(this.webView);
        this.container.addChild(webView);
        webView.getChildByName('WebView').getComponent(WebView).url = this.webViewUrl;
    }
}


