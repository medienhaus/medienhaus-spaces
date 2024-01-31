import _ from 'lodash';
import getConfig from 'next/config';

import logger from '../Logging';

// @TODO: If a user logs in with a different device, the saved auth token becomes invalid and they need to login again

class MyPadsAuthProvider {
    constructor(configuration, updateConnectionStatus) {
        // serverPads will be populated with pads from the mypads server
        this.serverPads = {};
        this.url = configuration.myPads?.api;
        // name of the folder the application stores pads in. defaults to application name
        this.spacesGroupName = configuration.myPads?.spacesGroupName || getConfig().publicRuntimeConfig.name;
        this.updateConnectionStatus = updateConnectionStatus;
    }

    setToken(token) {
        this.token = token;
    }

    async makeRequest(resource, options) {
        const request = await fetch(resource, options);

        if (request.status === 401 || request.status === 403) {
            this.updateConnectionStatus('etherpad', false);
        }

        return request;
    }
    async validateToken() {
        if (!this.token) return false;

        // we will execute an authprovider specific dummy call with requires auth to check if the token which we got stored is still valid. This methode needs to be implemented in each individual auth provider same as `signin` and `signout`
        const tokenValidationCall = await this.makeRequest(this.url + '/userlist' + '?auth_token=' + this.token, {
            method: 'GET',
        });

        // the reason why we are using this api route is described in the mypads repository: https://framagit.org/framasoft/Etherpad/ep_mypads/-/blob/master/api.js?ref_type=heads#L635
        if (tokenValidationCall.status === 200) {
            this.updateConnectionStatus('etherpad', true);

            return true;
        } else {
            this.updateConnectionStatus('etherpad', false);

            return false;
        }
    }

    async signin(usr, pwd) {
        // successfull login revokes all previouse generated tokens for this user
        // if no api url is defined in config.js we exit the function
        if (!this.url) return;
        const login = await this._login(this.url, usr, pwd);
        this.token = login.token;
        this.userId = login.user._id;
        if (!this.token) return;
        await this.syncAllPads(this.token);

        return this.token;
    }

    async signout() {
        return await fetch(this.url + '/auth/logout' + '?auth_token=' + this.token);
    }

    async syncAllPads() {
        // first we look for a folder (or group in mypads) with the specified group name
        const checkForGroups = await this._getGroups(this.url, this.token);
        if (!checkForGroups.ok) return checkForGroups;
        const groupsJson = await checkForGroups.json();
        const groups = groupsJson?.value;

        let defaultGroup = _.find(groups.groups, { name: this.spacesGroupName });

        // if no default folder is found we create one since mypads needs at least one folder.
        if (!defaultGroup) {
            const createGroup = await this.makeRequest(this.url + '/group', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    admin: this.userId,
                    name: this.spacesGroupName,
                    visibility: 'restricted',
                    tags: [],
                    auth_token: this.token,
                }),
            });

            if (createGroup.ok) {
                const json = await createGroup.json();
                defaultGroup = json.value;
            }
        }

        this.defaultGroupId = defaultGroup._id;

        // then we populate the serverPads object with any pads that are already on the server
        defaultGroup?.pads.forEach((pad) => {
            const foundPad = groups.pads[pad];
            if (foundPad) {
                this.serverPads[pad] = foundPad;
            }
        });

        return this.serverPads;
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
        } else {
            return {};
        }
    }

    _getGroups(baseUrl, token) {
        return this.makeRequest(baseUrl + '/group' + '?auth_token=' + token, {
            method: 'get',
        });
    }

    // Public Functions

    async createPad(padName, visibility, password) {
        const response = await this.makeRequest(this.url + '/pad/', {
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

        if (!response || !response.ok) return response;
        else {
            return await response.json();
        }
    }

    async deletePadById(padId) {
        const response = await this.makeRequest(this.url + '/pad/' + padId, {
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
                delete this.serverPads[padId];

                return json?.key;
            } else {
                return { status: 'error' };
            }
        }
    }

    async isPadPasswordProtected(padId) {
        const response = await this.makeRequest(this.url + '/pad/isPublic/' + padId, {
            method: 'get',
        }).catch((error) => {
            logger.log(error);

            return error;
        });
        if (!response.ok) throw Error('Failed to fetch pad id: ' + padId, { cause: response });

        const responseData = await response.json();

        if (!responseData.success) throw Error('Response unsuccessfull for pad id: ' + padId, { cause: responseData.error });

        // since we check if a pad is password protected we return the opposite of isPublic (isPublic = false means isPasswordProtected = true)
        return !responseData.ispublic;
    }

    getAllPads() {
        return this.serverPads;
    }

    getToken() {
        return this.token;
    }
}

export default MyPadsAuthProvider;
