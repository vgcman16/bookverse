// Mock Observable class
export class Observable {
    private _observers: { [key: string]: ((data: any) => void)[] } = {};

    public on(eventName: string, callback: (data: any) => void): void {
        if (!this._observers[eventName]) {
            this._observers[eventName] = [];
        }
        this._observers[eventName].push(callback);
    }

    public off(eventName: string, callback?: (data: any) => void): void {
        if (!callback) {
            delete this._observers[eventName];
            return;
        }
        
        const observers = this._observers[eventName];
        if (observers) {
            this._observers[eventName] = observers.filter(cb => cb !== callback);
        }
    }

    protected notifyPropertyChange(propertyName: string, value: any): void {
        const observers = this._observers[propertyName];
        if (observers) {
            observers.forEach(callback => callback({ object: this, propertyName, value }));
        }
    }
}

// Mock Frame class
export class Frame {
    public static topmost(): Frame {
        return new Frame();
    }

    public navigate(pageModuleNameOrNavigation: any): void {
        // Mock navigation
    }
}

// Mock Page class
export class Page {
    public frame: Frame = new Frame();
    public bindingContext: any;
}

// Mock Application class
export class Application {
    public static android: any = {
        startActivity: jest.fn(),
        foregroundActivity: {
            finish: jest.fn()
        }
    };

    public static ios: any = {
        rootController: {
            dismissViewControllerAnimated: jest.fn()
        }
    };
}

// Mock platform utilities
export const isAndroid = false;
export const isIOS = false;

// Mock file system
export const File = {
    exists: jest.fn().mockResolvedValue(true),
    fromPath: jest.fn().mockReturnValue({
        readText: jest.fn().mockResolvedValue(''),
        writeText: jest.fn().mockResolvedValue(undefined),
        remove: jest.fn().mockResolvedValue(undefined)
    })
};

export const Folder = {
    exists: jest.fn().mockResolvedValue(true),
    fromPath: jest.fn().mockReturnValue({
        getEntities: jest.fn().mockResolvedValue([]),
        clear: jest.fn().mockResolvedValue(undefined)
    })
};

// Mock HTTP module
export const Http = {
    getJSON: jest.fn().mockResolvedValue({}),
    getString: jest.fn().mockResolvedValue(''),
    request: jest.fn().mockResolvedValue({ content: { toJSON: () => ({}) } })
};

// Mock dialogs module
export const alert = jest.fn().mockResolvedValue(undefined);
export const confirm = jest.fn().mockResolvedValue(true);
export const prompt = jest.fn().mockResolvedValue({ result: true, text: '' });
export const login = jest.fn().mockResolvedValue({ result: true, userName: '', password: '' });
export const action = jest.fn().mockResolvedValue('');

// Mock application settings
export const ApplicationSettings = {
    setString: jest.fn(),
    getString: jest.fn().mockReturnValue(''),
    setNumber: jest.fn(),
    getNumber: jest.fn().mockReturnValue(0),
    setBoolean: jest.fn(),
    getBoolean: jest.fn().mockReturnValue(false),
    remove: jest.fn(),
    clear: jest.fn()
};

// Mock connectivity module
export const Connectivity = {
    getConnectionType: jest.fn().mockReturnValue(1), // ConnectionType.WIFI
    startMonitoring: jest.fn(),
    stopMonitoring: jest.fn()
};

// Mock image source
export const ImageSource = {
    fromFile: jest.fn().mockResolvedValue({}),
    fromUrl: jest.fn().mockResolvedValue({}),
    fromBase64: jest.fn().mockReturnValue({})
};

// Export all mocks
export default {
    Observable,
    Frame,
    Page,
    Application,
    isAndroid,
    isIOS,
    File,
    Folder,
    Http,
    alert,
    confirm,
    prompt,
    login,
    action,
    ApplicationSettings,
    Connectivity,
    ImageSource
};
