interface PairedFrameOptions {
    autoNavigate: boolean;
    autoResize: boolean;
    providePath: Function | null;
    resizeElement: HTMLElement | null;
    sendHeight: boolean;
    sendHistory: boolean;
    targetOrigin: string;
    targetWindow: Window;
    translatePath: Function | null;
}
export default class PairedFrame {
    private config;
    private registry;
    private callbacks;
    private dialogs;
    private hasPendingHeightUpdate;
    private localPath;
    private localHeight;
    private remotePath;
    private remoteHeight;
    private uniqueId;
    private boundMessageHandler;
    private pulseId;
    private destroyed;
    constructor({ autoNavigate, autoResize, providePath, resizeElement, sendHeight, sendHistory, targetOrigin, targetWindow, translatePath }: PairedFrameOptions);
    listeners(eventName: string): (Function | undefined)[];
    listenerCount(eventName: string): number;
    eventNames(): string[];
    on(eventName: string, cb: (data?: Object) => any): this;
    once(eventName: string, cb: (data?: Object) => any): this;
    off(eventName: string, cb: (data?: Object) => any): this;
    emit(eventName: string, data?: Object): boolean;
    send(eventName: string, data?: Object): boolean;
    dialog(config?: any): Promise<{}>;
    onDialog(cb: (config?: any) => any): this;
    destroy(): boolean;
    private awaitLoad;
    private handleMessages;
    private heartbeat;
    private handleDialogs;
    private sendHeight;
    private autoResize;
    private sendHistory;
    private autoNavigate;
    private init;
}
export {};
