import _ from 'lodash';
import getConfig from 'next/config';

// @TODO known issue: if a usser logs in with a different device, saved auth token becomes invalid. user needs to login again.

class WriteAuthProvider {
    constructor(configuration) {
        this.defaultPads = {};
        this.url = configuration.api;
        // name of the folder the application stores pads in. defaults to name of appplication
        this.defaultGroupName = getConfig().publicRuntimeConfig.authProviders.write.defaultGroupName || getConfig().publicRuntimeConfig.name;
        if (typeof window !== 'undefined' && window.localStorage.getItem('write_access_token')) {
            this.token = window.localStorage.getItem('write_access_token');
        }
    }

    async signin(usr, pwd) {
        // successfull login revokes all previouse generated tokens for this user
        const login = await this._login(this.url, usr, pwd);
        this.token = login.token;
        this.userId = login.user._id;
        if (!this.token) return;
        window.localStorage.setItem('write_access_token', this.token);
        await this.syncAllPads(this.token);
    }

    async signout() {
        // placeholder for sign out function
        console.log('signout');
        // const response = await fetch(this.url + 'admin/logout?auth_token=' + this.token, {
        //     method: 'GET',
        // });
        // console.log(response);
    }

    async syncAllPads() {
        // first we look for a folder (or group in mypads) with the specified group name
        const groups = await this._getGroups(this.url, this.token);
        let defaultGroup = _.find(groups?.groups, { name: this.defaultGroupName });
        // if no default folder is found we create one since mypads needs at least one folder.
        if (!defaultGroup) {
            const createGroup = await fetch(getConfig().publicRuntimeConfig.authProviders.write.api + '/group', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    'admin': this.userId,
                    'name': this.defaultGroupName,
                    'visibility': 'restricted',
                    'tags': [],
                    'auth_token': this.token,
                }),
            });
            if (createGroup.ok) {
                const json = await createGroup.json();
                defaultGroup = json.value;
            }
        }
        this.defaultGroupId = defaultGroup._id;
        // then we populate the defaultPads object with any pads that are already on the server
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
            return data;
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
                delete this.defaultPads[padId];
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
