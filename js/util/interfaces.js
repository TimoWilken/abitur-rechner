export const Serializable = (superclass = Object) => class Serializable extends superclass {

    toJSON() {
        let jsonned = {};
        Object.entries(this).map(e => jsonned[e[0]] = e[1].toJSON ? e[1].toJSON() : e[1]);
        return jsonned;
    }

    static fromJSON(jsonObject) {
        return Object.assign(new this(), jsonObject);
    }

};

export const Watchable = (superclass = Object) => class Watchable extends superclass {

    constructor(...args) {
        super(...args);
        Object.defineProperty(this, '_subscribers', { writable: true, value: [] });
    }

    subscribe(callback) {
        this._subscribers.push(callback);
    }

    _update(...args) {
        this._subscribers.forEach(f => f(this, ...args));
    }

};
