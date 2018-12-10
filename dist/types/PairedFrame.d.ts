interface PairedFrameOptions {
    autoNavigate: boolean;
    autoResize: boolean;
    debug: boolean;
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
    private boundReceiver;
    private pulseId;
    constructor({ autoNavigate, autoResize, debug, providePath, resizeElement, sendHeight, sendHistory, targetOrigin, targetWindow, translatePath }: PairedFrameOptions);
    listeners(eventName: string): (Function | undefined)[];
    listenerCount(eventName: string): number;
    eventNames(): string[];
    on(eventName: string, cb: (data?: Object) => void): this;
    once(eventName: string, cb: (data?: Object) => void): this;
    off(eventName: string, cb: (data?: Object) => void): this;
    emit(eventName: string, data?: Object): boolean;
    send(eventName: string, data?: Object): boolean;
    private receive;
    dialog(config?: any): Promise<{}>;
    onDialog(cb: (config: any) => void): void;
    private resolveDialogs;
    private heartbeat;
    private sendHeight;
    private autoResize;
    private sendHistory;
    private autoNavigate;
    private onReady;
    debug(action: string, eventName: string, data?: Object): void;
    destroy(): void;
    private init;
}
export {};
