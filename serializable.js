class Serializable {

    toJSON() {
        let jsonned = {};
        Object.entries(this).map(e => jsonned[e[0]] = e[1].toJSON ? e[1].toJSON() : e[1]);
        return jsonned;
    }

    static fromJSON(jsonObject) {
        return Object.assign(new this(), jsonObject);
    }

}

// vim:foldmethod=marker:foldlevel=0:nowrap:textwidth=0:
