var _saveState, subjects;

function getSaveState() { return _saveState; }

function setSaveState(state) {
    // state is one of 'unsaved', 'saved', 'nofile'
    switch (state) {
        case 'unsaved':
            window.onbeforeunload = function (e) {
                var dialogText = 'Nicht gespeicherte Änderungen gehen verloren!';
                e.returnValue = dialogText;
                return dialogText;
            };
            break;
        case 'saved':
        case 'nofile':
            window.onbeforeunload = undefined;
            break;
        default:
            throw `Invalid save state: ${state}`;
    }
    _saveState = state;
}

function getTotalChecker(totalPredicate) {
    // the sum of enabled terms in the group must satisfy the requirements
    return function (subjects) {
        var total = subjects.map(countEnabled).reduce((a, b) => a + b);
        return (!totalPredicate(total)) ? subjects : false;
    };
}

function getAllChecker(eachPredicate) {
    // each subject's enabled count must satisfy requirements
    return function (subjects) {
        var failed = subjects.filter(s => !eachPredicate(countEnabled(s)));
        return (failed.length > 0) ? failed : false;
    };
}

function getAnyChecker(eachPredicate) {
    // at least one subject must satisfy requirements
    return subjects => subjects.map(countEnabled).some(eachPredicate) ? false : subjects;
}

function getExclusiveChecker() {
    // only one subject in the group may have enabled terms
    return function (subjects) {
        var numWithEnabled = subjects.map(countEnabled).filter(e => e > 0).length;
        return (numWithEnabled > 1) ? subjects : false;
    };
}

function countEnabled(subject) {
    return Object.values(subject.termGrades).filter(g => g.enabled).length;
}

function getSubjectName(subject) {
    return Object.entries(subjects)
        .map(e => (e[1] == subject) ? e[0] : undefined)
        .filter(e => e != undefined)[0];
}

function getSubjectsByGroup() {
    var subjectsByGroup = {};
    Object.keys(REQUIREMENT_GROUPS).forEach(name => subjectsByGroup[name] = []);
    Object.values(subjects).forEach(s => s.groups.forEach(groupName => subjectsByGroup[groupName].push(s)));
    return subjectsByGroup;
}

function isValidGrade(number) {
    return !isNaN(number) && MIN_VALID_GRADE <= number && number <= MAX_VALID_GRADE;
}

function extrapolateFutureGrades(subjectName) {
    // Future term and exam grades are estimated as the unweighted average of
    // given term and exam grades, enabled or not (there is one average, so
    // e.g. given term grades influence extrapolated future exam grades).
    var subject = subjects[subjectName];
    var gradeSum = 0, gradeCount = 0;

    function addGradesToSum(g) {
        if (g.grade == undefined) return;
        gradeSum += g.grade;
        gradeCount++;
    }

    Object.values(subject.termGrades).forEach(addGradesToSum);
    Object.values(subject.examGrades).forEach(addGradesToSum);

    return (gradeCount == 0) ? 0 : gradeSum / gradeCount;
}

// vim:foldmethod=marker:foldlevel=0:nowrap:textwidth=0:
