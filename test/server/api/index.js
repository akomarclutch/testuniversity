'use strict';

const Lab = require('lab');
const Code = require('code');
const Config = require('../../../config');
const Hapi = require('hapi');
const IndexPlugin = require('../../../server/api/index');

const lab = exports.lab = Lab.script();
let request;
let courseList;
let courseGet;
let studentList;
let studentGet;
let studentGetCourses;
let studentCreateNamed;
let studentCreateUnNamed;
let studentDelete;
let enrollmentList;
let courseCreateNamed;
let courseCreateUnNamed;
let studentFailAlreadyEnrolled;
let studentFailTooManyEnrollments;
let studentFailClassFull;
let studentSucceed;
let removeStudent;
let changeCourse;
let deleteCourse;
let server;

lab.beforeEach((done) => {

    const plugins = [IndexPlugin];
    server = new Hapi.Server();
    server.connection({ port: Config.get('/port/api') });
    server.register(plugins, (err) => {

        if (err) {
            return done(err);
        }

        done();
    });
});

lab.experiment('Index Plugin', () => {

    lab.beforeEach((done) => {

        request = {
            method: 'GET',
            url: '/'
        };

        done();
    });


    lab.test('it returns the default message', (done) => {

        server.inject(request, (response) => {

            Code.expect(response.result.message).to.equal('Welcome to Test University');
            Code.expect(response.statusCode).to.equal(200);

            done();
        });
    });
});

lab.experiment('List Courses', () => {

    lab.beforeEach((done) => {

        request = {
            method: 'GET',
            url: '/courses'
        };

        done();
    });


    lab.test('it returns the list of default courses', (done) => {

        // validate list of courses
        server.inject(request, (response) => {

            Code.expect(response.result.data).to.be.an.array();
            Code.expect(response.result.data.length).to.equal(6);
            Code.expect(response.result.status).to.equal(200);

            done();
        });
    });
});

lab.experiment('Get Course {course_id}', () => {

    lab.beforeEach((done) => {

        request = {
            method: 'GET',
            url: '/courses/4'
        };

        done();
    });


    lab.test('it returns a single course', (done) => {

        // validate course data
        server.inject(request, (response) => {

            Code.expect(response.result.data).to.be.an.array();
            Code.expect(response.result.data.length).to.equal(1);
            Code.expect(response.result.data[0]).to.be.an.object();
            Code.expect(response.result.data[0].course_id).to.be.a.number();
            Code.expect(response.result.data[0].course_name).to.be.a.string();
            Code.expect(response.result.status).to.equal(200);

            done();
        });
    });
});

lab.experiment('Get Course Enrollees', () => {

    lab.beforeEach((done) => {

        request = {
            method: 'GET',
            url: '/courses/1/students'
        };

        done();
    });

    lab.test('it returns the list of enrollees for a test course', (done) => {

        // test course enrollment
        server.inject(request, (response) => {

            Code.expect(response.result.data).to.be.an.array();
            Code.expect(response.result.data.length).to.equal(20);
            Code.expect(response.result.data[0]).to.be.an.object();
            Code.expect(response.result.data[0].course_id).to.be.a.number();
            Code.expect(response.result.data[0].student_id).to.be.a.number();
            Code.expect(response.result.status).to.equal(200);

            done();
        });
    });
});

lab.experiment('Get Student {student_id} enrolled in Course {course_id}', () => {

    lab.beforeEach((done) => {

        request = {
            method: 'GET',
            url: '/courses/1/students/1'
        };

        done();
    });

    lab.test('it returns the queried student in the queried course', (done) => {

        // query provided student id and course id
        server.inject(request, (response) => {

            Code.expect(response.result.data).to.be.an.array();
            Code.expect(response.result.data.length).to.equal(1);
            Code.expect(response.result.data[0]).to.be.an.object();
            Code.expect(response.result.data[0].course_id).to.be.a.number();
            Code.expect(response.result.data[0].student_id).to.be.a.number();
            Code.expect(response.result.status).to.equal(200);

            done();
        });
    });
});

lab.experiment('Create new Course', () => {

    lab.beforeEach((done) => {

        courseCreateNamed = {
            method: 'POST',
            url: '/courses?course_name=geography'
        };

        courseCreateUnNamed = {
            method: 'POST',
            url: '/courses'
        };

        courseList = {
            method: 'GET',
            url: '/courses'
        };

        done();
    });

    lab.test('it creates 2 courses and successfully fetches the updated list of all courses', (done) => {

        // get course list and validate initial state
        server.inject(courseList, (list) => {

            Code.expect(list.result.data).to.be.an.array();
            Code.expect(list.result.data.length).to.equal(6);

            // create a named course
            server.inject(courseCreateNamed, (courseNamed) => {

                Code.expect(courseNamed.result.data.course_id).to.exist();
                Code.expect(courseNamed.result.data.course_name).to.exist();
                Code.expect(courseNamed.result.data.course_name).to.equal('geography');
                Code.expect(courseNamed.result.status).to.equal(201);

                // create an unnamed course
                server.inject(courseCreateUnNamed, (courseUnNamed) => {

                    Code.expect(courseUnNamed.result.data.course_id).to.exist();
                    Code.expect(courseUnNamed.result.data.course_name).to.exist();
                    Code.expect(courseUnNamed.result.data.course_name).to.equal('TO BE DETERMINED');
                    Code.expect(courseUnNamed.result.status).to.equal(201);

                    // get course list and validate final state
                    server.inject(courseList, (updatedList) => {

                        Code.expect(updatedList.result.data).to.be.an.array();
                        Code.expect(updatedList.result.data.length).to.equal(8);
                        Code.expect(updatedList.result.data[6]).to.be.an.object();
                        Code.expect(updatedList.result.data[6].course_id).to.be.a.number();
                        Code.expect(updatedList.result.data[6].course_name).to.be.a.string();
                        Code.expect(updatedList.result.data[7]).to.be.an.object();
                        Code.expect(updatedList.result.data[7].course_id).to.be.a.number();
                        Code.expect(updatedList.result.data[7].course_name).to.be.a.string();

                        done();
                    });
                });
            });
        });
    });
});

lab.experiment('Add Student {student_id} to Course {course_id}', () => {

    lab.beforeEach((done) => {

        studentFailAlreadyEnrolled = {
            method: 'POST',
            url: '/courses/1/students/1'
        };

        studentFailTooManyEnrollments = {
            method: 'POST',
            url: '/courses/6/students/1'
        };

        studentFailClassFull = {
            method: 'POST',
            url: '/courses/1/students/21'
        };

        studentSucceed = {
            method: 'POST',
            url: '/courses/2/students/21'
        };

        courseList = {
            method: 'GET',
            url: '/courses/2/students'
        };

        done();
    });

    lab.test('it creates attempts to add a student to courses using failure cases, and finally a successful case', (done) => {

        // get and validate initial list of students in course specified by course id
        server.inject(courseList, (list) => {

            Code.expect(list.result.data).to.be.an.array();
            Code.expect(list.result.data.length).to.equal(1);

            // test failure case: attempt to enroll student who is already enrolled
            server.inject(studentFailAlreadyEnrolled, (alreadyEnrolled) => {

                Code.expect(alreadyEnrolled.result.status).to.equal(403);
                Code.expect(alreadyEnrolled.result.data).to.equal('Student is already enrolled in the course');

                // test failure case: attempt to enroll in too many courses (student already enrolled in 5 courses)
                server.inject(studentFailTooManyEnrollments, (tooManyEnrollments) => {

                    Code.expect(tooManyEnrollments.result.status).to.equal(403);
                    Code.expect(tooManyEnrollments.result.data).to.equal('Student is already enrolled in 5 classes');

                    // test failure case: attempt to enroll in a course that is at capacity (20 students already enrolled)
                    server.inject(studentFailClassFull, (classFull) => {

                        Code.expect(classFull.result.status).to.equal(403);
                        Code.expect(classFull.result.data).to.equal('Class is full, unable to enroll student');

                        // test success case
                        server.inject(studentSucceed, (studentSuccess) => {

                            Code.expect(studentSuccess.result.status).to.equal(201);
                            Code.expect(studentSuccess.result.data).to.equal('Student successfully enrolled in course');

                            // get and validate final list of students in course
                            server.inject(courseList, (updatedList) => {

                                Code.expect(updatedList.result.data).to.be.an.array();
                                Code.expect(updatedList.result.data.length).to.equal(2);

                                done();
                            });
                        });
                    });
                });
            });
        });
    });
});

lab.experiment('Remove Student {student_id} from Course {course_id}', () => {

    lab.beforeEach((done) => {

        removeStudent = {
            method: 'DELETE',
            url: '/courses/2/students/21'
        };

        courseList = {
            method: 'GET',
            url: '/courses/2/students'
        };

        done();
    });

    lab.test('it removes Student {student_id} from Course {course_id}', (done) => {

        // get and validate initial student enrollment in course
        server.inject(courseList, (list) => {

            Code.expect(list.result.data).to.be.an.array();
            Code.expect(list.result.data.length).to.equal(2);

            // remove student by student id from course specified by course_id
            server.inject(removeStudent, (removal) => {

                Code.expect(removal.result.status).to.equal(204);

                // get and validate final student enrollment in course
                server.inject(courseList, (updatedList) => {

                    Code.expect(updatedList.result.data).to.be.an.array();
                    Code.expect(updatedList.result.data.length).to.equal(1);

                    done();
                });
            });
        });
    });
});

lab.experiment('Change course name', () => {

    lab.beforeEach((done) => {

        changeCourse = {
            method: 'PUT',
            url: '/courses/8/spanish'
        };

        courseGet = {
            method: 'GET',
            url: '/courses/8'
        };

        done();
    });

    lab.test('it changes course name to spanish', (done) => {

        // get course to be updated and validate initial state
        server.inject(courseGet, (course) => {

            Code.expect(course.result.data).to.be.an.array();
            Code.expect(course.result.data.length).to.equal(1);
            Code.expect(course.result.data[0]).to.be.an.object();
            Code.expect(course.result.data[0].course_id).to.equal(8);
            Code.expect(course.result.data[0].course_name).to.not.equal('spanish');

            // update course name
            server.inject(changeCourse, (change) => {

                Code.expect(change.result.status).to.equal(204);

                // get course and validate final state
                server.inject(courseGet, (updatedCourse) => {

                    Code.expect(course.result.data).to.be.an.array();
                    Code.expect(course.result.data.length).to.equal(1);
                    Code.expect(course.result.data[0]).to.be.an.object();
                    Code.expect(course.result.data[0].course_id).to.equal(8);
                    Code.expect(course.result.data[0].course_name).to.equal('spanish');

                    done();
                });
            });
        });
    });
});

lab.experiment('Delete course with id {course_id}', () => {

    lab.beforeEach((done) => {

        deleteCourse = {
            method: 'DELETE',
            url: '/courses/6'
        };

        courseList = {
            method: 'GET',
            url: '/courses'
        };

        enrollmentList = {
            method: 'GET',
            url: '/students/21/courses'
        };

        done();
    });

    lab.test('it removes a course by id', (done) => {

        // get and validate initial course count
        server.inject(courseList, (list) => {

            Code.expect(list.result.data).to.be.an.array();
            Code.expect(list.result.data.length).to.equal(8);

            // get and validate initial count of courses a student is enrolled in
            server.inject(enrollmentList, (enrollments) => {

                Code.expect(enrollments.result.data).to.be.an.array();
                Code.expect(enrollments.result.data.length).to.equal(1);

                // delete course
                server.inject(deleteCourse, (deletion) => {

                    Code.expect(deletion.result.status).to.equal(204);

                    // get and validate final course count
                    server.inject(courseList, (updatedList) => {

                        Code.expect(updatedList.result.data).to.be.an.array();
                        Code.expect(updatedList.result.data.length).to.equal(7);

                        // get and validate final enrollment count
                        server.inject(enrollmentList, (updatedEnrollments) => {

                            Code.expect(updatedEnrollments.result.data).to.be.an.array();
                            Code.expect(updatedEnrollments.result.data.length).to.equal(0);

                            done();
                        });
                    });
                });
            });
        });
    });
});

lab.experiment('Get all Students', () => {

    lab.beforeEach((done) => {

        studentList = {
            method: 'GET',
            url: '/students'
        };

        done();
    });

    // get and validate list of students
    lab.test('it lists all of the students', (done) => {

        server.inject(studentList, (list) => {

            Code.expect(list.result.data).to.be.an.array();
            Code.expect(list.result.data.length).to.equal(21);

            done();
        });
    });
});

lab.experiment('Get Student {student_id}', () => {

    lab.beforeEach((done) => {

        studentGet = {
            method: 'GET',
            url: '/students/1'
        };

        done();
    });

    lab.test('it returns student specified by student_id', (done) => {

        // get and validate student
        server.inject(studentGet, (student) => {

            Code.expect(student.result.data).to.be.an.array();
            Code.expect(student.result.data.length).to.equal(1);
            Code.expect(student.result.data[0]).to.be.an.object();
            Code.expect(student.result.data[0].student_id).to.equal(1);
            Code.expect(student.result.data[0].student_name).to.equal('Sophia');

            done();
        });
    });
});

lab.experiment('Get Student\'s {student_id} Course enrollments', () => {

    lab.beforeEach((done) => {

        studentGetCourses = {
            method: 'GET',
            url: '/students/1/courses'
        };

        done();
    });

    lab.test('it returns courses for student specified by id', (done) => {

        // get and validate student
        server.inject(studentGetCourses, (student) => {

            Code.expect(student.result.data).to.be.an.array();
            Code.expect(student.result.data.length).to.equal(5);

            done();
        });
    });
});

lab.experiment('Create Student', () => {

    lab.beforeEach((done) => {

        studentCreateNamed = {
            method: 'POST',
            url: '/students?student_name=Andrew'
        };

        studentCreateUnNamed = {
            method: 'POST',
            url: '/students'
        };

        studentList = {
            method: 'GET',
            url: '/students'
        };

        done();
    });

    lab.test('it creates named and unnamed students', (done) => {

        // get and validate initial student list
        server.inject(studentList, (list) => {

            Code.expect(list.result.data).to.be.an.array();
            Code.expect(list.result.data.length).to.equal(21);

            // create named student
            server.inject(studentCreateNamed, (studentNamed) => {

                Code.expect(studentNamed.result.data).to.be.an.object();
                Code.expect(studentNamed.result.data.student_name).to.equal('Andrew');
                Code.expect(studentNamed.result.data.student_id).to.equal(22);

                // create unnamed student
                server.inject(studentCreateUnNamed, (studentUnNamed) => {

                    Code.expect(studentUnNamed.result.data).to.be.an.object();
                    Code.expect(studentUnNamed.result.data.student_name).to.equal('TO BE DETERMINED');
                    Code.expect(studentUnNamed.result.data.student_id).to.equal(23);

                    // get and validate final student list
                    server.inject(studentList, (updatedList) => {

                        Code.expect(updatedList.result.data).to.be.an.array();
                        Code.expect(updatedList.result.data.length).to.equal(23);

                        done();
                    });
                });
            });
        });
    });
});

lab.experiment('Delete Student {student_id}', () => {

    lab.beforeEach((done) => {

        studentDelete = {
            method: 'DELETE',
            url: '/students/4'
        };

        studentList = {
            method: 'GET',
            url: '/students'
        };

        enrollmentList = {
            method: 'GET',
            url: '/courses/4/students'
        };

        done();
    });

    lab.test('it deletes a student specified by id', (done) => {

        // get and validate initial student list
        server.inject(studentList, (list) => {

            Code.expect(list.result.data).to.be.an.array();
            Code.expect(list.result.data.length).to.equal(23);

            // get and validate initial enrollment list
            server.inject(enrollmentList, (enrollments) => {

                Code.expect(enrollments.result.data).to.be.an.array();
                Code.expect(enrollments.result.data.length).to.equal(2);

                // delete student
                server.inject(studentDelete, (studentNamed) => {

                    Code.expect(studentNamed.result.status).to.equal(204);

                    // get and validate final student list
                    server.inject(studentList, (updatedList) => {

                        Code.expect(updatedList.result.data).to.be.an.array();
                        Code.expect(updatedList.result.data.length).to.equal(22);

                        // get and validate final enrollment list
                        server.inject(enrollmentList, (updatedEnrollments) => {

                            Code.expect(updatedEnrollments.result.data).to.be.an.array();
                            Code.expect(updatedEnrollments.result.data.length).to.equal(1);

                            done();
                        });

                    });
                });
            });

        });
    });
});
