import { IFacetypeFont } from ".";

export class FacetypeFontLoader {

    /**
     * load from the given url and return a promise resolving to a IFacetypeFont instance
     * @param url
     */
    async load(url: string): Promise<IFacetypeFont> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.responseType = 'json';
            xhr.open('GET', url);
            xhr.onload = function () {
                const responseType = xhr.getResponseHeader("Content-Type");
                if (xhr.getResponseHeader("Content-Type") === 'application/json') {
                    if (this.status >= 200 && this.status < 300) {
                        resolve(xhr.response);
                    } else {
                        reject(`invalid status code ${xhr.status}`);
                    }
                } else {
                    reject(`invalid response type ${responseType}`);
                }
            };
            xhr.onerror = function () {
                reject(`error ${xhr.status}`);
            };
            xhr.send();
        });
        // return new Promise((resolve, reject) => {
        //     import(url, {
        //         with: { type: 'json' },
        //     }).then(json => {
        //         resolve(json);
        //     }).catch(e => {
        //         reject(e);
        //     });
        // });
    }

}