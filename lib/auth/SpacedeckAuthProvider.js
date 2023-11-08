import _ from 'lodash';
class SpacedeckAuthProvider {
    constructor(configuration, updateConnectionStatus) {
        this.allSpaces = {};
        this.allFolder = {};
        this.structure = {};
        this.url = configuration.baseUrl;
        this.updateConnectionStatus= updateConnectionStatus;
    }

    addToken(token) {
        this.token = token;
    }

    async makeRequest(resource, options) {
        const request = await fetch(resource, options);

        if (request.status === 401 || request.status === 403) {
            this.updateConnectionStatus('spacedeck', false);
        }

        return request;
    }

    // We will execute an AuthProvider-specific dummy-call to check if an already stored token is still valid.
    // This method needs to be implemented in each individual auth provider; same as `signin()` + `signout()`.
    async validateToken() {
        if (!this.token) return false;

        // As it is necessary that the function is called `validateToken()` to match the naming and expected return
        // in the same style as any other AuthProvider, we have to wrap `_getInitialUserData()` into this function.
        const tokenValidationCall = await this._getInitialUserData();

        // If the token is not authorized, the Spacedeck API still returns a payload; therefore we have
        // to check if there _is_ any payload, and if this payload _does_not_contain_ an 'error' key.
        // If these conditions are matched, then we can assume the token to be momentarily valid.
        return (tokenValidationCall && !tokenValidationCall.error);
    }

    async signin(usr, pwd) {
        const login = await this._login(this.url, usr, pwd);
        if (!login) return;
        this.token = login.token;

        this.user_id = login.user_id;
        this.pwd = '';
        this.userData = await this._getInitialUserData();

        this.homeFolderId = this.userData?.home_folder_id;

        this.structure = await this._getData(this.url, this.token);

        return this.token;
    }

    async signout() {
        return fetch(this.url + '/api/sessions/current', {
            method: 'DELETE',
            headers: {
                'X-Spacedeck-Auth': this.token,
            },
        });
    }

    async _getInitialUserData() {
        const response = await this.makeRequest(this.url + '/api/users/current', {
            method: 'GET',
            headers: {
                'X-Spacedeck-Auth': this.token,
            },
        });
        if (!response || !response.ok) return response;

        return response?.json();
    }

    async _getData(baseUrl = this.url, token = this.token, parentId) {
        const structure = {};
        structure.children = {};
        let requestUrl = '';

        if (parentId) {
            requestUrl = baseUrl + '/api/spaces?parent_space_id=' + parentId;
        } else {
            requestUrl = baseUrl + '/api/spaces';
        }

        const response = await this.makeRequest(requestUrl, {
            method: 'GET',
            headers: {
                'X-Spacedeck-Auth': token,
            },
        });
        if (!response) return;
        const content = await response?.json();
        await Promise.all(_.map(content, async (element) => {
            structure.children[element._id] = {
                name: element.name,
                id: element._id,
                access_mode: element.access_mode,
                password: element.password ? element.password : '',
                created_at: element.created_at,
                updated_at: element.updated_at,
                creator: element.creator,
            };

            if (element.space_type === 'space') {
                structure.children[element._id].type = 'space';
                structure.children[element._id].thumbnail_url = element.thumbnail_url ? element.thumbnail_url : '';
                structure.children[element._id].thumbnail_updated_at = element.thumbnail_updated_at ? element.thumbnail_updated_at : '';
                structure.children[element._id].width = element.width;
                structure.children[element._id].height = element.height;
                structure.children[element._id].shareUrl = baseUrl + 's/' + element.edit_hash + '-' + element.name;
                structure.children[element._id].access_mode = element.access_mode;
                this.allSpaces[element._id] = element;
                this.allSpaces[element._id].id = element._id;
            } else if (element.space_type === 'folder') {
                structure.children[element._id] = await this._getData(baseUrl, token, element._id);
                structure.children[element._id].type = 'folder';
                structure.children[element._id].name = element.name;
                structure.children[element._id].id = element._id;
                this.allFolder[element._id] = element;
            }
        }));

        return structure.children;
    }

    async _login(baseUrl, usr, password) {
        const response = await fetch(baseUrl + '/api/sessions', {
            method: 'POST',
            body: JSON.stringify({
                email: usr,
                password: password,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });
        const data = await response.json();

        if (data?.user_id && data?.token) {
            return data;
        }
    }

    async _createElement(name, parentFolderId = this.homeFolderId, type = 'space') {
        const response = await this.makeRequest(this.url + '/api/spaces', {
            method: 'POST',
            headers: {
                'X-Spacedeck-Auth': this.token,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                space_type: type,
                parent_space_id: parentFolderId,
            }),
        });

        if (!response) return;
        const content = await response?.json();
        if (!content) return;

        return content;
    }

    // Public functions

    getAllSpaces() {
        return this.allSpaces;
    }

    getStructure() {
        return this.structure;
    }

    async createSpace(spaceName, parentFolderId = this.homeFolderId) {
        const data = this._createElement(spaceName, parentFolderId, 'space');
        if (!data) return;
        this.allSpaces[data._id] = data;
        await this.syncAllSpaces();

        return data;
    }

    async deleteSpaceById(spaceId) {
        if (!this.getSpaceById(spaceId)) return;

        return await this.makeRequest(this.url + '/api/spaces/' + spaceId, {
            method: 'DELETE',
            headers: {
                'X-Spacedeck-Auth': this.token,
            },
        }).catch((e) => {
            console.log(e);
        });
    }

    getElementById(id) {
        let foundElement = this.getSpaceById(id);

        if (foundElement) {
            return foundElement;
        } else {
            foundElement = this.getFolderById(id);
            if (foundElement) return foundElement;
        }
    }

    getSpaceById(id) {
        return _.find(this.allSpaces, { id: id });
    }

    getFolderById(id) {
        return _.find(this.allFolder, { id: id });
    }

    getFolderByName(name) {
        return _.filter(this.allFolder, { name: name });
    }

    getSpaceByName(name) {
        return _.filter(this.allSpaces, { name: name });
    }

    getElementByName(name) {
        let foundElement = this.getSpaceByName(name);

        if (foundElement) {
            return foundElement;
        } else {
            foundElement = this.getFolderByName(name);
            if (foundElement) return foundElement;
        }
    }

    async syncAllSpaces() {
        this.structure = await this._getData(this.url, this.token);

        return this.structure;
    }
}

export default SpacedeckAuthProvider;
