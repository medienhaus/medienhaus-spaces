import _ from 'lodash';
class WriteAuthProvider {
    constructor(configuration) {
        this.defaultPads = {};
        this.url = configuration.api;
        this.defaultGroupPrefix = 'myfiles';
        if (typeof window !== 'undefined' && window.localStorage.getItem('write_access_token')) {
            this.token = window.localStorage.getItem('write_access_token');
        }
    }

    async signin(usr, pwd) {
        // successfull login revokes all previouse generated tokens for this user
        this.token = await this._login(this.url, usr, pwd);

        if (!this.token) return;
        window.localStorage.setItem('write_access_token', this.token);
        await this.syncAllPads(this.token);
    }

    async signout() {
        console.log('signout');
        // const response = await fetch(this.url + 'admin/logout?auth_token=' + this.token, {
        //     method: 'GET',
        // });
        // console.log(response);
    }

    async syncAllPads() {
        const groups = await this._getGroups(this.url, this.token);
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

    async deletePadById(padId) {
        const response = await fetch(this.url + '/pad/'+padId, {
            method: 'DELETE',
            body: JSON.stringify({
                auth_token: this.token,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (response?.status !== 200) {
            return { status: 'error' };
        } else {
            const json = await response.json();
            if (json?.success) {
                return json?.key;
            } else {
                return { status: 'error' };
            }
        }
    }

    getAllPads() {
        return this.defaultPads;
    }
}

export default WriteAuthProvider;
