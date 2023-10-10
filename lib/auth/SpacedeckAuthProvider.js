import _ from 'lodash';
class SpacedeckAuthProvider {
    constructor(configuration) {
        this.allSpaces = {};
        this.allFolder = {};
        this.structure = {};
        this.url = configuration.baseUrl;
        if (typeof window !== 'undefined' && window.localStorage.getItem('x-spacedeck-auth')) {
            this.token = window.localStorage.getItem('x-spacedeck-auth');
        }
    }

    async signin(usr, pwd) {
        const login = await this._login(this.url, usr, pwd);
        if (!login) return;
        this.token = login.token;
        window.localStorage.setItem('x-spacedeck-auth', this.token);

        this.user_id = login.user_id;
        this.pwd = '';
        this.userData = await this._getInititalUserData();

        this.homeFolderId = this.userData?.home_folder_id;

        this.structure = await this._getData(this.url, this.token);
    }

    async signout() {
        const response = await fetch(this.url + '/api/sessions/current', {
            method: 'DELETE',
            headers: {
                'X-Spacedeck-Auth': this.token,
            },
        });
        if (!response) return;
    }
    async fetchCallWithLoginPrompt(request, options, maxTry = 1) {
        console.log(maxTry);
        if (maxTry > 5) return;
        const response = await fetch(request, options);
        console.log(response);
        if (response.status === 401 || response.status === 403) {
            const password = prompt('Please re-enter your password');
            if (password) {
                this.signin(this.user, password)
                    .then(() => this.fetchCallWithLoginPrompt(request, options, maxTry + 1));
            } else throw Error('nope');
        }

        return response;
    }

    async _getInititalUserData() {
        const response = await this.fetchCallWithLoginPrompt(this.url + '/api/users/current', {
            method: 'GET',
            headers: {
                'X-Spacedeck-Auth': this.token,
            },
        });
        if (!response) return;
        const content = await response?.json();

        return content;
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
        const response = await this.fetchCallWithLoginPrompt(requestUrl, {
            method: 'get',
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
        const response = await this.fetchCallWithLoginPrompt(this.url + '/api/spaces', {
            method: 'post',
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
        const response = await this.fetchCallWithLoginPrompt(this.url + '/api/spaces/' + spaceId, {
            method: 'DELETE',
            headers: {
                'x-spacedeck-auth': this.token,
            },
        }).catch((e) => {
            console.log(e);
        });

        return response;
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
