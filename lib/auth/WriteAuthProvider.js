import _ from 'lodash';

class WriteAuthProvider {
    constructor(url, usr, pwd) {
        this.defaultPads = {};
        this.url = url;
        this.usr = usr;
        this.pwd = pwd;
        this.defaultGroupPrefix = 'myfiles';
    }

    async init(url = this.url, usr = this.usr, pwd = this.pwd) {
    // successfull login revokes all previouse generated tokens for this user
        this.token = await this._login(url, usr, pwd);
        if (this.token) {
            this.pwd = '';
        } else {
            return;
        }
        const groups = await this._getGroups(url, this.token);
        const defaultGroup = _.find(groups?.groups, { name: this.defaultGroupPrefix });

        this.defaultGroupId = defaultGroup._id;

        defaultGroup?.pads.forEach(pad => {
            const foundPad = groups?.pads[pad];
            if (foundPad) { this.defaultPads[pad] = foundPad; }
        });
    }

    async _login(baseUrl, usr, password) {
        const response = await fetch(baseUrl + '/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                login: usr,
                password: password,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json();

        if (data?.success && data?.token) {
            return data.token;
        } else { return {}; }
    }

    async _getGroups(baseUrl, token) {
        const response = await fetch(baseUrl + '/group' + '?auth_token=' + token, {
            method: 'get',
        });
        if (!response) return {};
        if (response?.status === 401) return {};
        if (response?.status === 200) {
            const json = await response.json();
            return json?.value;
        }
    }

    _updatePadObject(pad) {
        if (this.defaultPads[pad._id]) {
            this.defaultPads[pad._id] = pad;
            return this.defaultPads[pad._id];
        }
    }

    // Public Functions

    async createPad(padName, visibility, password) {
        const response = await fetch(this.url + '/pad/', {
            method: 'POST',
            body: JSON.stringify({
                auth_token: this.token,
                group: this.defaultGroupId,
                name: padName,
                visibility: visibility,
                password: password,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (response?.status !== 200) {
            return { status: 'error' };
        } else {
            const json = await response.json();
            return json?.value._id;
        }
    }

    async setPasswordToPadByName(name, password) {
        const foundPad = this.getPadByName(name);
        if (foundPad.length !== 1) {
            return { status: 'error, not found or multiple found. try to use setPasswordToPadById function instead' };
        } else {
            return this.setPasswordToPadById(foundPad[0]._id, password);
        }
    }

    async setPasswordToPadById(padId, password) {
        const pad = this.getPadById(padId);
        const body = {
            auth_token: this.token,
            group: pad.group,
            name: pad.name,
            ctime: pad.ctime,
            _id: pad._id,
            visibility: password ? 'private' : 'public',
            password: password || null,
        };
        const response = await fetch(this.url + '/pad/' + pad._id, {
            method: 'PUT',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (response?.status !== 200) {
            return { status: 'error' };
        } else {
            const json = await response.json();
            const pad = json?.value;
            if (pad) {
                delete pad.password;
                if (this._updatePadObject(pad)) {
                    return pad;
                }
            }
        }
    }

    getPadById(padId) {
        return this.defaultPads[padId];
    }

    getPadByName(name) {
        return _.filter(this.getAllPads(), { name: name });
    }

    getAllPads() {
        return this.defaultPads;
    }
}

export { WriteAuthProvider };
