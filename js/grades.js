import { sum } from 'util/functions.js';
import { Serializable, Watchable } from 'util/interfaces.js';

export class Grade extends Watchable(Serializable()) {

    constructor(value = null, enabled = false) {
        super();

        Object.defineProperty(this, 'grade', {
            get() { return this._grade; },
            set(value) {
                if (value != null && !Grade.isValid(value)) throw `Invalid grade value: ${value}`;
                this._grade = value;
                this._update('grade');
            }
        });

        Object.defineProperty(this, 'enabled', {
            get() { return this._enabled; },
            set(value) {
                this._enabled = !!value;
                this._update('enabled');
            }
        });

        this.grade = value;
        this.enabled = enabled;
    }

    static get MIN_VALID_GRADE() { return 0; }
    static get MAX_VALID_GRADE() { return 15; }

    static isValid(value) {
        return (!isNaN(value) && Grade.MIN_VALID_GRADE <= value && value <= Grade.MAX_VALID_GRADE);
    }

    toJSON() {
        return { grade: this.grade, enabled: this.enabled };
    }

    static fromJSON(jsonObject) {
        return new Grade(jsonObject.grade, jsonObject.enabled);
    }

}


export class GradeCollection extends Watchable(Serializable()) {

    constructor(gradesByKey = {}) {
        super();
        this._keys.forEach(key =>
            this[key] = (gradesByKey[key] === undefined) ? new Grade() : gradesByKey[key]);
        this._keys.forEach(key => this[key].subscribe(this._update.bind(this)));
    }

    countEnabled() {
        return Object.values(this).filter(g => g.enabled).length;
    }

    toJSON() {
        let store = {};
        this._keys.forEach(key => store[key] = this[key].toJSON());
        return store;
    }

    static fromJSON(jsonObject) {
        let store = {};
        Object.entries(jsonObject).forEach(e => store[e[0]] = e[1]);
        return new this(store);
    }

}


export class TermGrades extends GradeCollection {

    get _keys() {
        return TermGrades.TERMS;
    }

    static get TERMS() {
        return ['11.1', '11.2', '12.1', '12.2'];
    }

    getTotal(extrapolatedGrade = 0) {
        return sum(Object.values(this).filter(g => g.enabled).map(g => (g.grade != null) ? g.grade : extrapolatedGrade));
    }

}


export class ExamGrades extends GradeCollection {

    get _keys() {
        return ExamGrades.EXAMS;
    }

    static get EXAMS() {
        return ['written', 'oral'];
    }

    getTotal(extrapolatedGrade = 0) {
        var writtenGrade = (this.written.grade != null) ? this.written.grade : extrapolatedGrade;
        var oralGrade = (this.oral.grade != null) ? this.oral.grade : extrapolatedGrade;
        if (this.written.enabled) {
            if (this.oral.enabled) {
                return 4 * (2*writtenGrade + oralGrade) / 3;
            } else {
                return 4 * writtenGrade;
            }
        } else {
            if (this.oral.enabled) {
                return 4 * oralGrade;
            } else {
                return 0;
            }
        }
    }

}

export class FinalGrade {

    constructor(points) {
        this.points = points;

        if (this.points < 300) {
            this.formattedGrade = 'nicht bestanden';
        } else if (this.points > 822) {
            this.formattedGrade = this.format(1.0);
        } else {
            this.formattedGrade = this.format(this.toNumeric(this.points));
        }

        Object.freeze(this);
    }

    toString() {
        return this.formattedGrade;
    }

    static format(numericGrade) {
        var roundedGrade = Math.trunc(this.numericGrade * 10) / 10;
        return Number(roundedGrade).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    }

    static toNumeric(points) {
        return 17/3 - points/180;
    }

    hasNextGrade() {
        return this.formattedGrade === this.format(1.0);
    }

    getNextGrade() {
        if (!this.hasNextGrade()) {
            throw 'no better grade attainable';
        }
        let nextPoints = this.points;
        while (this.format(this.toNumeric(nextPoints)) === this.formattedGrade) {
            nextPoints++;
        }
        return FinalGrade(nextPoints);
    }

}
