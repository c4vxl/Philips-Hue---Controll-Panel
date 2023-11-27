class Group {
    constructor(data, hueAPI) {
        this.apiInstance = hueAPI;
        this.data = data;
        this.name = data.name;
        this.devices = this.getGroupDevices();
    }

    async getGroupDevices() {
        const devices = [];
        for (const deviceId of this.data.lights) {
            const device = await this.apiInstance.getDevice(deviceId);
            devices.push(device);
        }
        return devices;
    }

    async setOnOff(isOn) {
        (await this.devices).forEach(device => device.setOnOff(isOn));
    }
}

class Device {
    static TYPE = Object.freeze({
        COLOR_LAMP: "COLOR_LAMP",
        DIMMABLE_LAMP: "DIMMABLE_LAMP",
        SMART_PLUG: "SMART_PLUG",
    });

    constructor(id, data, hueAPI) {
        this.id = id;
        this.data = data;
        this.name = data.name || 'Unknown';
        this.apiInstance = hueAPI;
        this.on = data.state.on;

        this.type = data.type.includes("color")
            ? Device.TYPE.COLOR_LAMP
            : data.state && data.state.bri !== undefined
                ? Device.TYPE.DIMMABLE_LAMP
                : Device.TYPE.SMART_PLUG;
    }

    async setOnOff(isOn) {
        const state = { on: isOn };
        return await this.setState(this.id, state);
    }

    async setState(lightId, state) {
        const url = `${this.apiInstance.baseUrl}/lights/${lightId}/state`;
        return await this.apiInstance.sendRequest(url, 'PUT', state);
    }
}

class DimmableLamp extends Device {
    constructor(id, data, hueAPI) {
        super(id, data, hueAPI);
        this.brightness = data.state.bri;
    }

    async setBrightness(brightness) {
        const currentState = await this.apiInstance.getDevice(this.id);
        const state = {
            on: currentState.on !== undefined ? currentState.on : true,
            bri: brightness,
        };
        return await this.setState(this.id, state);
    }
}


class ColorLamp extends DimmableLamp {
    constructor(id, data, hueAPI) {
        super(id, data, hueAPI);
    }

    async setColor(r, g, b) {
        const state = {
            on: true,
            xy: this.rgbToXy(r, g, b),
        };
        return await this.setState(this.id, state);
    }

    rgbToXy(r, g, b) {
        // Assuming that r, g, b are in the range [0, 255]
        const normalizedR = r / 255;
        const normalizedG = g / 255;
        const normalizedB = b / 255;

        // Applying a gamma correction
        const gammaCorrectedR = normalizedR > 0.04045 ? Math.pow((normalizedR + 0.055) / 1.055, 2.4) : normalizedR / 12.92;
        const gammaCorrectedG = normalizedG > 0.04045 ? Math.pow((normalizedG + 0.055) / 1.055, 2.4) : normalizedG / 12.92;
        const gammaCorrectedB = normalizedB > 0.04045 ? Math.pow((normalizedB + 0.055) / 1.055, 2.4) : normalizedB / 12.92;

        // Converting RGB to XYZ
        const X = gammaCorrectedR * 0.4124564 + gammaCorrectedG * 0.3575761 + gammaCorrectedB * 0.1804375;
        const Y = gammaCorrectedR * 0.2126729 + gammaCorrectedG * 0.7151522 + gammaCorrectedB * 0.0721750;
        const Z = gammaCorrectedR * 0.0193339 + gammaCorrectedG * 0.1191920 + gammaCorrectedB * 0.9503041;

        // Calculating the xy values from XYZ
        const x = X / (X + Y + Z);
        const y = Y / (X + Y + Z);

        return [x, y];
    }
}

class SmartPlug extends Device {
    constructor(id, data, hueAPI) {
        super(id, data, hueAPI);
    }
}

class hueAPI {
    constructor(key, bridgeIP) {
        this.key = key;
        this.bridgeIP = bridgeIP;
        this.baseUrl = `http://${bridgeIP}/api/${key}`;
    }

    async sendRequest(url, method = 'GET', body = null) {
        try {
            const response = await fetch(url, {
                method,
                body: body ? JSON.stringify(body) : null,
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                return await response.json();
            } else {
                console.error(`Error: ${response.statusText}`);
                return null;
            }
        } catch (error) {
            console.error('Request error:', error.message);
            return null;
        }
    }

    async getAllDevices() {
        const url = `${this.baseUrl}/lights`;
        const response = await this.sendRequest(url);
        const data = Object.keys(response);
        const devicePromises = data.map(id => this.getDevice(id));

        return await Promise.all(devicePromises);
    }

    async getDevice(deviceId) {
        const url = `${this.baseUrl}/lights/${deviceId}`;
        const req = await this.sendRequest(url);
        const deviceData = new Device(deviceId, req, this);

        switch (deviceData.type) {
            case Device.TYPE.COLOR_LAMP:
                return new ColorLamp(deviceId, req, this);
            case Device.TYPE.DIMMABLE_LAMP:
                return new DimmableLamp(deviceId, req, this);
            case Device.TYPE.SMART_PLUG:
                return new SmartPlug(deviceId, req, this);
            default:
                return deviceData;
        }
    }
    
    async getGroups() {
        const url = `${this.baseUrl}/groups`;
        const groups = Object.values(await this.sendRequest(url));

        return groups.map(groupData => new Group(groupData, this));
    }
}


const KEY = "<your_api_key>";
const BRIGE_IP = "<bridge_ip>";

const api = new hueAPI(KEY, BRIGE_IP);
