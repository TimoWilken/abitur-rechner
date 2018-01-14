var MIN_VALID_GRADE = 0,
    MAX_VALID_GRADE = 15;

/* Subject fields
 *
 * The <subject>.field property is an index into this array.
 *
 * U+00AD is a soft hyphen.
 */
var FIELDS = [
    'Sprachlich-literarisch-künstlerisch',
    'Gesellschafts\u00ADwissenschaftlich',
    'Mathematisch-naturwissen\u00ADschaftlich',
    'Andere'
];

// Names of all school terms (Halbjahre)
var TERMS = ['11.1', '11.2', '12.1', '12.2'];

/* Requirement groups
 *
 * If <requirement>.failSum == true, this requirement not being met will
 * highlight the field showing the overall sum of enabled terms as invalid.
 */
var REQUIREMENT_GROUPS = {
    Alle:                        { predicate: getTotalChecker(c => c == 36), failSum: true, description: 'Es sind insgesamt 36 Halbjahresergebnisse einzubringen.' },
    Fremdsprachen:               { predicate: getAnyChecker(c => c == 4), description: 'Mindestens eine Fremd-/Landessprache muss voll eingebracht werden.' },
    Prüfungsfächer:              { predicate: getAllChecker(c => c == 4), description: 'Prüfungsfächer müssen voll eingebracht werden.' },
    Deutsch:                     { predicate: getAllChecker(c => c == 4), description: 'Deutsch muss voll eingebracht werden.' },
    Mathematik:                  { predicate: getAllChecker(c => c == 4), description: 'Mathematik muss voll eingebracht werden.' },
    Geschichte:                  { predicate: getAllChecker(c => c >= 2), description: 'Mindestens 2 Halbjahre Geschichte müssen eingebracht werden.' },
    Sport:                       { predicate: getAllChecker(c => c <= 3), description: 'Höchstens 3 Halbjahre Sport können eingebracht werden.' },
    Naturwissenschaften:         { predicate: getTotalChecker(c => c >= 4), description: 'Mindestens 4 Halbjahre Naturwissenschaften müssen eingebracht werden.' },
    Gesellschaftswissenschaften: { predicate: getTotalChecker(c => c >= 4), description: 'Mindestens 4 Halbjahre Gesellschaftswissenschaften müssen eingebracht werden.' },
    'Künstlerisches Fach':       { predicate: getTotalChecker(c => c >= 3), description: 'Mindestens 3 Halbjahre eines künstlerischen Faches müssen eingebracht werden.' },
    'Kunst oder Musik':          { predicate: getExclusiveChecker(), description: 'Es kann nur entweder Kunst oder Musik eingebracht werden.' },
    'Fremdsprachen und Naturwissenschaften': { predicate: getAllChecker(c => c == 0 || c >= 2), description: 'Werden in einer Fremdsprache oder in einer Naturwissenschaft Leistungen eingebracht, so sind die Ergebnisse aus mindestens zwei Halbjahren anzurechnen.' }
}

var DEFAULT_SUBJECTS = (function () {
    function newGrade(enabled) { return { grade: null, enabled: enabled }; }

    function newTermGrades(enabled) {
        var termGrades = {};
        TERMS.forEach(term => termGrades[term] = newGrade(enabled));
        return termGrades;
    }

    function newExamGrades(writtenEnabled, oralEnabled) {
        return { written: newGrade(writtenEnabled), oral: newGrade(oralEnabled) };
    }

    return {
        // linguistic-literary-artistic
        Deutsch: {
            field: 0,
            groups: ['Alle', 'Deutsch'],
            termGrades: newTermGrades(true),
            examGrades: newExamGrades(true, false),
        },

        Englisch: {
            field: 0,
            groups: ['Alle', 'Fremdsprachen', 'Fremdsprachen und Naturwissenschaften'],
            termGrades: newTermGrades(true),
            examGrades: newExamGrades(true, false),
        },

        Französisch: {
            field: 0,
            groups: ['Alle', 'Fremdsprachen', 'Fremdsprachen und Naturwissenschaften'],
            termGrades: newTermGrades(false),
            examGrades: newExamGrades(false, false),
        },

        Spanisch: {
            field: 0,
            groups: ['Alle', 'Fremdsprachen', 'Fremdsprachen und Naturwissenschaften'],
            termGrades: newTermGrades(false),
            examGrades: newExamGrades(false, false),
        },

        Kunst: {
            field: 0,
            groups: ['Alle', 'Künstlerisches Fach', 'Kunst oder Musik'],
            termGrades: newTermGrades(false),
            examGrades: newExamGrades(false, false),
        },

        Musik: {
            field: 0,
            groups: ['Alle', 'Künstlerisches Fach', 'Kunst oder Musik'],
            termGrades: newTermGrades(false),
            examGrades: newExamGrades(false, false),
        },

        // social sciences
        Geschichte: {
            field: 1,
            groups: ['Alle', 'Gesellschaftswissenschaften', 'Geschichte'],
            termGrades: newTermGrades(true),
            examGrades: newExamGrades(false, false),
        },

        Erdkunde: {
            field: 1,
            groups: ['Alle', 'Gesellschaftswissenschaften'],
            termGrades: newTermGrades(false),
            examGrades: newExamGrades(false, false),
        },

        Ethik: {
            field: 1,
            groups: ['Alle', 'Gesellschaftswissenschaften'],
            termGrades: newTermGrades(false),
            examGrades: newExamGrades(false, false),
        },

        // mathematical-scentific-technical
        Mathematik: {
            field: 2,
            groups: ['Alle', 'Mathematik'],
            termGrades: newTermGrades(true),
            examGrades: newExamGrades(true, false),
        },

        Physik: {
            field: 2,
            groups: ['Alle', 'Naturwissenschaften', 'Fremdsprachen und Naturwissenschaften'],
            termGrades: newTermGrades(false),
            examGrades: newExamGrades(false, false),
        },

        Chemie: {
            field: 2,
            groups: ['Alle', 'Naturwissenschaften', 'Fremdsprachen und Naturwissenschaften'],
            termGrades: newTermGrades(false),
            examGrades: newExamGrades(false, false),
        },

        Biologie: {
            field: 2,
            groups: ['Alle', 'Naturwissenschaften', 'Fremdsprachen und Naturwissenschaften'],
            termGrades: newTermGrades(false),
            examGrades: newExamGrades(false, false),
        },

        // other
        Sport: {
            field: 3,
            groups: ['Alle', 'Sport'],
            termGrades: newTermGrades(true),
            examGrades: newExamGrades(false, false),
        },
    }
})();

// vim:foldmethod=marker:foldlevel=0:nowrap:textwidth=0:
