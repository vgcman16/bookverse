declare module 'detox' {
    interface Expect extends jest.Expect {
        (element: IndexableNativeElement): DetoxMatchers;
    }

    interface DetoxMatchers extends jest.Matchers<void, IndexableNativeElement> {
        toBeVisible(): any;
        toExist(): any;
        not: DetoxMatchers;
        toHaveText(text: string): any;
        toHaveId(id: string): any;
        toHaveValue(value: string): any;
        toHaveToggleValue(value: boolean): any;
        toBeFocused(): any;
        toBeEnabled(): any;
        toBeDisabled(): any;
        withTimeout(timeout: number): DetoxMatchers;
    }

    interface IndexableNativeElement {
        tap(): Promise<void>;
        typeText(text: string): Promise<void>;
        replaceText(text: string): Promise<void>;
        clearText(): Promise<void>;
        scroll(pixels: number, direction: 'up' | 'down' | 'left' | 'right'): Promise<void>;
        scrollTo(edge: 'top' | 'bottom' | 'left' | 'right'): Promise<void>;
        swipe(direction: 'up' | 'down' | 'left' | 'right', speed?: 'slow' | 'fast', percentage?: number): Promise<void>;
        atIndex(index: number): IndexableNativeElement;
    }

    interface WaitForOptions {
        timeout?: number;
        interval?: number;
    }

    interface WaitFor {
        (element: IndexableNativeElement): DetoxMatchers;
        (elements: IndexableNativeElement[]): DetoxMatchers;
    }

    interface Device {
        launchApp(config?: {
            newInstance?: boolean;
            permissions?: { [key: string]: string };
            url?: string;
            userNotification?: any;
            delete?: boolean;
            launchArgs?: any;
        }): Promise<void>;
        terminateApp(): Promise<void>;
        reloadReactNative(): Promise<void>;
        sendToHome(): Promise<void>;
        getBundleId(): Promise<string>;
        installApp(): Promise<void>;
        uninstallApp(): Promise<void>;
        openURL(url: string): Promise<void>;
        takeScreenshot(name: string): Promise<void>;
        setLocation(lat: number, lon: number): Promise<void>;
        setURLBlacklist(urls: string[]): Promise<void>;
        enableSynchronization(): Promise<void>;
        disableSynchronization(): Promise<void>;
        setOrientation(orientation: 'portrait' | 'landscape'): Promise<void>;
        shake(): Promise<void>;
    }

    interface Element {
        (by: By): IndexableNativeElement;
    }

    interface By {
        id(id: string): any;
        type(type: string): any;
        text(text: string): any;
        label(label: string): any;
        traits(traits: string[]): any;
    }

    const device: Device;
    const element: Element;
    const waitFor: WaitFor;
    const by: By;
    const expect: Expect;

    export { device, element, waitFor, by, expect };
    export type { IndexableNativeElement, DetoxMatchers };
}
