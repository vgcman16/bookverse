import { device, element, by, expect } from 'detox';

declare global {
    namespace NodeJS {
        interface Global {
            device: typeof device;
            element: typeof element;
            by: typeof by;
            expect: typeof expect;
        }
    }
}

beforeAll(async () => {
    await device.launchApp({
        newInstance: true,
        permissions: {
            notifications: 'YES',
            camera: 'YES',
            photos: 'YES'
        }
    });
});

beforeEach(async () => {
    await device.reloadReactNative();
});

// Test utilities
export const waitFor = async (matcher: Detox.NativeMatcher, timeout = 5000) => {
    await expect(element(matcher)).toBeVisible();
    await expect(element(matcher)).toBeVisible();
    await expect(element(matcher)).toBeVisible();
};

export const tapOn = async (matcher: Detox.NativeMatcher) => {
    await waitFor(matcher);
    await element(matcher).tap();
};

export const typeText = async (matcher: Detox.NativeMatcher, text: string) => {
    await waitFor(matcher);
    await element(matcher).typeText(text);
};

export const scrollTo = async (matcher: Detox.NativeMatcher, direction: 'up' | 'down') => {
    await element(matcher).swipe(direction === 'up' ? 'up' : 'down');
};

export const login = async (email: string, password: string) => {
    await tapOn(by.id('email-input'));
    await typeText(by.id('email-input'), email);
    await tapOn(by.id('password-input'));
    await typeText(by.id('password-input'), password);
    await tapOn(by.id('login-button'));
};

export const navigateTo = async (screenName: string) => {
    await tapOn(by.id(`nav-${screenName}`));
};

export const checkElementExists = async (matcher: Detox.NativeMatcher) => {
    await expect(element(matcher)).toExist();
};

export const checkElementNotExists = async (matcher: Detox.NativeMatcher) => {
    await expect(element(matcher)).not.toExist();
};

export const checkElementHasText = async (matcher: Detox.NativeMatcher, text: string) => {
    await expect(element(matcher)).toHaveText(text);
};

export const takeScreenshot = async (name: string) => {
    await device.takeScreenshot(name);
};
