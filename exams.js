function unmetExamRequirements() {
    /*
     * RULES:
     *
     * - at least one exam subject must be one of Deutsch, Mathematik, and a
     *   Fremd-/Landessprache taught to a high level
     * - point count (after getSubjectTotalExamPoints) in at least 3 exam
     *   subjects (incl. one of the above) must be >= 20
     * - points count of written only (if written.enabled) else oral only (if
     *   oral.enabled) exams must have a total for all 5 exam subjects together
     *   of >= 25
     */
}

function getSubjectTotalExamPoints(examGrades, extrapolatedGrade) {
    var writtenGrade = (examGrades.written.grade != undefined) ? examGrades.written.grade : extrapolatedGrade;
    var oralGrade = (examGrades.oral.grade != undefined) ? examGrades.oral.grade : extrapolatedGrade;
    if (examGrades.written.enabled) {
        if (examGrades.oral.enabled) {
            return 4 * (2*writtenGrade + oralGrade) / 3;
        } else {
            return 4 * writtenGrade;
        }
    } else {
        if (examGrades.oral.enabled) {
            return 4 * oralGrade;
        } else {
            return 0;
        }
    }
}

function getTotalSubjectExamsPoints(subjectName) {
    var examGrades = subjects[subjectName].examGrades,
        extrapolatedGrade = extrapolateFutureGrades(subjectName),
        points = getSubjectTotalExamPoints(examGrades, extrapolatedGrade);
    return [subjectName, points];
}

// vim:foldmethod=marker:foldlevel=0:nowrap:textwidth=0:
